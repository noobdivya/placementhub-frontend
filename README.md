# Placement Hub — frontend

Next.js (App Router) frontend for Placement Hub: separate portals for **students**, **companies** and the
**placement cell**, talking to the [placementhub-backend](https://github.com/noobdivya/placementhub-backend) API.

Live stack: **this app on [Vercel](https://vercel.com)** → **[placementhub-backend](https://github.com/noobdivya/placementhub-backend) on [Render](https://render.com)** → **[Neon](https://neon.tech)** (Postgres).

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- No client-side data-fetching library — a small typed `fetch` wrapper (`lib/api.ts`) plus a couple of
  hooks (`lib/hooks.ts`) handle loading/error state and access-token refresh

## Quick start (local)

```bash
npm install
cp .env.example .env.local        # set NEXT_PUBLIC_API_URL if the API isn't on localhost:8080
npm run dev                       # http://localhost:3000
```

Run the [backend](https://github.com/noobdivya/placementhub-backend) alongside it (`docker compose up -d db && go run ./cmd/api` there) —
this app has no API routes of its own; every request goes to `NEXT_PUBLIC_API_URL`.

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Structure

```
app/
  page.tsx                 marketing / landing page
  login/, register/, change-password/   auth flows
  students/                 student portal (jobs, applications, profile)      layout.tsx = portal shell + guard
  companies/                 company portal (post jobs, candidates)
  placementcell/              placement-cell portal (students, companies, drives, reports)
components/                shared UI: Shell, PortalShell, tables, boards, dialogs, icons
lib/
  api.ts                    typed fetch client — base URL, auth headers, access-token refresh/retry
  auth.tsx                  AuthProvider / useAuth (session state, login/logout)
  hooks.ts                  useFetch and friends (loading/error wrapper around lib/api)
  data.ts                   shared types/constants mirrored by the backend's domain model
  theme.ts                  light/dark theme toggle (localStorage + prefers-color-scheme)
```

Each portal's `layout.tsx` redirects unauthenticated or wrong-role users to `/login` — routing itself carries
no authorization logic beyond that guard; the API is the source of truth for what a user can see or do.

## Configuration

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | Base URL of the backend API, no trailing slash, e.g. `http://localhost:8080` locally or `https://placementhub-backend.onrender.com` in production. Conversely, *this app's own origin* (e.g. `https://placementhub-frontend.vercel.app`) must be listed in the backend's `CORS_ALLOWED_ORIGINS`. |

`NEXT_PUBLIC_*` variables are inlined into the JavaScript bundle **at build time**. Setting or changing
`NEXT_PUBLIC_API_URL` in Vercel always requires a new build (a redeploy), not just a restart.

Auth state: the access token is kept in memory only (never `localStorage`); the refresh token is an `httpOnly`
cookie set by the backend, scoped to its own `/auth` path, sent automatically via `credentials: "include"`. This
is why the backend's cookie settings (`COOKIE_SAMESITE`, `COOKIE_SECURE`) matter once frontend and backend are
on different domains — see the deployment section below.

## Deployment

### Vercel

1. Sign in at [vercel.com](https://vercel.com) → **Add New...** → **Project** → import the `placementhub-frontend`
   GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Root directory: leave as `.`. Build/output/install commands:
   leave the defaults (`next build`, `.next`, `npm install`).
3. Before the first deploy, expand **Environment Variables** and add:

   | Key | Value | Environments |
   |---|---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<your-backend>.onrender.com` (from deploying [the backend](https://github.com/noobdivya/placementhub-backend#2-api--render) first) | Production, Preview, Development |

   If you haven't deployed the backend yet, use a placeholder now and see step 5.
4. **Deploy.** Vercel builds and assigns a URL like `https://placementhub-frontend.vercel.app` (Vercel may
   suffix it, e.g. `-<random>.vercel.app`, if the name is taken — use whatever the dashboard shows as the
   **Production** domain).
5. Go back to the [backend on Render](https://github.com/noobdivya/placementhub-backend#2-api--render) and set its `FRONTEND_URL` and
   `CORS_ALLOWED_ORIGINS` to this exact Vercel domain (`https://...`, no trailing slash), then redeploy the
   backend. If you used a placeholder `NEXT_PUBLIC_API_URL` in step 3, fix it in Vercel's **Project → Settings →
   Environment Variables** now and trigger a redeploy (**Deployments → ⋯ → Redeploy**) so the correct URL is
   baked into the build.
6. Open the Vercel URL and confirm login works end-to-end (bootstrap admin credentials are in the backend's
   `BOOTSTRAP_ADMIN_*` env vars) — a failed login with a CORS error in the browser console almost always means
   step 5 wasn't done or doesn't match exactly (scheme, host, and **no trailing slash**, all three must match).

### Preview deployments

Every PR/branch gets its own `https://placementhub-frontend-<hash>-<team>.vercel.app` URL. Those won't work
against the API until they're also in the backend's `CORS_ALLOWED_ORIGINS` — either add a wildcard pattern your
setup supports, or treat preview deploys as frontend-only (they'll build and render fine; authenticated calls to
the API will fail CORS until added). For most single-college deployments this doesn't matter — just deploy from
`main`.

### Custom domain

Vercel: **Project → Settings → Domains**. After adding one, update the backend's `FRONTEND_URL` /
`CORS_ALLOWED_ORIGINS` to the custom domain (not the `.vercel.app` one) and redeploy the backend.

### Verifying

```bash
curl -I https://<your-app>.vercel.app          # 200
```

Then load the site, open DevTools → Network, and log in — the `POST /auth/login` request should go to your
Render URL and come back `200` with no CORS error.

## Notes

- Web Push (browser notifications) is implemented on the backend (`GET /push/vapid-public-key`, subscribe/unsubscribe
  endpoints) but this frontend does not yet register a service worker or prompt for permission — the in-app
  notification inbox works without it. Adding push here later needs a `public/sw.js` handling `push` and
  `notificationclick`, and a permission-request button; see the [backend README](https://github.com/noobdivya/placementhub-backend#notifications-v1).
- There is no server-side rendering of private data — every portal page is a client component that calls the
  API after mount, so there's nothing to cache or invalidate on the Next.js server itself. Vercel's default
  caching for static/marketing pages (`/`, `/login`, `/register`) applies normally.
