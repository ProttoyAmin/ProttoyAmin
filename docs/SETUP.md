# Setup & Operations Guide

Everything below works **without a single cloud credential**. The app boots with a
local JSON store and local disk media, renders a complete demo portfolio, and
switches to MongoDB Atlas + Cloudinary the moment you add the environment
variables.

---

## 1. Boot it (30 seconds)

```bash
pnpm install
pnpm dev
```

> The project is pinned to **pnpm 10** (`packageManager` in `package.json`).
> `corepack enable` gives you the right version automatically. `npm install`
> also works, but the lockfile of record is `pnpm-lock.yaml`.

Open <http://localhost:3000> for the portfolio and
<http://localhost:3000/admin> for the admin panel.

**Development admin credentials** (created automatically on first sign-in):

| Field | Value |
|---|---|
| Email | `md.jahid.bin.amin@gmail.com` (or `ADMIN_EMAIL`) |
| Password | `portfolio-admin` (or `ADMIN_PASSWORD`) |

> The password is hashed with bcrypt on first boot and never stored in plain
> text. Change it from **Admin → Settings → Change password**, or run
> `pnpm run admin:reset -- "your-new-password"`.

Without any credentials the site still works end to end:

| Concern | Fallback |
|---|---|
| Database | File-backed JSON store at `.data/db.json` (auto-seeded with demo content) |
| Media | Local disk at `.data/uploads/`, served through `/api/media/[...path]` |
| Email | Messages are stored in the admin inbox, no delivery |
| Sessions | A development-only signing secret is used (a warning is logged) |

### Production needs `SESSION_SECRET`

`pnpm run dev` falls back to a built-in development signing secret.
**`pnpm run start` (production) does not** — it refuses to sign a session and
shows a visible banner instead:

> Admin sign-in is disabled because `SESSION_SECRET` is not configured.

Set it before the first production boot:

```bash
export SESSION_SECRET="$(openssl rand -base64 48)"
export ADMIN_PASSWORD="a-strong-password"
pnpm run build && pnpm run start
```

`ADMIN_PASSWORD` bootstraps the owner account on first sign-in. Without it
production has no owner to sign in as, and the admin panel stays locked.

### Boot commands

| Command | What it does |
|---|---|
| `pnpm run dev` | Development server on <http://localhost:3000> |
| `pnpm run build` | Production build |
| `pnpm run start` | Production server (requires `SESSION_SECRET`) |
| `pnpm run seed:dummy` | Writes the demo content into the configured database |
| `pnpm run admin:reset -- "<password>"` | Sets a new owner password |
| `pnpm run atlas:provision` | Creates the Atlas cluster, database and indexes |

### The admin pages

The admin is a set of **separate pages** — only the public portfolio is a
single page. Each one is a real route, so it can be bookmarked and reloaded.

| Route | What it does |
|---|---|
| `/admin` | Overview: content health, stats, recent activity |
| `/admin/projects` | CRUD for projects, cover image, links, publish/draft |
| `/admin/experience` | CRUD for the work timeline |
| `/admin/skills` | CRUD for skills, grouped by category |
| `/admin/writing` | CRUD for blog posts |
| `/admin/messages` | The contact-form inbox |
| `/admin/media` | The asset library and uploads |
| `/admin/settings` | Site copy, **appearance**, profile picture, account security |

### Change the look from the admin

`/admin/settings` → **Appearance** lets you:

- pick one of three themes — **Violet**, **Maroon** or **Emerald** — and see
  it applied live, before you save;
- type any hex colour if you want something else;
- choose whether a first-time visitor sees the light or the dark theme.

The chosen colour is stored in `settings.theme.accent` and applied as a CSS
variable, so the light and the dark theme are both derived from it.

### Change the profile picture

`/admin/settings` → **Hero** → **Profile picture**: upload a new image or
pick one from the media library, then press **Save settings**. The picture
appears in the hero of the public page.

---

## 2. Connect MongoDB Atlas

### The credential you need

