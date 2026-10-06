<!-- Generated from NN-PLAYWRIGHT.json by workflow.mjs docs. Edit the JSON, not this file. -->
# Playwright playbook — `NN-PLAYWRIGHT`

End-to-end tests that gate every release.

**Default owner:** Polly (Quality & AI)

**Environment:** `PLAYWRIGHT_BASE_URL`

## Setup

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-PLAYWRIGHT-01` | Add Playwright to the build | Polly | npx playwright test runs locally. |
| `NN-PLAYWRIGHT-02` | Run tests in CI on every pull request | Polly | A failing test blocks merge. |
| `NN-PLAYWRIGHT-03` | Cover the critical paths | Polly | Each critical path has at least one test. |
| `NN-PLAYWRIGHT-04` | Use generic test data only | Polly | Fixtures reviewed and contain no personal data. |

### `NN-PLAYWRIGHT-01` Add Playwright to the build

- Install @playwright/test and create playwright.config.ts
- Configure Chromium, WebKit, and a desktop viewport first, then mobile

### `NN-PLAYWRIGHT-02` Run tests in CI on every pull request

- Add a GitHub Actions job (NN-GITHUB-04) and make it a required check
- Upload the HTML report and traces on failure

### `NN-PLAYWRIGHT-03` Cover the critical paths

- Sign-up / sign-in / sign-out (NN-CLERK-05)
- Create, edit, and delete a core record
- The main dashboard loads with data
- AI features return a response or a graceful fallback

### `NN-PLAYWRIGHT-04` Use generic test data only

- Seed with obviously fictional demo personas and sample amounts
- Never use real names, accounts, or transactions in fixtures

## Per-release

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-PLAYWRIGHT-05` | Smoke-test production after deploy | Polly | Smoke suite is green on production. |

### `NN-PLAYWRIGHT-05` Smoke-test production after deploy

- Run the @smoke-tagged tests against the live URL after the Cloudflare purge (NN-CLOUDFLARE-06)

## Recurring

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-PLAYWRIGHT-06` | Weekly flaky-test review | Polly | No test depends on retries to pass. |

### `NN-PLAYWRIGHT-06` Weekly flaky-test review

- Find tests that needed retries and fix the root cause; never skip them to go green
