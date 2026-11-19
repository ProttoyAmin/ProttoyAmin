# Data Model — MongoDB Atlas

**Database:** `portfolio` (Atlas M0 shared cluster)
**ODM:** Mongoose 9 · **Indexes** declared in schema, verified via `npm run db:indexes`

Every document carries:

| Field | Type | Notes |
|---|---|---|
| `_id` | `ObjectId` | Primary key; serialised to `string` at the API boundary. |
| `createdAt` | `Date` | `timestamps: true` |
| `updatedAt` | `Date` | `timestamps: true` |

---

## 1. `settings` — singleton

Exactly **one** document (`_id: "site"`). Holds the ownership rule and site-wide configuration.

```ts
{
  _id: "site",
  ownerEmail: string,          // REQUIRED — the only account allowed into /admin
  siteTitle: string,
  tagline: string,
  description: string,
  hero: { greeting, headline, subheadline, ctaLabel, ctaHref, resumeUrl, portraitUrl },
  socials: [{ platform, label, url, icon }],
  theme: { default: "dark" | "light", accent: string },
  features: { contactEnabled: boolean, blogEnabled: boolean, twoFactorEnabled: boolean },
  tokenVersion: number,        // bump to revoke all sessions
  seo: { ogImageUrl, keywords: string[], author, location }
}
```

**Indexes:** none (singleton). Enforced by `getSettings()` returning the single doc, created on first access.

**Ownership transfer:** `ownerEmail` may only be changed by the current owner (requires password re-entry). The transfer increments `tokenVersion`, which invalidates the previous owner's session immediately.

---

## 2. `users` — admin identities

```ts
{
  email: string,               // unique, lower-cased
  passwordHash: string,        // bcrypt, cost 12
  name?: string,
  role: "owner",               // v1 ships owner-only
  totp?: { secret: string, confirmedAt: Date },
  tokenVersion: number,
  lastLoginAt?: Date,
  failedAttempts: number,
  lockedUntil?: Date
}
```

**Indexes:** `{ email: 1 }` unique. **Bootstrap:** on first boot, if no user exists, one is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env (password hashed immediately, env value never persisted).

---

## 3. `projects`

```ts
{
  title: string,
  slug: string,                // unique, derived from title, editable
  summary: string,             // one-liner for cards
  description: string,         // markdown body
  coverImage: { url, publicId, width, height, blurDataUrl, alt },
  gallery: [{ url, publicId, alt, width, height }],
  tags: string[],
  links: { repo?, live?, caseStudy? },
  featured: boolean,           // highlighted on the one-pager
  published: boolean,          // false = draft
  order: number,               // manual ordering
  metrics: [{ label, value }], // optional "impact" chips
  seo: { title, description },
  isDummy: boolean             // true for seeded demo content
}
```

**Indexes:** `{ slug: 1 }` unique · `{ published: 1, order: 1 }` · `{ tags: 1 }` · `{ isDummy: 1 }`

**Queries:** list = `find({ published: true }).sort({ order: 1, createdAt: -1 }).lean()`.

---

## 4. `experiences`

```ts
{
  company: string,
  role: string,
  employmentType?: string,     // Full-time · Contract · Freelance · Internship
  location?: string,
  startDate: string,           // ISO "YYYY-MM"
  endDate?: string,            // absent = current role
  description: string[],       // bullet points
  logo?: { url, publicId, alt },
  technologies?: string[],
  published: boolean,
  order: number,
  isDummy: boolean
}
```

**Indexes:** `{ order: 1, startDate: -1 }` · `{ isDummy: 1 }`

---

## 5. `skills`

```ts
{
  name: string,
  category: string,            // Frontend · Backend · Database · DevOps · AI/ML …
  icon?: string,               // emoji or icon key
  proficiency?: number,        // 1–5
  published: boolean,
  order: number,
  isDummy: boolean
}
```

**Indexes:** `{ category: 1, order: 1 }` · `{ isDummy: 1 }`

---

## 6. `posts` — blog

```ts
{
  title: string,
  slug: string,                // unique
  excerpt: string,
  content: string,             // markdown, sanitised on render
  coverImage?: { url, publicId, width, height, blurDataUrl, alt },
  tags: string[],
  readingTimeMinutes: number,  // computed on save
  published: boolean,
  publishedAt?: Date,
  seo: { title, description },
  isDummy: boolean
}
```

