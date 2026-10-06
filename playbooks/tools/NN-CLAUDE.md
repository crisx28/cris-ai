<!-- Generated from NN-CLAUDE.json by workflow.mjs docs. Edit the JSON, not this file. -->
# Claude subscription playbook — `NN-CLAUDE`

Claude for building (Claude Code) and for in-app text features through the Claude API.

**Default owner:** Polly (Quality & AI)

**Environment:** `ANTHROPIC_API_KEY`, `CRIS_MODEL`

## Setup

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-CLAUDE-01` | Confirm the team plan and seats | Polly | Each build has its own key and usage is tracked separately. |
| `NN-CLAUDE-02` | Set spend limits and keep the key server-side | Polly | Limit is set; the client bundle contains no key. |
| `NN-CLAUDE-03` | Pin the model in config | Polly | Changing the model needs no code change. |
| `NN-CLAUDE-04` | Build a graceful fallback | Polly | App works with ANTHROPIC_API_KEY unset. |

### `NN-CLAUDE-01` Confirm the team plan and seats

- Check the build team has Claude seats with Claude Code access
- Create a separate Console workspace and API key per client build

### `NN-CLAUDE-02` Set spend limits and keep the key server-side

- Set a monthly spend limit on the workspace
- Call the API only from server routes; ANTHROPIC_API_KEY is never shipped to the browser

### `NN-CLAUDE-03` Pin the model in config

- Read the model ID from an env var (e.g. CRIS_MODEL) with a current default
- Document the chosen model in the client manifest

### `NN-CLAUDE-04` Build a graceful fallback

- If the key is missing or the API errors, the feature degrades without breaking the page
- AI stays an assistant, never the primary interface

## Per-release

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-CLAUDE-05` | Check prompts and outputs before release | Polly | Sample prompts pass review. |

### `NN-CLAUDE-05` Check prompts and outputs before release

- Run a fixed set of sample prompts and compare against expected answers
- Confirm no personal data is sent in prompts or logged

## Recurring

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-CLAUDE-06` | Monthly usage and model review | Polly | Usage logged; upgrade decision recorded. |

### `NN-CLAUDE-06` Monthly usage and model review

- Review spend per build against the limit
- Check for newer models and plan upgrades
