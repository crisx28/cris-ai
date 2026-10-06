<!-- Generated from NN-CLOUDFLARE.json by workflow.mjs docs. Edit the JSON, not this file. -->
# Cloudflare playbook — `NN-CLOUDFLARE`

DNS, TLS, CDN, WAF, and the public edge for every client domain.

**Default owner:** Miyagi (Platform & security)

**Environment:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`

## Setup

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-CLOUDFLARE-01` | Move the client domain onto Cloudflare DNS | Miyagi | Zone is Active and the app resolves through Cloudflare. |
| `NN-CLOUDFLARE-02` | Enforce TLS | Miyagi | SSL Labs grade A or better. |
| `NN-CLOUDFLARE-03` | Turn on WAF and rate limiting | Miyagi | A burst test against /api/* is throttled. |
| `NN-CLOUDFLARE-04` | Put admin and staging behind Cloudflare Access | Miyagi | Staging asks for login before it loads. |
| `NN-CLOUDFLARE-05` | Scope the API token | Miyagi | Token works for DNS and purge only. |

### `NN-CLOUDFLARE-01` Move the client domain onto Cloudflare DNS

- Add the zone and switch nameservers at the registrar
- Proxy (orange-cloud) the app records; leave mail records DNS-only
- Add the DNS records Clerk (NN-CLERK-01) and the host need

### `NN-CLOUDFLARE-02` Enforce TLS

- SSL mode Full (strict)
- Always Use HTTPS on; minimum TLS 1.2; HSTS once the site is stable

### `NN-CLOUDFLARE-03` Turn on WAF and rate limiting

- Enable the managed ruleset
- Rate-limit auth and AI endpoints (sign-in, /api/assistant, voice/image routes)

### `NN-CLOUDFLARE-04` Put admin and staging behind Cloudflare Access

- Create an Access application for staging and admin hostnames
- Allow only the team's identity provider group

### `NN-CLOUDFLARE-05` Scope the API token

- Create a token limited to this zone with only DNS edit and cache purge
- Store it as a GitHub Actions secret, never in the repo

## Per-release

| Task ID | Task | Owner | Done when |
| --- | --- | --- | --- |
| `NN-CLOUDFLARE-06` | Purge cache after deploy | Miyagi | The live site serves the new build. |

### `NN-CLOUDFLARE-06` Purge cache after deploy

- Purge by URL or tag from the deploy workflow
- Smoke-test the live URL afterward
