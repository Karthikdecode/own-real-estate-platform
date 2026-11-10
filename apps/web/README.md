# @real-estate/web

Next.js 16 (App Router) front end of the Real Estate Platform. It renders the public, crawlable
pages (search, property details, marketing pages) and the owner area, and it talks to the Express
API (`apps/api`) through one typed integration layer built on `@real-estate/contracts`.

## Responsibilities

- Server-render public pages with correct metadata (canonical, Open Graph, Twitter, robots).
- Provide the owner area (listings, photos, inquiries) on top of the API's HttpOnly cookie session.
- Call the API only through `src/lib/api`, validating every response against the shared contracts.
- Keep no business rules of its own: forms validate with the same Zod schemas the API enforces,
  and the API stays the source of truth.

**Current phase: foundation.** Routing, layouts, design primitives, loading/error/not-found states,
SEO utilities, environment handling and the API layer are complete. Feature pages are honest
placeholders that state the roadmap phase delivering them. The homepage proves the app runs and
can reach `GET /api/v1/health` from the Next.js server and from the browser.

## Scripts

Run from the repository root (`pnpm dev:web` also builds the contracts package first):

| Command                                     | Purpose                                                         |
| ------------------------------------------- | --------------------------------------------------------------- |
| `pnpm --filter @real-estate/web dev`        | `next dev` on http://localhost:3000                             |
| `pnpm --filter @real-estate/web build`      | Production build (Turbopack); requires the `NEXT_PUBLIC_*` vars |
| `pnpm --filter @real-estate/web start`      | Serve the production build                                      |
| `pnpm --filter @real-estate/web type-check` | `next typegen` (route types, `PageProps`, `LayoutProps`) + tsc  |
| `pnpm --filter @real-estate/web lint`       | ESLint: Next core-web-vitals + TypeScript + type-aware rules    |
| `pnpm --filter @real-estate/web test`       | Vitest (jsdom) + Testing Library                                |

## Environment variables

`next.config.ts` reads the monorepo-root `.env` with Node's `util.parseEnv` and copies **only**
these keys into `process.env`, never overriding values that are already set (least privilege: the
web process never sees database credentials or JWT secrets). Precedence: process environment,
then `apps/web/.env*` (loaded by Next.js itself), then the root `.env`.

| Variable                   | Required | Visibility                         | Purpose                                                                         |
| -------------------------- | -------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | yes      | browser + server, inlined at build | API base URL incl. version, e.g. `http://localhost:4000/api/v1`                 |
| `NEXT_PUBLIC_SITE_URL`     | yes      | browser + server, inlined at build | Public origin of this app; base of canonical and Open Graph URLs                |
| `API_INTERNAL_BASE_URL`    | no       | server only, read at runtime       | Server-to-API base URL (e.g. a container network); falls back to the public one |

Validation lives in `src/config/env.ts` (public values, safe for browser bundles) and
`src/config/server-env.ts` (`server-only`).

