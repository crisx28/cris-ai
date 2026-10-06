<!-- Generated from NN-SUPABASE.json by workflow.mjs docs. Edit the JSON, not this file. -->
# Supabase playbook — `NN-SUPABASE`

Postgres database, storage, and realtime for client data.

**Default owner:** Miyagi (Platform & security)

**Environment:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Setup

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-SUPABASE-01` | Create separate staging and production projects | Miyagi | Both projects exist; production backups are on. |
| `NN-SUPABASE-02` | Manage schema as migrations | Miyagi | A fresh database built from migrations matches production. |
| `NN-SUPABASE-03` | Enable Row Level Security on every table | Miyagi | Database linter reports no tables without RLS; user A cannot read user B's rows. |
| `NN-SUPABASE-04` | Keep the service role key server-only | Miyagi | Searching the built client bundle finds no service role key. |

### `NN-SUPABASE-01` Create separate staging and production projects

- One project per environment, in the region closest to the client's users
- Turn on Point-in-Time Recovery for production

### `NN-SUPABASE-02` Manage schema as migrations

- All schema changes live in supabase/migrations and are applied by CI
- No manual edits in the production dashboard

### `NN-SUPABASE-03` Enable Row Level Security on every table

- RLS on for every table in public schema
- Policies key on the signed-in user's ID (Clerk user ID when Clerk is the identity provider, NN-CLERK-04)

### `NN-SUPABASE-04` Keep the service role key server-only

- SUPABASE_SERVICE_ROLE_KEY is never prefixed NEXT_PUBLIC_ and never imported by client code

## Per-release

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-SUPABASE-05` | Apply migrations to staging first | Miyagi | Production migration applied after a green staging run. |

### `NN-SUPABASE-05` Apply migrations to staging first

- Run migrations on staging, run Playwright against it, then promote to production

## Recurring

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-SUPABASE-06` | Monthly backup restore test | Miyagi | Restore succeeded and advisors show no critical items. |

### `NN-SUPABASE-06` Monthly backup restore test

- Restore the latest backup into a scratch project and check row counts
- Review the security and performance advisors
