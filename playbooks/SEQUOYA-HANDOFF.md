# Handoff: tool IDs, playbooks, and credential tasks for Sequoya client builds

You are a Claude agent with access to Sequoya's client builds. This document
is your full brief. It is self-contained: everything you need is below.

## The problem

Sequoya has several client builds. Each one has connected tools. Right now,
tools are stored as **plain text** (for example `Clerk`), with no unique
identifier. That makes it impossible to reliably say which builds use which
tool, or to attach the right setup work to a build.

## The goal

1. Every tool gets a **unique tool ID**.
2. Tools are either **non-negotiable** (every client build must have them) or
   **negotiable** (optional, chosen per build).
3. Every non-negotiable tool has a **playbook**: a fixed list of tasks.
4. When a client build has (or adds) a non-negotiable tool, its playbook and
   tasks are **attached to that build automatically**.
5. The tasks are about access: getting accounts, **getting credentials and API
   keys**, storing them safely, and verifying the API works.
6. Every task has an owner: **Miyagi** or **Polly**.

```
client build ──has──▶ tool ID ──is NN?──▶ playbook ──▶ tasks ──▶ owner (Miyagi / Polly)
                                 └─ no ──▶ negotiable: ID only, no playbook
```

## Before you build anything

1. **Look first.** Find where Sequoya stores client builds and their connected
   tools (database table, config files, Notion, spreadsheet, app). Find every
   place a tool name appears as plain text.
2. **Report back before changing data.** List the client builds, the plain-text
   tool names you found, and how each would map to an ID (use the alias table
   below). Flag every name that doesn't match.
3. **Fit Sequoya's system.** Use whatever storage and conventions Sequoya
   already has. The JSON below is the data, not a required file format.

---

## 1. Tool IDs

### ID rules

- Non-negotiable: `NN-<SLUG>`. Negotiable: `NEG-<SLUG>`.
- `<SLUG>` = the tool name in uppercase, letters and digits only, words joined
  with `-`. Example: `Claude subscription` → `CLAUDE`, `Google Drive` → `GOOGLE-DRIVE`.
- Task IDs: `<TOOL-ID>-<NN>`, e.g. `NN-CLERK-02`.
- Client build IDs: `CB-<SLUG>`, e.g. `CB-ACME-PORTAL`.
- IDs are permanent. Never reuse or rename an ID. If a tool is retired, mark
  it retired; don't delete it.

### Non-negotiable tools (fixed list)

| Tool ID | Tool | Default owner | Plain-text aliases to match (case-insensitive) |
| --- | --- | --- | --- |
| `NN-CLERK` | Clerk | Miyagi | clerk, clerk.dev, clerk.com, clerk auth |
| `NN-TAILSCALE` | Tailscale | Miyagi | tailscale, tailnet |
| `NN-CLOUDFLARE` | Cloudflare | Miyagi | cloudflare, cf, cloudflare dns, cloudflare access |
| `NN-GITHUB` | GitHub | Miyagi | github, git hub, gh, github actions |
| `NN-SUPABASE` | Supabase | Miyagi | supabase, supa base |
| `NN-PLAYWRIGHT` | Playwright | Polly | playwright, pw, e2e tests |
| `NN-CLAUDE` | Claude subscription | Polly | claude, claude ai, claude.ai, anthropic, claude code, claude subscription |
| `NN-OPENAI` | OpenAI (voice + image) | Polly | openai, open ai, chatgpt api, whisper, dall-e, openai voice, openai image |

### Negotiable tools

Any tool not in the table above is negotiable. Give it a `NEG-<SLUG>` ID using
the rule above. Negotiable tools get an ID and nothing else: no playbook, no
tasks.

### Matching plain text to IDs

1. Trim, lowercase, and collapse spaces in the plain-text name.
2. If it matches an alias above → that `NN-*` ID.
3. Else if it matches an existing `NEG-*` tool's name or alias → that ID.
4. Else → **propose** a new `NEG-*` ID and flag it for a human to confirm.
   Never promote an unknown tool to non-negotiable on your own.

Keep the original plain text next to the ID (e.g. `sourceLabel`) so nothing is lost.

---

## 2. Owners

