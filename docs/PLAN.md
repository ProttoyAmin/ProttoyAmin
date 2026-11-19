# Build Plan

Ordered phases with acceptance criteria. Work proceeds top to bottom; each phase ends green on `lint`, `typecheck`, `test`, `build`.

---

### P0 — Scaffold & tooling
- [ ] Next.js 16 (App Router, `src/`, TS strict) + Tailwind v4 + ESLint flat config + Prettier
- [ ] Dependencies pinned (see `docs/ARCHITECTURE.md` §2)
- [ ] `next.config.ts` with security headers, image domains (`res.cloudinary.com`)
- [ ] `src/app/layout.tsx`, `globals.css`, dark/light theme provider
- [ ] `.env.example`, `.env.local` git-ignored, `.gitignore` hardened
- [ ] `npm run lint` · `npm run typecheck` · `npm run build` · `npm test` all green
- [ ] GitHub Actions: lint → typecheck → test → build

**Done when:** `npm run dev` boots with **zero** credentials and renders a shell page.

---

### P1 — Data layer
- [ ] Mongoose schemas for `settings`, `users`, `projects`, `experiences`, `skills`, `posts`, `messages`, `media`, `auditLogs` + indexes
- [ ] Repository interfaces per collection
- [ ] `MongoXRepository` (Mongoose, lean, projected) and `MemoryXRepository` (file-backed JSON in `.data/`)
- [ ] Driver registry: `mongo` when `MONGODB_URI` present, else `memory`; **refuses `memory` in production**
- [ ] Dummy dataset (`src/seed/dummy.ts`) covering every collection, all tagged `isDummy: true`
- [ ] `npm run seed:dummy` (idempotent upsert by slug)
- [ ] `resolveCollection()` fallback service with unit tests

**Done when:** CRUD round-trips on the memory driver and dummy content resolves per collection.

---

### P2 — Auth & ownership
- [ ] `bcryptjs` hashing (cost 12), password helpers, first-boot bootstrap from `ADMIN_EMAIL`/`ADMIN_PASSWORD`
- [ ] `jose` session issue/verify, httpOnly cookie, 7-day sliding expiry, `tokenVersion` revocation
- [ ] `requireOwner()` + `readSession()` + rate limiter (token bucket)
- [ ] `src/middleware.ts` gate for `/admin/**` and `/api/admin/**`
- [ ] `(admin)/admin/layout.tsx` server guard
- [ ] Login page with failure states, lockout messaging, optional TOTP
- [ ] Integration tests: owner ✅ · non-owner 403 ✅ · anonymous redirect ✅ · expired token ✅

**Done when:** a non-owner account cannot reach any admin surface or mutation.

---

### P3 — Public one-pager
- [ ] Seven sections: Hero, About, Skills, Experience, Projects, Contact, Footer
- [ ] Sticky glass nav with scroll-spy, mobile drawer, theme toggle, smooth scroll
- [ ] Motion primitives: `Reveal`, `Stagger`, `Magnetic`, `Marquee`, `Counter`
- [ ] Hero: gradient blobs, staggered entrance, headline mask reveal
- [ ] Projects: filterable grid with `layout` transitions, hover lift
- [ ] Experience: scroll-reveal timeline
- [ ] Skills: grouped chips + tech marquee
- [ ] `useReducedMotion` respected across all effects
- [ ] `metadata` API, JSON-LD (`Person`, `CreativeWork`), `sitemap.ts`, `robots.ts`, OG image
- [ ] Responsive at 360 / 768 / 1280 / 1920

**Done when:** the page renders a complete portfolio from dummy data and passes Lighthouse ≥ 95 (perf, a11y, best practices, SEO).

---

### P4 — Admin panel
- [ ] Admin shell: sidebar/tab switcher, Overview, Projects, Experience, Skills, Blog, Messages, Media, Settings
- [ ] List views with search/sort/filter, empty states, bulk delete with confirm
- [ ] Slide-over editors (React Hook Form + Zod) for every entity
- [ ] Draft/publish toggles, drag ordering, featured flag
- [ ] Markdown editor for blog posts with sanitised preview
- [ ] Message inbox: read/unread, reply via Resend, delete
- [ ] Settings: site copy, socials, theme default, owner email transfer (password re-entry), 2FA toggle, password change
- [ ] Demo-content banner per collection
- [ ] Audit log written on every mutation

**Done when:** every content type is fully manageable from the browser without touching code.

---

### P5 — Media pipeline
- [ ] `/api/upload/sign` (owner-guarded) → signed Cloudinary params, folder `portfolio/`
- [ ] Browser-direct upload, `/api/upload/complete` validation + `media` document
- [ ] Optimised delivery URLs (responsive widths, `q_auto`, `f_auto`, LQIP blur placeholder)
- [ ] Media library: grid, copy URL, usage count, reference-aware delete
- [ ] `local` driver (`.data/uploads/`) for dev/CI

**Done when:** uploads work end-to-end offline (local driver) and via Cloudinary when credentials exist.

---

### P6 — Contact, polish & deploy
- [ ] Contact form: validation, honeypot, dwell-time check, per-IP cap, DB + email delivery
- [ ] Message inbox integration
- [ ] ISR revalidation on publish (`revalidatePath('/')`, `revalidateTag('portfolio')`)
- [ ] OG images for projects/posts
- [ ] `npm run atlas:provision` — Atlas Admin API script (DB user + IP allowlist) using `MONGODB_ATLAS_API_KEY`
- [ ] Vercel production deploy; `DB_DRIVER=mongo`, `MEDIA_DRIVER=cloudinary`
- [ ] Documentation: `README.md` (setup, env, deployment), `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/SECURITY.md`
- [ ] Playwright e2e: owner login → create project → visible on `/`; non-owner → 403; contact → inbox

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
