# Architecture — Portfolio Platform

**Status:** Implemented — P0 to P6 shipped (see [`PLAN.md`](./PLAN.md))
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
| API | Server Actions + Route Handlers | — | Mutations and admin reads cross the server boundary as actions; no client cache to invalidate, no extra client bundle. |
| Client data | React Server Components + `router.refresh()` | — | The admin panel reads through the server and re-renders after every mutation. |
| Forms | Controlled React state + shared Zod schemas | `zod 4.6.7` | One schema per entity, validated on the server and reused in the UI. |
| Validation | Zod | `4.6.7` | One schema source, shared client/server. |
| Auth | `jose` (JWT) + `bcryptjs` | `6.2.18` / `3.0.3` | Small, dependency-light, fully owned — no `next-auth` version churn. |
| Media | Cloudinary | `2.11.0` | Free tier (25 credits/mo), on-the-fly transforms, unsigned upload. |
| Images | `sharp` | `0.35.5` | Local fallback pipeline + OG image generation. |
| Email | Resend | — | Contact form delivery + password reset. |
| Tests | Vitest + Playwright | `5.1.1` / `1.65.1` | Unit/integration + one critical-path e2e. |
| Deploy | Vercel | — | Matches the repo's existing deployment footprint. |

**Deliberate omissions:** no Redux (server state belongs to RSC, UI state to local `useState`), no `next-auth` (a custom session is ~120 lines and avoids beta churn), no Prisma (the MongoDB connector lags behind the document semantics we need), no tRPC/TanStack Query (Server Actions cover every admin call with less machinery).

---

## 3. Runtime topology

```
                        ┌──────────────────────── Vercel Edge ────────────────────────┐
  Browser ──HTTPS──▶    │  Next.js 16 · App Router                                  │
   (public)             │   ├── /(public one-pager)      [RSC, static + ISR]       │
                        │   ├── /admin/*                [RSC shells + client panels]│
   (admin)  ──HTTPS──▶  │   ├── server actions          ["use server" mutations]     │
                        │   ├── /api/auth/*             [login, logout, session]    │
                        │   ├── /api/upload/*           [Cloudinary signed upload]  │
                        │   └── /api/contact            [public contact submit]     │
                        │            │                                             │
                        │            ├──▶ MongoDB Atlas  (Mongoose → repository)    │
                        │            ├──▶ Cloudinary     (media + transforms)      │
                        │            └──▶ Resend         (contact / reset mail)    │
                        └──────────────────────────────────────────────────────────┘
```

The network boundary (`src/proxy.ts`) performs coarse routing decisions only; every data read/write passes through server-side authorization.

---

## 4. Application structure

```
src/
├── app/
│   ├── (site)/page.tsx             # the public one-pager (composes seven sections)
│   ├── (admin)/admin/
│   │   ├── page.tsx                # admin shell + ownership guard
│   │   ├── layout.tsx              # chrome wrapper
│   │   └── login/page.tsx          # owner sign-in
│   ├── api/
│   │   ├── auth/{login,logout,session}/route.ts
│   │   ├── upload/{sign,local,complete,delete}/route.ts
│   │   ├── media/[...path]/route.ts   # serves locally uploaded images
│   │   └── contact/route.ts
│   ├── layout.tsx / globals.css / not-found.tsx / error.tsx
├── client/                         # ── CLIENT SIDE (every file is a client component)
│   ├── providers/                  # theme provider, toaster
│   ├── site/                       # nav, hero, about, skills, experience, projects, contact, footer
│   └── admin/                      # shell, panels, slide-over editors, image picker
├── components/
│   ├── motion/                     # Reveal, Stagger, Counter, Magnetic, Marquee
│   └── ui/                         # Button, Input, Sheet, Switch, Alert, Badge, Card
├── server/                         # ── SERVER SIDE (never imported by a client component)
│   ├── actions/admin.ts            # "use server" — every admin mutation
│   ├── auth/                       # token, session, password, owner guard, rate limit, bootstrap
│   ├── db/                         # connection, models, adapters, registry
│   ├── media/                      # storage contract + cloudinary/local drivers
│   ├── repositories/               # repository contracts + factory
│   ├── security/                   # CSP construction
│   ├── services/                   # content resolution, audit log, tagged cache
│   └── types.ts                    # domain entities
├── lib/                            # isomorphic helpers (cn, slug, format, zod schemas, media urls)
├── seed/dummy.ts                   # demo dataset
├── proxy.ts                        # Next 16 network boundary (was middleware.ts)
└── scripts/                        # seed-dummy, reset-admin, atlas-provision
```

**Rule (enforced by the `server-only` package):** `src/server/**` imports
`server-only`, so importing it from a client component fails the build. The
client tree lives in `src/client/**`, the shared tree in `src/lib/**` and
`src/components/**`. The dependency direction is one-way and enforced by the
compiler.

---

## 5. Rendering & data flow

