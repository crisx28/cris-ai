<!-- Generated from NN-TAILSCALE.json by workflow.mjs docs. Edit the JSON, not this file. -->
# Tailscale playbook — `NN-TAILSCALE`

Private network for admin access: databases, staging, and internal tools are never exposed to the public internet.

**Default owner:** Miyagi (Platform & security)

**Environment:** `TS_AUTHKEY`

## Setup

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-TAILSCALE-01` | Tag the client build's devices | Miyagi | Every machine for the build appears in the admin console under its tag. |
| `NN-TAILSCALE-02` | Write least-privilege ACLs | Miyagi | ACL tests in the policy file pass and changes go through pull requests. |
| `NN-TAILSCALE-03` | Turn on Tailscale SSH and MagicDNS | Miyagi | No admin port is reachable from the public internet. |

### `NN-TAILSCALE-01` Tag the client build's devices

- Create a tag per client build, e.g. tag:<client-id>
- Register servers with tagged, ephemeral, pre-authorized auth keys

### `NN-TAILSCALE-02` Write least-privilege ACLs

- Default deny; grant only group:admins → tag:<client-id> on the ports actually needed
- Keep the ACL file in GitHub and apply it through the Tailscale GitOps action

### `NN-TAILSCALE-03` Turn on Tailscale SSH and MagicDNS

- Replace public SSH with Tailscale SSH; close port 22 on the host firewall
- Use MagicDNS names in runbooks instead of IPs

## Per-release

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-TAILSCALE-04` | Confirm staging is tailnet-only | Miyagi | An off-tailnet request to staging fails. |

### `NN-TAILSCALE-04` Confirm staging is tailnet-only

- Check that staging and admin tools resolve only inside the tailnet (or behind Cloudflare Access, NN-CLOUDFLARE-04)

## Recurring

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-TAILSCALE-05` | Monthly device and key cleanup | Miyagi | No device older than 90 days without a check-in remains. |

### `NN-TAILSCALE-05` Monthly device and key cleanup

- Remove stale devices and expired keys
- Confirm key expiry is on for all human devices