**Missing values fail the build; there are no defaults.** `NEXT_PUBLIC_*` values are frozen into
the JavaScript at build time, so a silent `localhost` fallback would ship a production bundle that
points every browser at `localhost`. `next build` stops with a message naming each missing or
invalid variable, and `next dev` shows the same message on the first request. `lint`, `type-check` and `test` need no
environment (tests use fixed values from `vitest.config.mts`). Create the root `.env` with
`pnpm setup:env`, or provide the values in the shell, for example in PowerShell:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL = 'http://localhost:4000/api/v1'
$env:NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
pnpm --filter @real-estate/web build
```

## Folder map

| Folder                                            | Contents                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/app`                                         | Routes only: root layout, homepage, loading/error/not-found, `icon.svg`  |
| `src/app/(public)`                                | Crawlable pages: properties search, property details, about, contact     |
| `src/app/(auth)`                                  | Login and register in a narrow centered layout, `noindex`                |
| `src/app/(account)`                               | Owner area shell (`noindex`); the session guard arrives in phase 1       |
| `src/components/ui`                               | Design primitives: `Button`, `ButtonLink`, `Container`                   |
| `src/components/layout`                           | Header, footer, responsive navigation with an accessible mobile menu     |
| `src/components/common`                           | Page building blocks: `PageHeader`, `PlannedFeature`, `ApiStatusCard`, … |
| `src/components/feedback`                         | `LoadingState`/`Skeleton`, `ErrorState`, `EmptyState`                    |
| `src/config`                                      | Validated env (public and server-only), site config, roadmap phases      |
| `src/lib/api`                                     | The single HTTP integration layer (core + server and browser clients)    |
| `src/lib/seo`                                     | `siteMetadata` defaults and `buildPageMetadata`                          |
| `src/lib/utils`                                   | Small dependency-free helpers (`cn`)                                     |
| `src/lib/auth`                                    | Server-side session helpers (phase 1)                                    |
| `src/services`                                    | Cross-feature services: API health on the server and in the browser      |
| `src/features/*/services`                         | Typed API wrappers per feature (auth, properties, inquiries)             |
| `src/features/*/{components,hooks,schemas,types}` | Reserved for each feature's UI as its phase is built                     |
| `src/hooks`, `src/providers`, `src/types`         | Shared hooks, client providers (TanStack Query), shared types            |
| `public/images`, `public/icons`                   | Static assets                                                            |
| `tests`                                           | Vitest setup and tests, mirroring `src`                                  |

## How the app talks to the API

```
Browser         --apiClient (credentials: 'include', CORS)-------------------> API
Next.js server  --serverApi (Authorization: Bearer <access-token cookie>)----> API
                  (base URL: API_INTERNAL_BASE_URL, else NEXT_PUBLIC_API_BASE_URL)
```