### Public one-pager
- Server Component root reads all collections **in parallel** via the repository layer.
- Sections are pure server components; only isolated interactive islands are client components (nav scroll-spy, theme toggle, project filter, contact form, animated counters).
- The page is rendered **per request** (`await connection()`), because it carries a per-request CSP nonce — a cached page would replay a stale nonce and the browser would block every script.
- The database read is wrapped in a **tagged** Next.js data cache (`src/server/services/site-content-cache.ts`, tag `site-content`). Every admin mutation calls `updateTag('site-content')`, so a publish is visible on the very next public request — no redeploy, no stale window.
- Admin publishes additionally trigger `revalidatePath('/')` and `revalidatePath('/admin')`.
- Because it is one page, SEO is concentrated: `metadata` API, JSON-LD `Person` + `CreativeWork` per project, `sitemap.ts`, `robots.ts`, OG image generated at build via `opengraph-image.tsx`.

### Admin
- Route group `(admin)` → `/admin` shell with a **tab switcher** (Overview, Projects, Experience, Skills, Writing, Messages, Media, Settings).
- The page is a server component: it verifies ownership, loads every collection in parallel and hands plain data to the client shell.
- Each tab is a client component; create/edit happens in a **slide-over** editor with no page navigation.
- Mutations are Server Actions (`src/server/actions/admin.ts`). Each action re-validates the payload with Zod, calls `requireOwner()`, writes through the repository, records an audit entry, updates the `site-content` cache tag and revalidates `/` and `/admin`; the client then calls `router.refresh()`.
- The admin tabs are a real ARIA tablist (`role="tablist"` / `role="tab"` / `role="tabpanel"`), so keyboard and screen-reader navigation behave correctly.
- Every form control is wrapped in `Field`, which generates an id and links the `<label>` to the control — the labels are programmatically associated, not just visual.

---

## 6. Persistence layer

### Repository pattern
Two layers keep the drivers interchangeable:

1. **`CollectionAdapter`** (`src/server/db/adapter.ts`) — the tiny persistence
   contract: `list`, `findOne`, `insert`, `update`, `remove`, `count`,
   `removeMany`.
   - `MongoAdapter` — wraps a Mongoose model, `lean()` queries, index-friendly projections.
   - `MemoryAdapter` — a file-backed JSON store (`.data/db.json`) with atomic
     writes and a serialised mutation queue.
2. **Typed repositories** (`src/server/repositories/factory.ts`) — built on top
   of an adapter, adding the entity-specific queries (`listPublished`,
   `getBySlug`, `getByEmail`, …).

```ts
interface CollectionAdapter<T> {
  list(filter?: QueryFilter, sort?: SortSpec): Promise<T[]>
  findOne(filter: QueryFilter): Promise<T | null>
  insert(doc: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>
  update(id: string, patch: Partial<T>): Promise<T | null>
  remove(id: string): Promise<boolean>
}
```

The memory adapter re-reads the file whenever it changes on disk, because
Next.js compiles server components and route handlers into separate module
graphs — a naive in-memory cache would serve stale documents.

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
- `src/proxy.ts` (the Next 16 network boundary) — two jobs: it generates the per-request CSP nonce that Next.js stamps onto every script, and it acts as a coarse routing gate for `/admin/**` (unauthenticated visitors are redirected to `/admin/login`). It never gates a public route.
- `requireOwner()` in the admin page and in **every** server action and admin route handler — it re-reads `settings.ownerEmail` and the user document on each call, so a stale cookie, a deleted account or an ownership transfer takes effect immediately.
- The client-side `AdminShell` hides admin UI, but this is cosmetic only — never a security boundary.

The pure decision function (`evaluateOwnership`) is unit tested in
`tests/ownership.test.ts`.

`settings.ownerEmail` is editable **only** by the current owner and requires re-entering the password; changing it transfers ownership and immediately revokes the previous owner's session.

### Hardening
- Login rate limit: 5 attempts / 15 min / IP+email (in-memory token bucket, Redis-ready interface).
- Optional TOTP 2FA (`otpauth`) — enable flag in settings.
- CSRF: mutating endpoints require the `Origin` header to match `NEXT_PUBLIC_SITE_URL`; `SameSite=Lax` cookies back this up.
- Security headers: a nonce-based `Content-Security-Policy` built per request in `src/proxy.ts` (see `src/server/security/csp.ts`), plus `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS. The nonce is mandatory: without it the browser blocks every bundle and the page never hydrates.
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
| **P0** | Scaffold, tooling, CI, env contract | ✅ `npm run dev` boots with zero credentials; lint/typecheck/build green|
| **P1** | Data layer: schemas, repositories, seeds | ✅ Memory driver round-trips CRUD; dummy dataset resolves per collection|
| **P2** | Auth & ownership | ✅ Owner/non-owner/anonymous matrix passes integration tests; `/admin` unreachable for non-owners|
| **P3** | Public one-pager | ✅ Seven sections render from the data layer; responsive; Lighthouse ≥ 95 on perf/a11y|
| **P4** | Admin shell + tabs + editors | ✅ Full CRUD on all tabs via slide-over editors; audit log written|
| **P5** | Media pipeline | ✅ Cloudinary upload → transformed delivery → deletion; local driver works offline|
| **P6** | Contact form, email, polish, deploy | ✅ Message lands in inbox + email; Vercel production deploy green|

---

## 15. Related documents

- [`DATA_MODEL.md`](./DATA_MODEL.md) — collections, fields, indexes
- [`SECURITY.md`](./SECURITY.md) — threat model and ownership enforcement details
- [`PLAN.md`](./PLAN.md) — build checklist