| Owner ID | Name | Covers |
| --- | --- | --- |
| `miyagi` | Miyagi | Platform & security: Clerk, Tailscale, Cloudflare, GitHub, Supabase |
| `polly` | Polly | Quality & AI: Playwright, Claude, OpenAI |

Owners are set per task. A task can be reassigned without changing the playbook.

---

## 3. The workflow (behaviour to implement)

### A. Every client build already has every non-negotiable tool

When a client build exists or is created, it must have all 8 `NN-*` tools
attached. If any are missing, attach them with status `not-connected`. So every
build has Clerk, Claude, and the other six from day one.

Tool status on a build: `not-connected` → `connected` → `verified`.

### B. Attaching a tool attaches its playbook

When an `NN-*` tool is attached to a client build (on build creation, during
the migration, or added later):

1. Fetch the tool's playbook (section 4).
2. Create one **task instance** per playbook task, scoped to the build:
   - `instanceId` = `<CB-ID>/<TASK-ID>`, e.g. `CB-ACME-PORTAL/NN-CLERK-02`
   - `owner` = the task's owner
   - `status` = `todo`
3. **Idempotent:** if an instance with that `instanceId` already exists, leave it
   alone. Running the workflow twice must never create duplicates.

When a `NEG-*` tool is attached: record the ID only. No tasks.

### C. Playbook changes reach every build

If a task is added to a playbook later, create that task instance on every
client build that already has the tool. Never delete task instances. If a task
is removed from a playbook, mark its instances `retired`.

### D. Task instance fields

| Field | Example |
| --- | --- |
| `instanceId` | `CB-ACME-PORTAL/NN-CLERK-02` |
| `clientBuildId` | `CB-ACME-PORTAL` |
| `toolId` | `NN-CLERK` |
| `taskId` | `NN-CLERK-02` |
| `title` | Get the API keys |
| `owner` | `miyagi` |
| `status` | `todo` / `in-progress` / `blocked` / `done` / `retired` |
| `secretRef` | Where the credential is stored, e.g. `vault://acme-portal/prod/CLERK_SECRET_KEY` |
| `verifiedAt` | Date the API check passed |

### E. Credential safety (non-negotiable for you too)

- **Never put a secret value** in a task, comment, chat message, log, ticket,
  spreadsheet, or repository. Store only **where it lives** (`secretRef`).
- Store credentials in Sequoya's secret manager or the host's environment secrets.
- Keep separate credentials for each client build and for each environment
  (staging vs production).
- Browser-safe keys (marked **public** below) may ship to the frontend. All
  others are **server-only**.
- When verifying an API, print only the HTTP status and non-sensitive fields.

---

## 4. Playbooks

Every playbook follows the same five steps:
**01 access → 02 credentials → 03 store → 04 verify API → 05 rotate & review.**

### `NN-CLERK` — Clerk (identity / login)

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-CLERK-01` | Get dashboard access; create a Development and a Production instance for this build | Miyagi | Both instances exist under the client build's name |
| `NN-CLERK-02` | Get the API keys: **Publishable key** `pk_…` (public) and **Secret key** `sk_…` (server-only) from Dashboard → API Keys; **Webhook signing secret** `whsec_…` from Webhooks → endpoint | Miyagi | All three keys collected for each environment |
| `NN-CLERK-03` | Store as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET` | Miyagi | `secretRef` recorded for each |
| `NN-CLERK-04` | Verify the API: `GET https://api.clerk.com/v1/users?limit=1` with `Authorization: Bearer $CLERK_SECRET_KEY` → 200 | Miyagi | 200 from both environments; `verifiedAt` set |
| `NN-CLERK-05` | Rotate the secret key and webhook secret every quarter; remove people who have left the dashboard | Miyagi | Rotation date logged |

### `NN-TAILSCALE` — Tailscale (private network)

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-TAILSCALE-01` | Get admin access to the tailnet; create the tag `tag:<client-build-slug>` | Miyagi | Tag exists in the ACL policy |
| `NN-TAILSCALE-02` | Get credentials: an **OAuth client** (Settings → OAuth clients, scoped to this tag) for automation, and a **tagged, ephemeral auth key** `tskey-auth-…` for servers | Miyagi | Both created, scoped to the build's tag only |
| `NN-TAILSCALE-03` | Store as `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_CLIENT_SECRET`, `TS_AUTHKEY` | Miyagi | `secretRef` recorded for each |
| `NN-TAILSCALE-04` | Verify the API: `GET https://api.tailscale.com/api/v2/tailnet/-/devices` with an access token → 200; the build's servers appear under their tag | Miyagi | 200 and devices listed |
| `NN-TAILSCALE-05` | Every month: remove stale devices and expired keys; every quarter: rotate the OAuth client secret | Miyagi | Cleanup date logged |

