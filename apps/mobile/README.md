# Mobile app (future phase)

This directory is reserved for a future **React Native** application.

It is intentionally empty: there is no `package.json`, no React Native dependencies, no
Android/iOS projects and no mobile features yet. `pnpm-workspace.yaml` explicitly excludes
`apps/mobile`, so it is **not** an active workspace package.

## When the mobile app is introduced

1. Create the React Native project in this directory with its own `package.json`
   (suggested name: `@real-estate/mobile`).
2. Remove the `!apps/mobile` exclusion from `pnpm-workspace.yaml`.
3. Consume `@real-estate/contracts` for request/response types and validation schemas,
   exactly like `apps/web` does.
4. Call the same REST API (`/api/v1`). Mobile clients will authenticate with
   `Authorization: Bearer <access token>` (already accepted by the API's authentication
   middleware) and keep the refresh token in the platform's secure storage
   (Keychain / Keystore), never in plain storage. A body-based refresh flow for
   non-browser clients is part of the planned authentication work
   (see `docs/authentication-flow.md`).
