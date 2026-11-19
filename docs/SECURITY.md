# Security Model

**Scope:** the `/admin` panel of the portfolio platform.
**Central requirement:** *only the portfolio owner named in `settings.ownerEmail` may access the admin panel.*

---

## 1. Trust boundaries

| Zone | Trust | Contains |
|---|---|---|
| **Public** | Untrusted | `/` one-pager, `/api/contact`, public tRPC reads, static assets |
| **Admin** | Privileged | `/admin/**`, `/api/admin/**`, protected tRPC procedures |
| **Owner** | Fully trusted | The single account whose email equals `settings.ownerEmail` |
| **Data** | Trusted | MongoDB Atlas, Cloudinary, Resend |

Anything crossing from *Public* into *Admin* must clear a server-side authorization check. Client-side hiding of admin UI is presentation only.

---

## 2. Ownership enforcement (the core rule)

`settings.ownerEmail` is the single source of truth. There is no role table, no environment flag, and no URL parameter that can grant admin access.

### Three-part check

```ts
// src/server/auth/owner.ts
export async function requireOwner(): Promise<SessionUser> {
  const session = await readSession();                 // jose, httpOnly cookie
  if (!session) throw new UnauthorizedError();

  const settings = await getSettings();                // reads the singleton document
  if (!settings.ownerEmail) throw new ForbiddenError("Owner not configured");

  const isOwner =
    session.email.toLowerCase() === settings.ownerEmail.toLowerCase() &&
    (await getUserRole(session.email)) === "owner";

  if (!isOwner) throw new ForbiddenError();

  return session;
}
```

### Defence in depth — four layers

1. **Middleware** (`src/middleware.ts`)
   - Matches `/admin/:path*` and `/api/admin/:path*`.
   - No session → redirect `/admin/login`.
   - Session present but not owner → `403` (never redirect-loop; the login page shows "not authorised").
   - Middleware uses **only** the JWT payload (fast, edge-compatible) — it is a routing filter, not the boundary.

2. **Layout guard** — `(admin)/admin/layout.tsx` calls `requireOwner()` on the server; the admin shell never renders without it.

3. **Data-layer guard** — `requireOwner()` is the first line of **every** admin server action, protected tRPC procedure, and admin route handler. A bug in the UI that calls an action directly still gets a 403.

4. **Audit** — each rejected attempt and each successful mutation is recorded.

> The JWT is *not* trusted on its own: role is re-read from the database on each privileged call, so changing `ownerEmail` or deleting the user takes effect immediately (no waiting for token expiry).

---

## 3. Credentials & sessions

| Concern | Implementation |
|---|---|
| Password hashing | `bcryptjs`, cost 12, per-user random salt (library-managed) |
| Bootstrap | First boot creates the owner from `ADMIN_EMAIL`/`ADMIN_PASSWORD`; the plaintext is hashed and the env value is never written to the database |
| Password change | Requires current password; invalidates all sessions (`tokenVersion++`) |
| Reset | Password-reset via Resend email → single-use, 15-minute token stored hashed in `users` |
| Session token | HS256 JWT via `jose`: `{ sub, email, role, ver }`, TTL 7 days |
| Cookie | `HttpOnly` · `SameSite=Lax` · `Secure` (production) · `Path=/` · `Max-Age=604800` |
| Revocation | `users.tokenVersion` compared on every privileged request; logout bumps it for that user |
| Storage | Cookie only — never `localStorage` — so XSS cannot exfiltrate the session |
| 2FA | Optional TOTP (`otpauth`), per-user secret, verified server-side on login |

---

## 4. Brute-force & abuse controls

| Vector | Control |
|---|---|
| Password guessing | Token-bucket limiter: 5 attempts / 15 min per (IP + email); escalating lock on the user document after 10 failures |
| Credential stuffing | Per-email lockout independent of per-IP limit |
| Contact-form spam | Honeypot field + minimum dwell time + per-IP daily cap (20/day) + optional Cloudflare Turnstile |
| Enumeration | Login responses are identical for "unknown email" and "wrong password" (`401 Invalid credentials`) |
| API abuse | Per-IP rate limit on public mutation endpoints; admin endpoints additionally require ownership |

The limiter is an in-process implementation behind a `RateLimiter` interface, so Redis can be swapped in for multi-instance deployments without touching call sites.