### `NN-CLOUDFLARE` — Cloudflare (DNS, TLS, edge)

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-CLOUDFLARE-01` | Get access to the Cloudflare account; add the client's domain as a zone | Miyagi | Zone is Active |
| `NN-CLOUDFLARE-02` | Get credentials: **Account ID** and **Zone ID** from the zone overview page; create a **scoped API token** (My Profile → API Tokens) limited to this zone, with DNS edit and cache purge only | Miyagi | Token created with only those permissions |
| `NN-CLOUDFLARE-03` | Store as `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN` | Miyagi | `secretRef` recorded for each |
| `NN-CLOUDFLARE-04` | Verify the API: `GET https://api.cloudflare.com/client/v4/user/tokens/verify` with `Authorization: Bearer $CLOUDFLARE_API_TOKEN` → `"status": "active"` | Miyagi | Token reports active |
| `NN-CLOUDFLARE-05` | Every quarter: rotate the token; review who has account access | Miyagi | Rotation date logged |

### `NN-GITHUB` — GitHub (code, CI/CD, secrets)

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-GITHUB-01` | Get access to the client build's repository (or create it, private, under the organization) | Miyagi | Repo exists; the right people have the right roles |
| `NN-GITHUB-02` | Get credentials for automation: a **GitHub App** installed on this repo only (preferred), or a **fine-grained token** limited to this repo with the smallest permissions that work | Miyagi | Credential created and scoped to one repo |
| `NN-GITHUB-03` | Store the credential, and load **every other tool's keys** into the repo's Actions secrets, split by environment (staging / production) | Miyagi | `secretRef` recorded; secret scanning with push protection is on |
| `NN-GITHUB-04` | Verify the API: `GET https://api.github.com/repos/<owner>/<repo>` with the credential → 200 | Miyagi | 200 returned |
| `NN-GITHUB-05` | Every month: remove people who have left; every quarter: rotate tokens or app keys | Miyagi | Review date logged |

### `NN-SUPABASE` — Supabase (database, storage)

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-SUPABASE-01` | Get access to the organization; create a staging project and a production project for this build | Miyagi | Both projects exist |
| `NN-SUPABASE-02` | Get credentials from Project Settings → API keys: **Project URL**, **publishable / anon key** (public), **secret / service_role key** (server-only); and the **database connection string** from Connect | Miyagi | All collected for each project |
| `NN-SUPABASE-03` | Store as `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` | Miyagi | `secretRef` recorded; service key is never prefixed `NEXT_PUBLIC_` |
| `NN-SUPABASE-04` | Verify the API: `GET $NEXT_PUBLIC_SUPABASE_URL/rest/v1/` with header `apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY` → 200; confirm Row Level Security is on for every table | Miyagi | 200 and no tables without RLS |
| `NN-SUPABASE-05` | Every quarter: rotate the secret key and database password; every month: test-restore a backup | Miyagi | Rotation and restore dates logged |

### `NN-PLAYWRIGHT` — Playwright (end-to-end tests)

Playwright has no API key of its own. Its credentials are the **test accounts**
and **test environment** it signs in with.

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-PLAYWRIGHT-01` | Get access to the build's repo and CI; confirm Playwright is installed and runs | Polly | `npx playwright test` runs in CI |
| `NN-PLAYWRIGHT-02` | Get credentials: a **dedicated test user** in the Clerk Development instance (fictional demo name only, no real person), plus the staging **base URL** | Polly | Test user exists; no real account is used |
| `NN-PLAYWRIGHT-03` | Store as `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `PLAYWRIGHT_BASE_URL` in CI secrets (Clerk test helpers reuse `CLERK_SECRET_KEY` from `NN-CLERK-03`) | Polly | `secretRef` recorded for each |
| `NN-PLAYWRIGHT-04` | Verify: a sign-in test runs against staging in CI and passes | Polly | Green run on the build's main branch |
| `NN-PLAYWRIGHT-05` | Every quarter: rotate the test user's password; every week: fix flaky tests (never skip them) | Polly | Rotation date logged |

### `NN-CLAUDE` — Claude subscription (team seats + API)

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-CLAUDE-01` | Get access: confirm the team members working on this build have Claude seats; in the Claude Console, create a **workspace** for this client build | Polly | Seats confirmed; workspace exists |
| `NN-CLAUDE-02` | Get credentials: create an **API key** in that workspace (Console → API Keys); set a monthly **spend limit** on the workspace | Polly | Key created; limit set |
| `NN-CLAUDE-03` | Store as `ANTHROPIC_API_KEY` (server-only), and the model ID in a separate variable (e.g. `CLAUDE_MODEL`) so it can change without a code change | Polly | `secretRef` recorded |
| `NN-CLAUDE-04` | Verify the API: `GET https://api.anthropic.com/v1/models` with headers `x-api-key: $ANTHROPIC_API_KEY` and `anthropic-version: 2023-06-01` → 200 | Polly | 200 returned |
| `NN-CLAUDE-05` | Every month: review spend against the limit and remove seats for people who have left; every quarter: rotate the key | Polly | Review date logged |