**Indexes:** `{ slug: 1 }` unique · `{ published: 1, publishedAt: -1 }` · `{ isDummy: 1 }`

---

## 7. `messages` — contact form inbox

```ts
{
  name: string,
  email: string,
  subject?: string,
  body: string,
  read: boolean,
  repliedAt?: Date,
  ip?: string,
  userAgent?: string
}
```

**Indexes:** `{ createdAt: -1 }` · `{ read: 1 }` · TTL optional on `expiresAt` (90 days) via `expireAfterSeconds`.

---

## 8. `media` — asset registry

```ts
{
  publicId: string,            // Cloudinary public_id (or local file id)
  provider: "cloudinary" | "local",
  url: string,                 // optimised delivery URL
  secureUrl: string,
  originalUrl: string,
  format: string,
  width: number,
  height: number,
  bytes: number,
  alt?: string,
  folder: string,
  usedBy: [{ collection, documentId }]   // reference tracking, blocks deletion
}
```

**Indexes:** `{ publicId: 1 }` unique · `{ provider: 1 }` · `{ createdAt: -1 }`

---

## 9. `auditLogs` — admin activity

```ts
{
  actorEmail: string,
  action: "create" | "update" | "delete" | "publish" | "login" | "logout" | "settings.write" | "ownership.transfer",
  entity: string,              // collection name
  entityId?: string,
  metadata?: object,
  ip?: string,
  at: Date                     // default: now
}
```

**Indexes:** `{ at: -1 }` · `{ actorEmail: 1, at: -1 }`

---

## 10. Dummy-content semantics

Seeded demo documents all carry `isDummy: true`. Resolution contract (implemented in `src/server/services/content.service.ts`):

```ts
export async function resolveCollection<T>(real: T[], dummy: T[]): Promise<T[]> {
  return real.length > 0 ? real : dummy;
}
```

Rules:
1. **Per collection**, not global — real projects never mix with dummy projects.
2. Dummy content is written by `npm run seed:dummy` (idempotent, upserts by `slug`).
3. The admin UI flags collections that are still serving dummy data and offers "Publish yours to replace".
4. Dummy content is **never** seeded in production unless `SEED_DUMMY=true` is explicitly set.

---

## 11. Atlas provisioning notes

- Cluster: **M0 (free)** — shared, 512 MB, 100 ops/s.
- **Database Access user**: `<app>-owner` with `readWriteAnyDatabase` on `portfolio`.
- **Network Access List**: for Atlas-free-tier, IP allowlist `0.0.0.0/0` is the only way to connect from dynamic Vercel IPs; the credential is the security boundary, so use a strong password. Alternatively set `MONGODB_ATLAS_API_KEY` and run `npm run atlas:provision` to manage the user + allowlist programmatically.
- **Connection string**: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/portfolio?retryWrites=true&w=majority`
- ⚠️ The Atlas **Data API** (API-key-based HTTP access) was **retired on 30 Sep 2025** and no longer exists — the app connects with the native driver over SRV/TLS, not with an API key.

---

## 12. Environment variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | production | SRV connection string |
| `MONGODB_DB_NAME` | production | Defaults to `portfolio` |
| `MONGODB_ATLAS_API_KEY` | optional | Atlas Admin API key — used only by `npm run atlas:provision` |
| `MONGODB_ATLAS_ORG_ID` | optional | Atlas organisation id (provisioning script) |
| `MONGODB_ATLAS_PROJECT_ID` | optional | Atlas project id (provisioning script) |
| `DB_DRIVER` | optional | `mongo` \| `memory` (default: auto-detect) |
| `CLOUDINARY_CLOUD_NAME` | production | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | production | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | production | Cloudinary API secret |
| `MEDIA_DRIVER` | optional | `cloudinary` \| `local` (default: auto-detect) |
| `SESSION_SECRET` | production | ≥ 32 chars, JWT signing key |
| `ADMIN_EMAIL` | first boot | Bootstrap owner email (defaults to `settings.ownerEmail`) |
| `ADMIN_PASSWORD` | first boot | Bootstrap password (hashed on first boot, never stored) |
| `RESEND_API_KEY` | optional | Contact-form delivery |
| `CONTACT_TO_EMAIL` | optional | Where contact messages are delivered |
| `NEXT_PUBLIC_SITE_URL` | production | Canonical origin (CSP + CSRF origin check) |
