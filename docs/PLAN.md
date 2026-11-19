# Build Plan

Ordered phases with acceptance criteria. Work proceeds top to bottom; each phase ends green on `lint`, `typecheck`, `test`, `build`.

**Status: all phases shipped.** The checklist below is kept as the record of what was built.

---

### P0 — Scaffold & tooling
- [x] Next.js 16 (App Router, `src/`, TS strict) + Tailwind v4 + ESLint flat config + Prettier
- [x] Dependencies pinned (see `docs/ARCHITECTURE.md` §2)
- [x] `next.config.ts` with security headers, image domains (`res.cloudinary.com`)
- [x] `src/app/layout.tsx`, `globals.css`, dark/light theme provider
- [x] `.env.example`, `.env.local` git-ignored, `.gitignore` hardened
- [x] `npm run lint` · `npm run typecheck` · `npm run build` · `npm test` all green
- [x] GitHub Actions: lint → typecheck → test → build

**Done when:** `npm run dev` boots with **zero** credentials and renders a shell page.

---

### P1 — Data layer
- [x] Mongoose schemas for `settings`, `users`, `projects`, `experiences`, `skills`, `posts`, `messages`, `media`, `auditLogs` + indexes
- [x] Repository interfaces per collection
- [x] `MongoXRepository` (Mongoose, lean, projected) and `MemoryXRepository` (file-backed JSON in `.data/`)
- [x] Driver registry: `mongo` when `MONGODB_URI` present, else `memory`; **refuses `memory` in production**
- [x] Dummy dataset (`src/seed/dummy.ts`) covering every collection, all tagged `isDummy: true`
- [x] `npm run seed:dummy` (idempotent upsert by slug)
- [x] `resolveCollection()` fallback service with unit tests

**Done when:** CRUD round-trips on the memory driver and dummy content resolves per collection.

---

### P2 — Auth & ownership
- [x] `bcryptjs` hashing (cost 12), password helpers, first-boot bootstrap from `ADMIN_EMAIL`/`ADMIN_PASSWORD`
- [x] `jose` session issue/verify, httpOnly cookie, 7-day sliding expiry, `tokenVersion` revocation
- [x] `requireOwner()` + `readSession()` + rate limiter (token bucket)
- [x] `src/proxy.ts` routing gate for `/admin/**`
- [x] `(admin)/admin/layout.tsx` server guard
- [x] Login page with failure states, lockout messaging, optional TOTP
- [x] Integration tests: owner ✅ · non-owner 403 ✅ · anonymous redirect ✅ · expired token ✅

**Done when:** a non-owner account cannot reach any admin surface or mutation.

---

### P3 — Public one-pager
- [x] Seven sections: Hero, About, Skills, Experience, Projects, Contact, Footer
- [x] Sticky glass nav with scroll-spy, mobile drawer, theme toggle, smooth scroll
- [x] Motion primitives: `Reveal`, `Stagger`, `Magnetic`, `Marquee`, `Counter`
- [x] Hero: gradient blobs, staggered entrance, headline mask reveal
- [x] Projects: filterable grid with `layout` transitions, hover lift
- [x] Experience: scroll-reveal timeline
- [x] Skills: grouped chips + tech marquee
- [x] `useReducedMotion` respected across all effects
- [x] `metadata` API, JSON-LD (`Person`, `CreativeWork`), `sitemap.ts`, `robots.ts`, OG image
- [x] Responsive at 360 / 768 / 1280 / 1920

**Done when:** the page renders a complete portfolio from dummy data and passes Lighthouse ≥ 95 (perf, a11y, best practices, SEO).

---

### P4 — Admin panel
- [x] Admin shell: sidebar/tab switcher, Overview, Projects, Experience, Skills, Blog, Messages, Media, Settings
- [x] List views with search/sort/filter, empty states, bulk delete with confirm
- [x] Slide-over editors (React Hook Form + Zod) for every entity
- [x] Draft/publish toggles, drag ordering, featured flag
- [x] Markdown editor for blog posts with sanitised preview
- [x] Message inbox: read/unread, reply via Resend, delete
- [x] Settings: site copy, socials, theme default, owner email transfer (password re-entry), 2FA toggle, password change
- [x] Demo-content banner per collection
- [x] Audit log written on every mutation

**Done when:** every content type is fully manageable from the browser without touching code.

---

### P5 — Media pipeline
- [x] `/api/upload/sign` (owner-guarded) → signed Cloudinary params, folder `portfolio/`
- [x] Browser-direct upload, `/api/upload/complete` validation + `media` document
- [x] Optimised delivery URLs (responsive widths, `q_auto`, `f_auto`, LQIP blur placeholder)
- [x] Media library: grid, copy URL, usage count, reference-aware delete
- [x] `local` driver (`.data/uploads/`) for dev/CI

**Done when:** uploads work end-to-end offline (local driver) and via Cloudinary when credentials exist.

---

### P6 — Contact, polish & deploy
- [x] Contact form: validation, honeypot, dwell-time check, per-IP cap, DB + email delivery
- [x] Message inbox integration
- [x] ISR revalidation on publish (`revalidatePath('/')`, `revalidateTag('portfolio')`)
- [x] OG images for projects/posts
- [x] `npm run atlas:provision` — Atlas Admin API script (DB user + IP allowlist) using `MONGODB_ATLAS_API_KEY`
- [x] Vercel production deploy; `DB_DRIVER=mongo`, `MEDIA_DRIVER=cloudinary`
- [x] Documentation: `README.md` (setup, env, deployment), `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`
- [x] Playwright e2e: owner login → create project → visible on `/`; non-owner → 403; contact → inbox

**Done when:** the live site serves the owner's content from Atlas and the admin panel is owner-only.

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server (memory driver unless `MONGODB_URI` is set) |
| `npm run build` / `start` | Production build & serve |
| `npm run lint` / `typecheck` / `format` | Quality gates |
| `npm test` | Vitest (unit + integration) |
| `npm run test:e2e` | Playwright |
| `npm run seed:dummy` | Idempotent dummy-content seed |
| `npm run admin:reset` | Reset the owner password (CLI, local access) |
| `npm run atlas:provision` | Create Atlas DB user + IP allowlist via the Atlas Admin API |
