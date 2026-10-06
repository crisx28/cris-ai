# agentform: plan, approve and apply for bill reminders

Terraform's workflow, applied to household finance. You declare your bills in a
YAML file. agentform compares that file against your Google Calendar and saves a
plan. You approve the plan in the app, and only then does anything change.

A Claude agent reads bill emails (read-only) and adds a notice to the plan when
a statement amount no longer matches your spec. It never edits the spec or the
calendar.

```
spec/finance.yaml ──┐
                    ├─► plan (deterministic diff) ─► run "awaiting approval" ─► you approve in the app
Google Calendar ────┘        ▲                                                  │
                             │ notices                                          ▼
Gmail (read-only) ─► Claude observer                             apply (only the approved plan hash)
```

| Phase | Who | Google access | Can write? |
|---|---|---|---|
| plan | Code computes the diff; Claude reads bill emails | `calendar.readonly`, `gmail.readonly` | No |
| approve | You, in the app | none | Approval only, bound to the plan hash |
| apply | Code runs the approved steps | `calendar.events` | Calendar events tagged as agentform's only |

## Why the agent observes and doesn't apply

The plan is already exact: a list of create/update/delete steps with a hash.
Putting a model in the apply step would add a way to deviate from the approved
plan and add nothing in return. The agent's work is reading unstructured
statements, so it runs in the plan phase:

- **Read-only tools.** It can search mail only with the query the spec gives
  each bill. It chooses the bill, not the query, and searches cover only the
  last 60 days. It can open only messages its own searches returned.
- **Untrusted input.** Email content goes to the model as tool results, and the
  system prompt says never to follow instructions found in an email.
- **Checked output.** The answer is schema-constrained JSON. Code then drops
  any observation for an unknown bill, or one citing a message the agent never
  opened.
- **No mail stored.** Only the extracted amount and due date are kept, never
  email bodies.
- **Advisory only.** A difference shows up as a notice on the plan. Changing
  the spec stays your decision.

The model is `claude-opus-5-5` at medium effort, with server-side refusal
fallbacks (`fallbacks: "default"`).

## Safety properties

- **Approval is bound to a hash.** Apply recomputes the plan hash and refuses if
  it differs from the approved one. A plan edited after approval won't run.
- **Stale plans are refused.** Before each step, apply re-reads the event and
  checks its fingerprint against the one recorded at plan time. Anything that
  changed in between is skipped as `stale`, not overwritten.
- **Small blast radius.** agentform only sees events carrying its private
  `agentform=1` tag. Your other events are never listed or touched.
- **Idempotent.** Applying the same spec twice produces an empty plan.
- **Keyless.** No service-account key files. Runners sign JWTs through the IAM
  Credentials API, and each runner can sign only as its own delegation account.
- **One mailbox.** The impersonated Workspace user comes from configuration
  only (`AGENTFORM_SUBJECT`), never from agent output.
- **No money movement and no sending email.** No scope exists for either.

## Run it locally (no Google, no Supabase)

```bash
cd automation
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt pytest
pytest                                   # 13 tests

python -m agentform plan                 # uses spec/finance.example.yaml + a fake calendar
python -m agentform list
```

Then approve it, either in the app or from the CLI:

```bash
cd ../budget-os && npm run dev           # open Settings → Automations → Approve plan
# or
python -m agentform approve <run-id>
```

```bash
python -m agentform apply --approved
python -m agentform plan                 # → "No changes"
```

The fake calendar lives at `.agentform/fake_calendar.json`. Edit the spec, plan
again, and you'll see updates and removals. The dev server reads runs from
`../automation/.agentform/runs` (override with `AGENTFORM_RUNS_DIR`). That
bridge is disabled in production builds.

To use your own bills, copy `spec/finance.example.yaml` to `spec/finance.yaml`.
That file is gitignored.

## Connect a Google Workspace dev project

Use a separate dev project, a dedicated test mailbox (for example
`finance-test@yourdomain.com`) and a test calendar.

1. **Identities and secrets.**
   ```bash
   PROJECT=finance-agent-dev REGION=asia-southeast1 DEV_USER=you@yourdomain.com \
     ./deploy/setup-dev.sh
   ```
   The script prints two Client IDs with their scope lists.
2. **Domain-wide delegation** (Workspace super admin). Go to Admin console →
   Security → Access and data control → API controls → Manage Domain Wide
   Delegation, and add both entries exactly as printed.
3. **Try it from your laptop.**
   ```bash
   gcloud auth application-default login
   export AGENTFORM_PROVIDER=google AGENTFORM_SUBJECT=finance-test@yourdomain.com \
          AGENTFORM_CALENDAR_ID=... AGENTFORM_DWD_SA=agentform-dwd-plan@$PROJECT.iam.gserviceaccount.com \
          ANTHROPIC_API_KEY=...
   python -m agentform plan --observe
   python -m agentform approve <run-id>
   AGENTFORM_DWD_SA=agentform-dwd-apply@$PROJECT.iam.gserviceaccount.com python -m agentform apply --approved
   ```
4. **Supabase.** Run `budget-os/supabase/automation.sql` in the SQL editor.
   People can read their own runs and approve or reject through RPCs that check
   the plan hash. Only the runner (service role) can write.
5. **Deploy the scheduled jobs.**
   ```bash
   PROJECT=... REGION=... AGENTFORM_SUBJECT=... AGENTFORM_CALENDAR_ID=... \
   SUPABASE_URL=... AGENTFORM_OWNER_USER_ID=... ./deploy/deploy-dev.sh
   ```
   This deploys `agentform-plan` to run nightly and `agentform-apply` every 15
   minutes. Apply does nothing unless a run is approved. Approvals then happen
   in the app under Settings → Automations.

Expected Google Cloud cost at dev scale is within the free tier (Cloud Run
jobs, three Scheduler jobs, a few secrets). The only usage-based cost is the
nightly Claude call. Set a billing budget alert on the project anyway.

## Configuration

| Variable | Used by | Meaning |
|---|---|---|
| `AGENTFORM_PROVIDER` | all | `fake` (default) or `google` |
| `AGENTFORM_SPEC` | plan | spec path (default `spec/finance.yaml`, else the example) |
| `AGENTFORM_DATA_DIR` | all | local runs + fake calendar (default `.agentform`) |
| `AGENTFORM_STORE` | all | `local` (default) or `supabase` |
| `AGENTFORM_SUBJECT` | google | the one Workspace mailbox to act as |
| `AGENTFORM_DWD_SA` | google | delegation account to sign as (plan or apply one) |
| `AGENTFORM_CALENDAR_ID` | google | calendar holding the reminders |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AGENTFORM_OWNER_USER_ID` | supabase store | where runs are recorded, and whose they are |
| `ANTHROPIC_API_KEY` | plan `--observe` | the observer agent |

## Layout

```
agentform/spec.py        spec schema + the event fields agentform manages
agentform/plan.py        deterministic diff → steps + plan hash
agentform/apply.py       executor: approval check, stale check, the only writes
agentform/observe.py     Claude observer with read-only Gmail tools
agentform/runs.py        run records (local JSON or Supabase)
agentform/providers/     Google Calendar + fake calendar
deploy/                  GCP setup and Cloud Run Jobs deploy scripts
```
