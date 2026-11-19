# Architecture — Portfolio Platform

**Status:** Specification approved, build not yet started (awaiting go-ahead)
**Date:** 2026-11-19
**Owner:** Prottoy Amin

---

## 1. Goals & non-goals

### Goals
1. A **single-page** public portfolio (`/`) — modern, minimal, animation-rich but restrained.
2. A **tabbed admin panel** (`/admin`) where the owner uploads and manages every piece of content.
3. **Strict ownership**: only the account named in `settings.ownerEmail` may enter the admin panel. No other account, no role, no email, ever.
4. **Production-ready**: typed end-to-end, tested, CI-gated, deployable to Vercel with no code changes.
5. **Runs with zero cloud credentials**: a local memory/file driver backs dev, CI and preview environments, so the repo clones and runs without Atlas or Cloudinary accounts.

### Non-goals
- Multi-tenant / multi-author SaaS. The roles model exists (`owner`), but no invitation or delegation UI ships.
- Blog comments, newsletters, analytics dashboards, i18n (English-only for v1).
- Video/audio pipeline beyond what Cloudinary handles natively.

---

## 2. Stack

| Layer | Choice | Version (verified) | Why |
|---|---|---|---|
| Framework | Next.js (App Router, RSC) | `16.4.6` | SSR/SSG for SEO + one codebase for site and admin. |
| UI runtime | React | `19.3.1` | Required by Next 16. |
| Language | TypeScript (`strict`) | — | End-to-end type safety; `zod` at every boundary. |
| Styling | Tailwind CSS | `4.3.5` | CSS-first config, fast iteration, tiny output. |
| Components | shadcn/ui (Radix primitives) | — | Accessible headless primitives, no design-system lock-in. |
| Animation | Motion (Framer Motion) | `14.14.0` | `whileInView`, `layout` transitions, `AnimatePresence`, `useReducedMotion`. |
| Database | MongoDB Atlas (M0 free tier) | — | Document model matches portfolio content; free tier is sufficient. |
| ODM | Mongoose | `9.12.2` | Schema validation, indexes, `lean()` queries, transactions. |
| Driver | `mongodb` | `7.9.1` | Underlying driver (Mongoose peer dependency). |
| API | tRPC + Server Actions + Route Handlers | `@trpc/server 11.29.5` | Type-safe client↔server calls; actions for simple mutations. |
| Client data | TanStack Query | `5.108.1` | Cache/invalidation for admin panels. |
| Forms | React Hook Form | `7.92.0` | + Zod 4 resolver. |
| Validation | Zod | `4.6.7` | One schema source, shared client/server. |
| Auth | `jose` (JWT) + `bcryptjs` | `6.2.18` / `3.0.3` | Small, dependency-light, fully owned — no `next-auth` version churn. |
| Media | Cloudinary | `2.11.0` | Free tier (25 credits/mo), on-the-fly transforms, unsigned upload. |
| Images | `sharp` | `0.35.5` | Local fallback pipeline + OG image generation. |
| Email | Resend | — | Contact form delivery + password reset. |
| Tests | Vitest + Playwright | `5.1.1` / `1.65.1` | Unit/integration + one critical-path e2e. |
| Deploy | Vercel | — | Matches the repo's existing deployment footprint. |

