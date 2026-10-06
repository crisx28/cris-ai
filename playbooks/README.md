# Non-negotiable tool playbooks

Every tool used in a client build has a **unique tool ID**. If the tool is
non-negotiable, the workflow fetches its **playbook**, and every playbook is a
list of **tasks**. Each task has its own ID and an owner: **Miyagi** or **Polly**.

```
client build (CB-*)  →  tool IDs  →  non-negotiable? (NN-*)  →  playbook  →  tasks (NN-*-01…)  →  owner
```

## Tool IDs

| Tool ID | Tool | Playbook | Default owner |
| --- | --- | --- | --- |
| `NN-CLERK` | Clerk | [NN-CLERK.md](tools/NN-CLERK.md) | Miyagi |
| `NN-TAILSCALE` | Tailscale | [NN-TAILSCALE.md](tools/NN-TAILSCALE.md) | Miyagi |
| `NN-CLOUDFLARE` | Cloudflare | [NN-CLOUDFLARE.md](tools/NN-CLOUDFLARE.md) | Miyagi |
| `NN-GITHUB` | GitHub | [NN-GITHUB.md](tools/NN-GITHUB.md) | Miyagi |
| `NN-SUPABASE` | Supabase | [NN-SUPABASE.md](tools/NN-SUPABASE.md) | Miyagi |
| `NN-PLAYWRIGHT` | Playwright | [NN-PLAYWRIGHT.md](tools/NN-PLAYWRIGHT.md) | Polly |
| `NN-CLAUDE` | Claude subscription | [NN-CLAUDE.md](tools/NN-CLAUDE.md) | Polly |
| `NN-OPENAI` | OpenAI (voice + image) | [NN-OPENAI.md](tools/NN-OPENAI.md) | Polly |
| `OPT-RENDER`, `OPT-MOTION`, `OPT-RAILWAY` | Optional tools | none | none |

Owners are defined in [`owners.json`](owners.json): Miyagi handles platform and
security, Polly handles quality and AI. Individual tasks can be reassigned.

## Naming rules

- `NN-<TOOL>`: a non-negotiable tool. It must have a playbook.
- `OPT-<TOOL>`: an optional tool. It has no playbook.
- `NN-<TOOL>-NN`: a task inside a playbook, e.g. `NN-CLERK-03`.
- `CB-<CLIENT>`: a client build, e.g. `CB-BUDGET-OS`.
- Each task has a phase: `setup` (once per build), `per-release`, or `recurring`.

## Run the workflow

```bash
node playbooks/workflow.mjs list                              # all tool IDs and client builds
node playbooks/workflow.mjs run CB-BUDGET-OS                  # every task for a build
node playbooks/workflow.mjs run CB-BUDGET-OS --owner polly    # just Polly's tasks
node playbooks/workflow.mjs run CB-BUDGET-OS --phase setup --status planned
node playbooks/workflow.mjs run CB-BUDGET-OS --json           # for other tools or agents
node playbooks/workflow.mjs check                             # validate everything (runs in CI)
```

You can also import it from code: `runWorkflow`, `fetchPlaybook`, `check`.

## Add a client build

Create `clients/CB-<NAME>.json`, list every `NN-*` tool (`check` fails if one is
missing), and mark each one `active` or `planned`. Add any `OPT-*` tools it uses.

## Add or change a playbook

1. Edit `tools/<TOOL-ID>.json`. The JSON is the source of truth.
2. For a new tool, add it to `registry.json` first.
3. Run `node playbooks/workflow.mjs docs` to regenerate the `.md` playbooks.
4. Run `node playbooks/workflow.mjs check`.