---

## 5. Input handling

| Layer | Rule |
|---|---|
| Boundary validation | Every server action / tRPC input passes a **Zod** schema before touching the data layer; unknown keys are stripped |
| Output shaping | Repository `select` projections return only fields the UI needs — no password hashes or secrets in responses |
| Markdown | Blog/admin markdown is rendered with a sanitizer (`rehype-sanitize`) — no raw HTML, no script injection |
| Rich text | No WYSIWYG HTML storage; markdown only |
| Object IDs | Cast through `z.string().regex(/^[a-f0-9]{24}$/)` before use — no operator injection from user input |
| Query building | No string-built Mongo queries from user input; only whitelisted sort keys and filters |

---

## 6. Media upload security

1. Admin requests a **signed upload parameter** from `/api/upload/sign` — the route verifies ownership first.
2. The signed parameter is scoped to a fixed `folder` (`portfolio/`) and a resource type of `image`.
3. The browser uploads directly to Cloudinary; the app never proxies file bytes.
4. `/api/upload/complete` re-validates: resource type is `image`, size ≤ 10 MB, dimensions ≤ 25 MP, and the returned `public_id` starts with the expected folder.
5. Only after validation is a `media` document written.
6. Deletion is refused while the asset is referenced by a project/experience/post.

---

## 7. HTTP hardening

Applied in `next.config.ts` / middleware:

```text
Content-Security-Policy: default-src 'self';
  script-src 'self' 'nonce-<generated>';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://res.cloudinary.com;
  connect-src 'self' https://*.mongodb.net https://api.cloudinary.com;
  frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

- CSP uses **nonces** for Next.js inline scripts; `'unsafe-eval'` is enabled only in development.
- `SameSite=Lax` cookies + an `Origin`/`Referer` check on every mutating request provide CSRF defence.

---

## 8. Data protection

- Secrets live only in environment variables (`.env.local` is git-ignored; `.env.example` holds placeholders only).
- Password hashes never leave the server; tRPC responses are serialised through explicit `select` shapes.
- Sessions are server-revocable via `tokenVersion`.
- Audit log records actor, action, entity, timestamp and IP for every admin mutation.
- Contact-form messages store only what the visitor typed; optional TTL purge after 90 days.

---

## 9. Threat model (abridged)

| Threat | Mitigation |
|---|---|
| Non-owner logs in and edits content | Three-part ownership check at middleware + layout + every data call; role re-read from DB each request |
| Stolen/replayed session cookie | 7-day TTL, `tokenVersion` revocation, `HttpOnly` + `Secure`, server-side invalidation on password change/ownership transfer |
| XSS stealing the session | CSP with nonces, sanitised markdown, no `dangerouslySetInnerHTML` on untrusted content, `HttpOnly` cookie (not readable by JS) |
| CSRF on admin mutations | `SameSite=Lax` + strict `Origin` validation + nonces |
| Mass assignment (e.g. setting `role`) | Zod schemas with `.strict()`; role/isDummy never client-writable |
| NoSQL injection | Zod validation, typed casts, no raw `$where`/operator passthrough of user input |
| Malicious upload | Signed upload params, folder scoping, post-upload validation, reference-aware deletion |
| Brute force | Rate limiting, per-email lockout, generic error messages |
| Public contact-form abuse | Honeypot, dwell-time check, per-IP daily cap, optional Turnstile |
| Proxy/DNS-rebinding of the admin origin | `NEXT_PUBLIC_SITE_URL` pinned; CSP `frame-ancestors 'none'`; host allow-list in the platform config |

---

## 10. Pre-launch checklist

- [ ] `SESSION_SECRET` is a fresh ≥ 32-char random value, never committed
- [ ] `MONGODB_URI` uses a dedicated least-privilege database user
- [ ] Cloudinary API secret is rotated and stored only in the platform's encrypted env
- [ ] `ADMIN_PASSWORD` changed from the bootstrap value, then the env var removed
- [ ] 2FA enabled for the owner account
- [ ] CSP verified in production (no `'unsafe-eval'`)
- [ ] Rate limits verified with an automated request burst
- [ ] Audit log visible in the admin overview
- [ ] Backup/restore of the Atlas cluster configured (M0 has no automated backups — export `mongodump` on a schedule)