### `NN-OPENAI` — OpenAI (voice + image only)

Text features use Claude. OpenAI is only for voice and image.

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-OPENAI-01` | Get access to the OpenAI organization; create a **project** for this client build and set a monthly **budget** | Polly | Project exists with a budget |
| `NN-OPENAI-02` | Get credentials: create a **project API key** with restricted permissions, allowing only what voice (audio) and image endpoints need | Polly | Key created; restricted |
| `NN-OPENAI-03` | Store as `OPENAI_API_KEY` (server-only) and `OPENAI_PROJECT_ID` | Polly | `secretRef` recorded |
| `NN-OPENAI-04` | Verify the API: `GET https://api.openai.com/v1/models` with `Authorization: Bearer $OPENAI_API_KEY` → 200; then one small test call each for voice and image | Polly | All three calls succeed |
| `NN-OPENAI-05` | Every month: review spend; every quarter: rotate the key | Polly | Review date logged |

---

## 5. Seed data (machine-readable)

Use this to load the registry and playbooks. It matches sections 1–4. Each
task's `title` repeats the "Task" column in short form; use the full text from
section 4 as each task's description.

```json
{
  "owners": {
    "miyagi": { "name": "Miyagi", "role": "Platform & security" },
    "polly": { "name": "Polly", "role": "Quality & AI" }
  },
  "tools": [
    { "id": "NN-CLERK", "name": "Clerk", "nonNegotiable": true, "defaultOwner": "miyagi",
      "aliases": ["clerk", "clerk.dev", "clerk.com", "clerk auth"],
      "env": ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY", "CLERK_WEBHOOK_SIGNING_SECRET"] },
    { "id": "NN-TAILSCALE", "name": "Tailscale", "nonNegotiable": true, "defaultOwner": "miyagi",
      "aliases": ["tailscale", "tailnet"],
      "env": ["TS_OAUTH_CLIENT_ID", "TS_OAUTH_CLIENT_SECRET", "TS_AUTHKEY"] },
    { "id": "NN-CLOUDFLARE", "name": "Cloudflare", "nonNegotiable": true, "defaultOwner": "miyagi",
      "aliases": ["cloudflare", "cf", "cloudflare dns", "cloudflare access"],
      "env": ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_ZONE_ID", "CLOUDFLARE_API_TOKEN"] },
    { "id": "NN-GITHUB", "name": "GitHub", "nonNegotiable": true, "defaultOwner": "miyagi",
      "aliases": ["github", "git hub", "gh", "github actions"],
      "env": ["GITHUB_APP_ID", "GITHUB_APP_PRIVATE_KEY"] },
    { "id": "NN-SUPABASE", "name": "Supabase", "nonNegotiable": true, "defaultOwner": "miyagi",
      "aliases": ["supabase", "supa base"],
      "env": ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL"] },
    { "id": "NN-PLAYWRIGHT", "name": "Playwright", "nonNegotiable": true, "defaultOwner": "polly",
      "aliases": ["playwright", "pw", "e2e tests"],
      "env": ["E2E_USER_EMAIL", "E2E_USER_PASSWORD", "PLAYWRIGHT_BASE_URL"] },
    { "id": "NN-CLAUDE", "name": "Claude subscription", "nonNegotiable": true, "defaultOwner": "polly",
      "aliases": ["claude", "claude ai", "claude.ai", "anthropic", "claude code", "claude subscription"],
      "env": ["ANTHROPIC_API_KEY", "CLAUDE_MODEL"] },
    { "id": "NN-OPENAI", "name": "OpenAI (voice + image)", "nonNegotiable": true, "defaultOwner": "polly",
      "aliases": ["openai", "open ai", "chatgpt api", "whisper", "dall-e", "openai voice", "openai image"],
      "env": ["OPENAI_API_KEY", "OPENAI_PROJECT_ID"] }
  ],
  "playbookTemplate": [
    { "suffix": "01", "step": "access" },
    { "suffix": "02", "step": "credentials" },
    { "suffix": "03", "step": "store" },
    { "suffix": "04", "step": "verify-api" },
    { "suffix": "05", "step": "rotate-review" }
  ],
  "playbooks": {
    "NN-CLERK": [
      { "id": "NN-CLERK-01", "owner": "miyagi", "title": "Get dashboard access; create Dev and Prod instances" },
      { "id": "NN-CLERK-02", "owner": "miyagi", "title": "Get publishable, secret, and webhook signing keys" },
      { "id": "NN-CLERK-03", "owner": "miyagi", "title": "Store Clerk keys in the secret manager" },
      { "id": "NN-CLERK-04", "owner": "miyagi", "title": "Verify Clerk API (GET /v1/users → 200)" },
      { "id": "NN-CLERK-05", "owner": "miyagi", "title": "Quarterly key rotation and access review" }
    ],
    "NN-TAILSCALE": [
      { "id": "NN-TAILSCALE-01", "owner": "miyagi", "title": "Get tailnet admin access; create build tag" },
      { "id": "NN-TAILSCALE-02", "owner": "miyagi", "title": "Get OAuth client and tagged auth key" },
      { "id": "NN-TAILSCALE-03", "owner": "miyagi", "title": "Store Tailscale credentials in the secret manager" },
      { "id": "NN-TAILSCALE-04", "owner": "miyagi", "title": "Verify Tailscale API (GET devices → 200)" },
      { "id": "NN-TAILSCALE-05", "owner": "miyagi", "title": "Monthly device cleanup; quarterly secret rotation" }
    ],
    "NN-CLOUDFLARE": [
      { "id": "NN-CLOUDFLARE-01", "owner": "miyagi", "title": "Get account access; add client domain as a zone" },
      { "id": "NN-CLOUDFLARE-02", "owner": "miyagi", "title": "Get Account ID, Zone ID, and a scoped API token" },
      { "id": "NN-CLOUDFLARE-03", "owner": "miyagi", "title": "Store Cloudflare credentials in the secret manager" },
      { "id": "NN-CLOUDFLARE-04", "owner": "miyagi", "title": "Verify Cloudflare API (tokens/verify → active)" },
      { "id": "NN-CLOUDFLARE-05", "owner": "miyagi", "title": "Quarterly token rotation and access review" }
    ],
    "NN-GITHUB": [
      { "id": "NN-GITHUB-01", "owner": "miyagi", "title": "Get repo access (or create the private repo)" },
      { "id": "NN-GITHUB-02", "owner": "miyagi", "title": "Get a GitHub App or fine-grained token for this repo" },
      { "id": "NN-GITHUB-03", "owner": "miyagi", "title": "Store credentials; load all tool keys into Actions secrets" },
      { "id": "NN-GITHUB-04", "owner": "miyagi", "title": "Verify GitHub API (GET repo → 200)" },
      { "id": "NN-GITHUB-05", "owner": "miyagi", "title": "Monthly access review; quarterly token rotation" }
    ],
    "NN-SUPABASE": [
      { "id": "NN-SUPABASE-01", "owner": "miyagi", "title": "Get org access; create staging and production projects" },
      { "id": "NN-SUPABASE-02", "owner": "miyagi", "title": "Get project URL, anon key, service key, DB connection string" },
      { "id": "NN-SUPABASE-03", "owner": "miyagi", "title": "Store Supabase credentials in the secret manager" },
      { "id": "NN-SUPABASE-04", "owner": "miyagi", "title": "Verify Supabase API (GET /rest/v1/ → 200) and RLS on" },
      { "id": "NN-SUPABASE-05", "owner": "miyagi", "title": "Quarterly key rotation; monthly backup restore test" }
    ],
    "NN-PLAYWRIGHT": [
      { "id": "NN-PLAYWRIGHT-01", "owner": "polly", "title": "Get repo and CI access; confirm Playwright runs" },
      { "id": "NN-PLAYWRIGHT-02", "owner": "polly", "title": "Get a dedicated fictional test user and staging URL" },
      { "id": "NN-PLAYWRIGHT-03", "owner": "polly", "title": "Store test credentials in CI secrets" },
      { "id": "NN-PLAYWRIGHT-04", "owner": "polly", "title": "Verify a sign-in test passes against staging" },
      { "id": "NN-PLAYWRIGHT-05", "owner": "polly", "title": "Quarterly test-user rotation; weekly flaky-test fixes" }
    ],
    "NN-CLAUDE": [
      { "id": "NN-CLAUDE-01", "owner": "polly", "title": "Confirm seats; create a Console workspace for this build" },
      { "id": "NN-CLAUDE-02", "owner": "polly", "title": "Get a workspace API key; set a spend limit" },
      { "id": "NN-CLAUDE-03", "owner": "polly", "title": "Store ANTHROPIC_API_KEY and model ID" },
      { "id": "NN-CLAUDE-04", "owner": "polly", "title": "Verify Claude API (GET /v1/models → 200)" },
      { "id": "NN-CLAUDE-05", "owner": "polly", "title": "Monthly spend and seat review; quarterly key rotation" }
    ],
    "NN-OPENAI": [
      { "id": "NN-OPENAI-01", "owner": "polly", "title": "Get org access; create a project with a budget" },
      { "id": "NN-OPENAI-02", "owner": "polly", "title": "Get a restricted project API key (voice + image)" },
      { "id": "NN-OPENAI-03", "owner": "polly", "title": "Store OPENAI_API_KEY and project ID" },
      { "id": "NN-OPENAI-04", "owner": "polly", "title": "Verify OpenAI API, plus one voice and one image call" },
      { "id": "NN-OPENAI-05", "owner": "polly", "title": "Monthly spend review; quarterly key rotation" }
    ]
  }
}
```