**Shared core, `src/lib/api/http.ts`.** Builds the URL (query arrays become comma-separated lists,
`undefined`/`null`/empty values are dropped), JSON-encodes plain objects, passes `FormData` through
untouched so the runtime sets the multipart boundary, sends `Accept: application/json`, and applies
a 10 s timeout (`AbortSignal.timeout`, combined with the caller's signal via `AbortSignal.any`).
Responses are unwrapped from the contract envelopes and validated with the caller's Zod schema, so
API drift surfaces as `INVALID_RESPONSE` instead of corrupt UI. Every failure becomes an
`ApiError` (`status`, `code`, `message`, `details`, `requestId`); `NETWORK_ERROR`, `TIMEOUT` and
`INVALID_RESPONSE` cover failures without a valid error envelope. A caller-initiated abort
propagates as the signal's reason, and any other error is rethrown untouched: Next.js throws
control-flow errors from its patched `fetch` while prerendering, and swallowing them would freeze
a request-time page into static HTML. `src/lib/api/api-methods.ts` turns the core into the typed
`get`/`post`/`patch`/`delete`/`getPage` surface both entry points share; pass `schema` (or
`itemSchema` for pages) to get validated, typed data.

**Server, `serverApi` (`server-only`).** Used by Server Components, route handlers and server
actions. `auth: true` reads only the access-token cookie (`AUTH_COOKIE_NAMES.accessToken`) with
`await cookies()` and forwards it as `Authorization: Bearer`; the refresh cookie is never
forwarded. Authenticated requests are always `cache: 'no-store'`, and the option types make
`revalidate`/`tags` impossible together with `auth`, so user data can never land in the shared
Data Cache. Public reads may use `revalidate` and `tags`, or `cache: 'no-store'`. Server
Components cannot set cookies, so the server never refreshes a session: a `401 TOKEN_EXPIRED`
during server rendering is handed to the browser (phase 1).

**Browser, `apiClient`.** Sends `credentials: 'include'`; both session cookies are HttpOnly and
no token is ever kept in `localStorage` or `sessionStorage`. On `401 TOKEN_EXPIRED` it performs a
single-flight `POST /auth/refresh` shared by all concurrent requests (refresh tokens rotate, so a
second parallel refresh would present a spent token) and retries each failed request once. If the
refresh fails, the `ApiError` reaches the UI, which redirects to `/login`.

**Cookies.** The access-token cookie uses `Path=/` and cookies are scoped by host, not port, so
the Next.js server on `localhost:3000` receives the cookie the API on `localhost:4000` set and can
render authenticated pages. The refresh cookie uses `Path=/api/v1/auth` and only ever travels to
the API.

**Request deduplication.** The timeout signal opts requests out of Next.js `fetch` memoization,
so server read services that several parts of a render need (for example `generateMetadata` and
the page) are wrapped in React `cache()`.

## Rendering and caching plan

| Route                 | Rendering                                                   | Data and caching                                                                     |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `/`                   | Dynamic, per request (`connection()` in the health service) | Health check `no-store`, 3 s timeout; `next build` never contacts the API            |
| `/about`, `/contact`  | Static at build time                                        | None                                                                                 |
| `/properties`         | Phase 5: server-rendered from the URL search params         | Results in the Data Cache for 60 s, tag `properties:search`                          |
| `/properties/[slug]`  | Phase 9: ISR (`generateStaticParams` + `revalidate`)        | `revalidate: 300` and tag `property:<slug>`, refreshed with `revalidateTag` on edits |
| `/login`, `/register` | Static (`noindex`)                                          | Forms post from the browser (phase 1)                                                |
| `/my-properties/**`   | Dynamic per user once the session guard lands               | `auth: true`, always `no-store`                                                      |

Unknown URLs return a real 404. Malformed slugs and ids call `notFound()` without contacting the
API; because the root `loading.tsx` boundary has already started streaming, Next.js keeps status
200 there and injects `<meta name="robots" content="noindex">`, which is its documented behaviour.

## SEO

`buildPageMetadata({ title, description, path, noIndex?, images? })` returns the title (combined
with the root template `%s | Real Estate Platform`), description, canonical URL, Open Graph and
Twitter cards. The root layout exports `siteMetadata` with `metadataBase` from
`NEXT_PUBLIC_SITE_URL`. The `(auth)` and `(account)` layouts set `robots: noindex, nofollow`.
`robots.txt`, the sitemap and JSON-LD for listings arrive in phase 9.

## Images and uploads

Uploaded photos are stored on the API server's local disk and served at
`<API origin>/uploads/<key>`. `next/image` may optimise only that path; the pattern is derived from
`NEXT_PUBLIC_API_BASE_URL`. Next.js 16 refuses to optimise images resolved to loopback or private
IPs (SSRF protection), so `images.dangerouslyAllowLocalIP` is enabled only when the API host itself
is `localhost`, `127.0.0.1` or `[::1]`, which means local development. Public API hosts keep the
protection.

## Security headers

Every response carries `X-Content-Type-Options: nosniff`, `Referrer-Policy:
strict-origin-when-cross-origin`, `X-Frame-Options: DENY` and a restrictive `Permissions-Policy`;
`X-Powered-By` is disabled. A Content-Security-Policy (with nonces for the Next.js inline scripts)
is part of production deployment (phase 11).

## When TanStack Query and React Hook Form arrive

Neither is installed yet, because no client-side server state or form exists in this phase.

- **React Hook Form** arrives in phase 1 with the login and register forms, using a Zod resolver
  over the contract schemas (`loginRequestSchema`, `registerRequestSchema`), and is reused in
  phase 3 for creating and editing listings (`createPropertyRequestSchema`).
- **TanStack Query** arrives in phase 3 with the owner dashboard, the first client-side server
  state: listing queries, status changes and deletes with cache invalidation, then inquiries in
  phase 8. Its provider goes in `src/providers`, and its query functions call the feature services,
  so `apiClient` stays the only HTTP layer. Public pages keep rendering on the server.

## Tests

- `tests/lib/api/http.test.ts`: envelopes, error mapping, 204, network failure, timeout, caller
  abort, query serialisation, JSON and `FormData` bodies.
- `tests/lib/api/client.test.ts`: concurrent `TOKEN_EXPIRED` responses trigger exactly one
  refresh followed by one retry per request; a failed refresh surfaces without retrying.
- `tests/components/error-state.test.tsx`: the alert content and the retry action.

## Browser support

The API layer relies on `AbortSignal.any` (Chrome 116, Edge 116, Firefox 124, Safari 17.4 or
newer).
