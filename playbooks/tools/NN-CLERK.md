<!-- Generated from NN-CLERK.json by workflow.mjs docs. Edit the JSON, not this file. -->
# Clerk playbook — `NN-CLERK`

User identity: sign-up, sign-in, sessions, and organizations for every client build.

**Default owner:** Miyagi (Platform & security)

**Environment:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`

## Setup

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-CLERK-01` | Create separate Development and Production instances | Miyagi | Prod instance is live on the client domain with verified DNS. |
| `NN-CLERK-02` | Store keys as environment secrets | Miyagi | App boots with keys from the environment only; repo scan is clean. |
| `NN-CLERK-03` | Protect routes with middleware | Miyagi | Signed-out requests to a protected page or API route are rejected. |
| `NN-CLERK-04` | Sync users to Supabase via webhook | Miyagi | Creating and deleting a test user is reflected in Supabase. |

### `NN-CLERK-01` Create separate Development and Production instances

- Create one Clerk application per client build
- Keep dev and prod instances separate; never point prod at dev keys
- Set the production domain and verify its DNS records in Cloudflare (NN-CLOUDFLARE)

### `NN-CLERK-02` Store keys as environment secrets

- Add the env vars listed above to the host and to GitHub Actions secrets
- Only NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY may ship to the browser
- Confirm no key is committed (GitHub secret scanning on, NN-GITHUB-03)

### `NN-CLERK-03` Protect routes with middleware

- Add clerkMiddleware() and mark public routes explicitly; everything else requires a session
- Protect API routes server-side, not only in the UI

### `NN-CLERK-04` Sync users to Supabase via webhook

- Subscribe to user.created / user.updated / user.deleted
- Verify every webhook signature with CLERK_WEBHOOK_SIGNING_SECRET
- Use the Clerk user ID as the owner key in Supabase RLS policies (NN-SUPABASE-03)

## Per-release

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-CLERK-05` | Run auth end-to-end tests | Polly | Auth suite passes in CI on the release commit. |

### `NN-CLERK-05` Run auth end-to-end tests

- Playwright covers sign-up, sign-in, sign-out, and a protected-route redirect (NN-PLAYWRIGHT-03)
- Use Clerk testing tokens; never real accounts

## Recurring

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-CLERK-06` | Quarterly key rotation and access review | Miyagi | Rotation date logged; member list matches the current team. |

### `NN-CLERK-06` Quarterly key rotation and access review

- Rotate CLERK_SECRET_KEY and the webhook secret
- Review dashboard members and remove anyone no longer on the project