---

## 6. Order of work

1. **Inventory** (read-only): list client builds and every plain-text tool name.
   Report the proposed name → ID mapping, unmatched names, and builds missing
   non-negotiables. Wait for confirmation.
2. **Registry**: load the 8 `NN-*` tools and the confirmed `NEG-*` tools.
3. **Playbooks**: load the 40 tasks from section 5.
4. **Migrate**: replace each plain-text tool on each build with its tool ID
   (keep the original text as `sourceLabel`). Attach any missing `NN-*` tools.
5. **Auto-attach**: create task instances for every build × `NN-*` tool
   (section 3B). Then make sure the same thing happens automatically when a
   build is created or a tool is added (section 3A–C).
6. **Check**: run the acceptance checks below and report the results.

## 7. Acceptance checks

- [ ] Every tool on every client build has an ID; no plain-text-only tools remain.
- [ ] No two tools share an ID; every task ID starts with its tool ID.
- [ ] Every client build has all 8 `NN-*` tools.
- [ ] Every client build has exactly 40 `NN-*` task instances (8 × 5), each owned by Miyagi or Polly.
- [ ] Running the workflow a second time creates **zero** new instances.
- [ ] Creating a test build named `CB-TEST-DEMO` automatically gets all 8 tools and 40 tasks. Delete it afterward.
- [ ] Adding a negotiable tool to a build creates **no** tasks.
- [ ] No secret value appears anywhere in tasks, logs, or the repo; only `secretRef`s.

## 8. Rules for you

- Use only generic, obviously fictional names in test data and examples. Never
  real people, clients, or accounts.
- Don't create, rotate, or revoke real credentials yourself unless a human asks
  you to for a specific build. Your job is to set up the IDs, playbooks, and
  tasks. Miyagi and Polly do the tasks.
- Ask before deleting or overwriting existing data.