Use a **Database Access user** (username + password) and build the SRV
connection string — Atlas → *Connect* → *Drivers* → Node.js:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/portfolio?retryWrites=true&w=majority
MONGODB_DB_NAME=portfolio
```

> ⚠️ **About the Atlas API key.** MongoDB retired the *Atlas Data API*
> (API-key based HTTP CRUD) on **30 September 2025**, so an API key alone can
> no longer read or write documents. The app therefore connects with the
> native driver over SRV/TLS.
>
> Your project **API key is still useful** — it drives the provisioning script
> below, which creates the database user, fixes the IP access list and prints
> the SRV string for you.

### Let the script set it up for you

```bash
MONGODB_ATLAS_API_KEY="<publicKey>:<privateKey>" \
MONGODB_ATLAS_ORG_ID="<orgId>" \
MONGODB_ATLAS_PROJECT_ID="<projectId>" \
pnpm run atlas:provision
```

The script:

1. creates (or resets) the `portfolio-app` database user with
   `readWriteAnyDatabase`,
2. adds `0.0.0.0/0` to the IP access list so serverless deployments can
   connect (the credentials remain the security boundary — use a strong
   password),
3. prints the variables to paste into `.env.local`.

Restart the dev server afterwards; the admin overview shows
`Driver: mongo` once it is connected.

### If Atlas is unreachable

The app **never crashes**. If `MONGODB_URI` is set but the cluster cannot be
reached, the registry logs the error, falls back to the local driver and the
admin panel shows a red banner with the failure reason. The public site keeps
serving demo content.

---

## 3. Connect Cloudinary (media)

1. Create a free account at <https://cloudinary.com> (25 credits/month, no card).
2. Dashboard → *API Keys* → copy **Cloud name**, **API key**, **API secret**.
3. Add to `.env.local`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

Uploads then go straight from the browser to Cloudinary (signed parameters, so
the app never proxies file bytes) and are delivered with automatic `f_auto`,
`q_auto` and responsive width transforms.

Delete the uploaded files in `.data/uploads/` at any time to return to local
storage.

---

## 4. Optional: email delivery

```env
RESEND_API_KEY=re_...
CONTACT_TO_EMAIL=you@example.com
CONTACT_FROM_EMAIL=Portfolio <hello@your-domain.com>
```

Without these, contact-form messages still land in **Admin → Messages**.

---

## 5. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | production | Canonical origin — CSP, CSRF origin check, OG URLs |
| `SESSION_SECRET` | production | JWT signing key (≥ 32 chars). `openssl rand -base64 48` |
| `MONGODB_URI` | production | Atlas SRV connection string |
| `MONGODB_DB_NAME` | production | Database name (default `portfolio`) |
| `MONGODB_ATLAS_API_KEY` | optional | Atlas Admin API key — used only by `pnpm run atlas:provision` |
| `MONGODB_ATLAS_ORG_ID` | optional | Atlas organisation id (provisioning) |
| `MONGODB_ATLAS_PROJECT_ID` | optional | Atlas project id (provisioning) |
| `DB_DRIVER` | optional | `mongo` \| `memory` — auto-detected when unset |
| `CLOUDINARY_CLOUD_NAME` | production | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | production | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | production | Cloudinary API secret |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | production | Public cloud name for client-side URLs |
| `MEDIA_DRIVER` | optional | `cloudinary` \| `local` — auto-detected when unset |
| `RESEND_API_KEY` | optional | Contact-form delivery |
| `CONTACT_TO_EMAIL` | optional | Where contact messages are delivered |
| `ADMIN_EMAIL` | first boot | Bootstrap owner email |
| `ADMIN_PASSWORD` | first boot | Bootstrap password (hashed immediately, then delete) |
| `PORTFOLIO_DATA_DIR` | optional | Where the local store writes (default `.data`) |

---

## 6. Scripts

| Command | What it does |
|---|---|
| `pnpm run dev` | Development server on :3000 |
| `pnpm run build` / `pnpm start` | Production build and server |
| `pnpm run lint` | ESLint (Next core-web-vitals + typescript rules) |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit + integration suite |
| `pnpm run seed:dummy` | Writes the demo content into the configured database |
| `pnpm run admin:reset -- "<password>"` | Resets the owner password |
| `pnpm run atlas:provision` | Creates the Atlas user + access list, prints the SRV URI |

---

## 7. Deploy to Vercel

1. Import the repository in Vercel (framework: Next.js).
2. Add the environment variables from the table above — at minimum
   `SESSION_SECRET`, `MONGODB_URI`, `MONGODB_DB_NAME`, the three `CLOUDINARY_*`
   variables and `NEXT_PUBLIC_SITE_URL`.
3. Set `DB_DRIVER=mongo` and `MEDIA_DRIVER=cloudinary` explicitly.
4. Deploy. `/` is statically rendered with a 5-minute revalidation window;
   publishing from the admin panel revalidates it immediately.

### Post-deploy checklist

- [ ] `SESSION_SECRET` is a fresh random value (not the development default)
- [ ] `ADMIN_PASSWORD` was changed, then removed from the environment
- [ ] The owner email in **Admin → Settings** is the address you actually use
- [ ] Two-factor authentication is enabled
- [ ] A `mongodump` schedule backs up the Atlas cluster (M0 has no automatic backups)

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| “Running in demo mode” banner | `MONGODB_URI` missing | Add the variable and restart |
| “The database is unreachable” banner | Bad URI, IP not allow-listed, cluster paused | Run `pnpm run atlas:provision` or allow-list `0.0.0.0/0` |
| Admin says “Access restricted” | The signed-in email is not `settings.ownerEmail` | Sign in with the owner account, or transfer ownership from Settings |
| Uploads fail | Cloudinary credentials incomplete | Check all three `CLOUDINARY_*` variables |
| Content edits do not appear | Browser cache | The page revalidates every 5 minutes; a publish revalidates immediately |
| Port 3000 already in use | Another dev server | `PORT=3001 pnpm run dev` |