**Deliberate omissions:** no Redux (server state belongs to RSC/TanStack Query, UI state to local `useState`), no `next-auth` (custom session is ~120 lines and avoids beta churn), no Prisma (MongoDB connector lags behind DDL semantics we don't need).

---

## 3. Runtime topology

```
                        ┌──────────────────────── Vercel Edge ────────────────────────┐
  Browser ──HTTPS──▶    │  Next.js 16 · App Router                                  │
   (public)             │   ├── /(public one-pager)      [RSC, static + ISR]       │
                        │   ├── /admin/*                [RSC shells + client panels]│
   (admin)  ──HTTPS──▶  │   ├── /api/trpc/*             [tRPC router]               │
                        │   ├── /api/auth/*             [login, logout, session]    │
                        │   ├── /api/upload/*           [Cloudinary signed upload]  │
                        │   └── /api/contact            [public contact submit]     │
                        │            │                                             │
                        │            ├──▶ MongoDB Atlas  (Mongoose → repository)    │
                        │            ├──▶ Cloudinary     (media + transforms)      │
                        │            └──▶ Resend         (contact / reset mail)    │
                        └──────────────────────────────────────────────────────────┘
```

Edge middleware performs coarse routing decisions only; every data read/write passes through server-side authorization.

---

## 4. Application structure

```
src/
├── app/
│   ├── (site)/                     # public one-pager
│   │   ├── layout.tsx              # shell: fonts, theme provider, background FX
│   │   └── page.tsx                # composes the seven sections
│   ├── (admin)/admin/
│   │   ├── layout.tsx              # admin shell (guarded in middleware + layout)
│   │   ├── page.tsx                # overview tab
│   │   └── login/page.tsx
│   ├── api/
│   │   ├── trpc/[trpc]/route.ts
│   │   ├── auth/{login,logout,session}/route.ts
│   │   ├── upload/{sign,complete,delete}/route.ts
│   │   └── contact/route.ts
│   ├── layout.tsx / globals.css / not-found.tsx / error.tsx / sitemap.ts / robots.ts
│   └── opengraph-image.tsx
├── components/
│   ├── site/                       # hero, about, skills, experience, projects, contact, footer, nav
│   ├── admin/                      # shell, tabs, tables, slide-over editors, media library
│   ├── motion/                     # shared primitives: Reveal, Stagger, Magnetic, Marquee
│   └── ui/                         # shadcn primitives
├── server/
│   ├── db/                         # connection, registry, driver selection
│   ├── models/                     # Mongoose schemas (mongo driver only)
│   ├── repositories/               # interfaces + mongo/memory implementations
│   ├── services/                   # domain logic (project.service, auth.service, ...)
│   ├── auth/                       # session, password, owner-guard, rate-limit
│   ├── media/                      # storage interface + cloudinary/local drivers
│   └── trpc/                       # router, procedures, context
├── lib/                            # pure helpers (slug, cn, dates, validation schemas)
├── seed/                           # dummy dataset + seeding routine
└── styles/
```

**Rule:** `src/server/**` never imports from `src/components/**`. Server code is importable from RSC, route handlers, and tRPC alike.

---

## 5. Rendering & data flow

### Public one-pager
- Server Component root reads all collections **in parallel** via the repository layer.
- Sections are pure server components; only isolated interactive islands are client components (nav scroll-spy, theme toggle, project filter, contact form, animated counters).
- `export const revalidate = 300` → ISR. Admin publishes trigger `revalidatePath('/')` + `revalidateTag('portfolio')` so changes appear without redeploy.
- Because it is one page, SEO is concentrated: `metadata` API, JSON-LD `Person` + `CreativeWork` per project, `sitemap.ts`, `robots.ts`, OG image generated at build via `opengraph-image.tsx`.

### Admin
- Route group `(admin)` → `/admin` shell with a **tab switcher** (Overview, Projects, Experience, Skills, Blog, Messages, Media, Settings).
- Each tab = client component panel talking to tRPC; list + **slide-over editor** for create/edit (no page navigation).
- Mutations are Server Actions where a single record is involved (simpler, no client cache to invalidate) and tRPC mutations where a list is affected. TanStack Query invalidation drives refresh.

---

## 6. Persistence layer

### Repository pattern
Every collection is exposed as a TypeScript interface with two implementations:

```ts
interface ProjectRepository {
  list(opts: { publishedOnly?: boolean; limit?: number }): Promise<Project[]>
  getBySlug(slug: string): Promise<Project | null>
  getById(id: string): Promise<Project | null>
  upsert(input: ProjectInput): Promise<Project>
  remove(id: string): Promise<void>
}
```

- `MongoProjectRepository` — Mongoose, `lean()`, projection + index-friendly queries.
- `MemoryProjectRepository` — file-backed JSON store (`.data/db.json`), dev/CI only.

`DB_DRIVER=mongo|memory` (default: `memory` when `MONGODB_URI` is absent, `mongo` otherwise). The in-memory driver is **never** used in production — `src/server/db/registry.ts` refuses to boot with `memory` when `NODE_ENV === 'production'`.

### Dummy-content fallback (semantic contract)
Each seed document carries `isDummy: true`. The public page resolves per collection:

```
visible(collection) = realDocs(collection).length > 0 ? realDocs(collection) : dummyDocs(collection)
```

Consequences:
- A freshly cloned repo shows a **complete, polished** portfolio.
- The moment the owner publishes one real project, dummy projects disappear (they are not mixed in).
- Mixed states are handled per collection, so partial uploads degrade gracefully.
- The admin UI labels any collection still serving dummy data with a **"Demo content"** banner and an explicit "Publish yours to replace" call to action.

---

## 7. Media pipeline

| Concern | Decision |
|---|---|
| Storage | Cloudinary (free tier, 25 credits/mo). |
| Upload path | Admin requests a signed upload parameter from `/api/upload/sign` → browser uploads **directly to Cloudinary** (no proxying through Vercel) → `/api/upload/complete` records the asset in `media`. |
| Deliverables | Delivery URLs are transformed on demand: `f_auto,q_auto,c_limit,w_<preset>` for responsive widths, `e_blur:1000,q_1` for LQIP placeholders. |
| Validation | MIME + magic-byte check, 10 MB cap (Cloudinary free limit), image-only for covers, PDF/zip allowed for project attachments. |
| Local driver | `MEDIA_DRIVER=local` writes to `.data/uploads/` and serves via `/api/media/[...path]` — used in dev/CI so the upload flow is testable without an account. |
| Deletion | Deleting a `media` record triggers Cloudinary destroy; `media` refs are soft-detached from projects first. |

---

## 8. Auth & authorization model

### Session
- Login: email + password → `bcryptjs.compare` → issue HS256 JWT (`jose`) `{ sub, email, role, iat, exp }` → `Set-Cookie: pa_session=<jwt>; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=7d`.
- 7-day sliding expiry; logout revokes the cookie and increments `tokenVersion` on the user document (server-side revocation).

### Ownership rule (the core requirement)
`settings.ownerEmail` (single document, `settings` collection) is the **only** source of truth for who may administer. Access to any admin surface requires **all** of:

1. A valid, unexpired session cookie.
2. `session.email === settings.ownerEmail` (case-insensitive).
3. `users.role === 'owner'` for that user document.

Enforcement points:
- `middleware.ts` — coarse route gate for `/admin/**` and `/api/admin/**`; redirects unauthenticated users to `/admin/login`, returns 403 for authenticated non-owners.
- `requireOwner()` — called at the top of **every** server action, tRPC protected procedure, and admin route handler. It re-reads `settings.ownerEmail` on each call (no caching of the owner value across requests beyond the request scope).
- The client-side `AdminShell` hides admin UI, but this is cosmetic only — never a security boundary.

`settings.ownerEmail` is editable **only** by the current owner and requires re-entering the password; changing it transfers ownership and immediately revokes the previous owner's session.

### Hardening
- Login rate limit: 5 attempts / 15 min / IP+email (in-memory token bucket, Redis-ready interface).
- Optional TOTP 2FA (`otpauth`) — enable flag in settings.
- CSRF: mutating endpoints require the `Origin` header to match `NEXT_PUBLIC_SITE_URL`; `SameSite=Lax` cookies back this up.
- Security headers: strict `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS.
- Audit log: every admin mutation writes `{ actor, action, entity, entityId, at, ip }` to `auditLogs`.

---

## 9. Admin capability matrix

| Tab | Capabilities |
|---|---|
| **Overview** | Content health (which collections still serve dummy data), recent messages, quick stats, demo-content banner. |
| **Projects** | CRUD, cover upload, tag chips, links (repo/live/case study), ordering (drag), `featured` flag, draft/publish, SEO fields. |
| **Experience** | CRUD timeline entries: company, role, employment type, period, location, bullet list, logo. |
| **Skills** | CRUD grouped by category, icon/emoji, proficiency, ordering. |
| **Blog** | CRUD markdown posts: title, slug, excerpt, cover, tags, draft/publish, reading time, sanitized render. |
| **Messages** | Inbox from the public contact form: read/unread, filter, delete, reply via email. |
| **Media** | Asset library: grid, upload, copy URL, usage count, delete (blocked while referenced). |
| **Settings** | Site title/tagline, hero copy, socials, theme default, owner email (transfer), 2FA toggle, admin password change. |

---

## 10. Design & animation system

**Aesthetic:** modern, minimal, generous whitespace, one accent colour, subtle glass surfaces, dark-first with a light theme (toggle persisted to `localStorage`, `prefers-color-scheme` respected on first visit).

**Motion rules (Motion v14 / Framer Motion):**
- Reveal primitive: `initial={{ opacity: 0, y: 16 }}` → `whileInView` → `viewport={{ once: true, margin: '-80px' }}`, `duration 0.5`, `ease [0.22, 1, 0.36, 1]`.
- Hero: staggered children (`staggerChildren: 0.08`), word-by-word headline mask reveal, floating gradient blobs (`filter: blur`, 20–30s loop).
- Projects grid: `layout` + `AnimatePresence` for filter transitions; hover = scale 1.02 + shadow, no layout thrash.
- Timeline: each entry reveals on scroll with 60ms stagger.
- Counters: spring-driven numeric count-up on first view.
- Micro-interactions: magnetic buttons, nav underline via `layoutId`, form field focus ring transitions.
- Accessibility: `useReducedMotion()` → all transforms collapse to opacity fades; no infinite loops beyond decorative blobs; all animations respect `prefers-reduced-motion`.

**Performance budget:** LCP < 2.0s (p95), CLS < 0.05, JS ≤ 180 KB gzip on the public route, animation work confined to `transform`/`opacity` (compositor-friendly, no layout thrash).

---

## 11. Deployment

| Service | Plan | Purpose |
|---|---|---|
| Vercel | Hobby → Pro | Next.js hosting, edge/CDN, preview deploys per PR |
| MongoDB Atlas | M0 free | Primary database (512 MB shared) |
| Cloudinary | Free (25 credits/mo) | Media + transformations |
| Resend | Free (3k/mo) | Contact form + reset mail |
| GitHub Actions | Free | CI: lint, typecheck, unit tests, build |

**Environments:** `preview` (per-PR, memory driver), `production` (Atlas + Cloudinary, `DB_DRIVER=mongo`).
**Release flow:** branch → PR → CI → Vercel preview → merge to `main` → production → seed check (never auto-seed in production).

---

## 12. Testing strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | slugify, validators, password hashing, session encode/decode, fallback resolution logic |
| Integration | Vitest + memory driver | repository CRUD, ownership guard (owner vs non-owner vs anonymous), contact submit |
| Contract | Vitest | Zod schemas reject malformed payloads |
| E2E | Playwright | login as owner → create project → appears on `/`; login as non-owner → 403; contact form → message in inbox |

Coverage gate: ≥ 80% on `src/server/{auth,repositories,services}`.

---

## 13. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Cloudinary free credits exhausted (heavy images) | Broken/expensive delivery | Upload policy caps 10 MB, auto-`q_auto`, WebP/AVIF, one credit covers 1 GB bandwidth; admin shows credit-aware media panel |
| Atlas M0 shared cluster latency / 100 ops/s cap | Slow admin on large datasets | Lean queries + indexes; memory driver for preview; upgrade path to M10 |
| Content model churn as the owner experiments | Schema migrations | Mongoose is schemaless by default; new fields are additive and optional |
| Animation bundle bloat | Slow LCP | Motion imported per-component; animation primitives are tiny; reduced-motion path skips effects |
| Owner loses credentials | Site locked out | Recovery via `ADMIN_EMAIL`/`ADMIN_PASSWORD` bootstrap env + a documented `npm run admin:reset` script |

---

## 14. Roadmap

| Phase | Deliverable | Acceptance criteria |
|---|---|---|
| **P0** | Scaffold, tooling, CI, env contract | `npm run dev` boots with zero credentials; lint/typecheck/build green |
| **P1** | Data layer: schemas, repositories, seeds | Memory driver round-trips CRUD; dummy dataset resolves per collection |
| **P2** | Auth & ownership | Owner/non-owner/anonymous matrix passes integration tests; `/admin` unreachable for non-owners |
| **P3** | Public one-pager | Seven sections render from the data layer; responsive; Lighthouse ≥ 95 on perf/a11y |
| **P4** | Admin shell + tabs + editors | Full CRUD on all tabs via slide-over editors; audit log written |
| **P5** | Media pipeline | Cloudinary upload → transformed delivery → deletion; local driver works offline |
| **P6** | Contact form, email, polish, deploy | Message lands in inbox + email; Vercel production deploy green |

---

## 15. Related documents

- [`DATA_MODEL.md`](./DATA_MODEL.md) — collections, fields, indexes
- [`SECURITY.md`](./SECURITY.md) — threat model and ownership enforcement details
- [`PLAN.md`](./PLAN.md) — build checklist
