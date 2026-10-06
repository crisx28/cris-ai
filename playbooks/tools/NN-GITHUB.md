<!-- Generated from NN-GITHUB.json by workflow.mjs docs. Edit the JSON, not this file. -->
# GitHub playbook — `NN-GITHUB`

Source control, code review, CI/CD, and secrets for every client build.

**Default owner:** Miyagi (Platform & security)

## Setup

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-GITHUB-01` | Create the repo under the organization | Miyagi | Repo exists with CODEOWNERS and no secrets in history. |
| `NN-GITHUB-02` | Protect the main branch | Miyagi | A direct push to main is rejected. |
| `NN-GITHUB-03` | Turn on security features | Miyagi | Security tab shows all features enabled. |
| `NN-GITHUB-04` | Wire CI/CD with GitHub Actions | Miyagi | A pull request runs the full pipeline and reports status. |

### `NN-GITHUB-01` Create the repo under the organization

- Private by default; name it after the client build ID
- Add a README, .gitignore that excludes .env, and CODEOWNERS

### `NN-GITHUB-02` Protect the main branch

- Require a pull request with at least one approval
- Require CI checks (build, lint, Playwright) to pass
- Block force-pushes and deletion

### `NN-GITHUB-03` Turn on security features

- Secret scanning with push protection
- Dependabot alerts and security updates

### `NN-GITHUB-04` Wire CI/CD with GitHub Actions

- Install, lint, typecheck, build, then run Playwright (NN-PLAYWRIGHT-02)
- Store every tool key as an environment secret (production and staging separate)

## Per-release

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-GITHUB-05` | Tag the release | Polly | Release tag points at the deployed commit. |

### `NN-GITHUB-05` Tag the release

- Merge through a reviewed pull request
- Create a tagged release with notes

## Recurring

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-GITHUB-06` | Monthly access and dependency review | Miyagi | No stale collaborators and no open critical alerts. |

### `NN-GITHUB-06` Monthly access and dependency review

- Remove collaborators no longer on the project
- Merge or close open Dependabot pull requests
