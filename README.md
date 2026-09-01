<p align="center">
  <img src="icon.svg" alt="Karakeep Logo" width="21%">
</p>

# Karakeep on StartOS

> Everything not listed in this document should behave the same as upstream
> Karakeep. If a feature, setting, or behavior is not mentioned here, the
> upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

Karakeep is a self-hostable bookmark-everything app (links, notes, and
images) with AI-based automatic tagging and full-text search. See the
[upstream repository](https://github.com/karakeep-app/karakeep).

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Three unmodified upstream images run as three subcontainers, each its own
daemon, sharing this package's loopback network namespace (so each reaches
the others at `127.0.0.1:<port>`, same as upstream's `docker-compose.yml`
reaching them by service name):

| Subcontainer      | Image                                | Purpose                                        |
| ------------------ | ------------------------------------- | ----------------------------------------------- |
| `karakeep-sub`      | `ghcr.io/karakeep-app/karakeep`       | The Next.js app server (web UI + API + workers) |
| `chrome-sub`        | `ghcr.io/karakeep-app/karakeep-chrome`| Headless Chrome the crawler drives for page archival/screenshots |
| `meilisearch-sub`   | `getmeili/meilisearch`                | Full-text search index                          |

All three run their default entrypoints (`sdk.useEntrypoint()`); `karakeep-sub`
(bundles `s6-overlay`) and `chrome-sub` (its launcher script backgrounds a
`socat` port-forwarder before exec'ing the browser) both set `runAsInit: true`
because each expects to be PID 1. Architectures: x86_64, aarch64.

## Volume and Data Layout

A single volume, `main`, holds everything this package persists:

| Path (in volume `main`) | Mounted into      | Contents                                    |
| ------------------------ | ----------------- | -------------------------------------------- |
| `data`                   | `karakeep-sub` at `/data` | Karakeep's SQLite database and asset store (`DATA_DIR`) |
| `meilisearch`             | `meilisearch-sub` at `/meili_data` | Meilisearch's index data |
| `store.json`              | (package-side only) | This package's own generated secrets and settings (below) |

`chrome-sub` persists nothing and mounts no volume.

## File Models

- **`store.json`** (JSON, under volume `main`) — this package's own state, not
  an upstream config file. Seeded once on install with `nextAuthSecret` and
  `meiliMasterKey` (random, never shown to the user); `domain` and
  `signupsDisabled` are set by the actions below. `setupMain` reads all four
  keys on every daemon (re)start and passes them through as environment
  variables — editing `store.json` by hand and restarting the service applies
  the edit, but the running app never reads the file itself.
- Karakeep otherwise takes **all** of its configuration through environment
  variables (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `MEILI_ADDR`,
  `MEILI_MASTER_KEY`, `BROWSER_WEB_URL`, `DATA_DIR`, `DISABLE_SIGNUPS`) set in
  `startos/main.ts` — there is no on-disk config file to inspect or edit.

## Dependencies

None.

## Network Access and Interfaces

| Interface id | Type | Port | Protocol | Purpose                    |
| ------------ | ---- | ---- | -------- | --------------------------- |
| `ui`         | ui   | 3000 | http     | The Karakeep web UI and API |

`chrome-sub` (port 9222) and `meilisearch-sub` (port 7700) are internal
sidecars reached only over loopback by `karakeep-sub` — neither is exposed
through any StartOS interface.

## Installation and First-Run Flow

Karakeep has no admin-bootstrap CLI or API: the **first account a user signs
up with becomes an administrator automatically**, and there is no separate
credential-setting step this package can perform on the user's behalf.
Accordingly:

- `NEXTAUTH_SECRET` and `MEILI_MASTER_KEY` are generated on install and never
  shown to the user (internal secrets only).
- Signups start **enabled** (`DISABLE_SIGNUPS=false`) so the user can reach
  the sign-up page and create that first (admin) account.
- An `important` task is raised on install reminding the user to run
  **Toggle Signups** once they've created their account, since until they do,
  anyone with the service's URL can register a new account on it.
- `NEXTAUTH_URL` defaults to the service's first available non-local address
  and can be changed later via **Set Primary URL**; if that address stops
  being available, a `critical` task blocks startup until a new one is
  chosen.

## Actions

- **Toggle Signups** (`toggle-signups`) — flips `DISABLE_SIGNUPS`. Its name
  and description switch between "Enable Signups" / "Disable Signups"
  depending on current state. Restarts the `karakeep` daemon (env var change);
  the other two daemons are unaffected. Safe to run repeatedly at any time.
- **Set Primary URL** (`set-primary-url`) — choose which of the service's
  addresses `NEXTAUTH_URL` uses. Restarts the `karakeep` daemon. Safe to run
  repeatedly.

## Tasks

- **Toggle Signups** — `important`, raised once on install. Clears only when
  the user runs the action; StartOS does not know whether an account has
  actually been created, so this task does not self-clear on its own.
- **Set Primary URL** — `critical`, raised only if the previously selected
  address becomes unavailable (e.g. the interface binding changed). Blocks
  the service from starting until resolved.

## Health Checks

- `karakeep` daemon: `checkWebUrl` against `http://127.0.0.1:3000/api/health`.
- `meilisearch` daemon: `checkWebUrl` against `http://127.0.0.1:7700/health`.
- `chrome` daemon: `checkPortListening` on `9222`.

The latter two are internal sidecars (`display: null`) — their status isn't
shown to the user directly, but the `karakeep` daemon `requires` both, so a
failure there blocks the visible "Web Interface" health check from starting.

## Backups and Restore

The `main` volume is backed up in full (`sdk.Backups.ofVolumes('main')`) —
Karakeep's SQLite database, its asset store, Meilisearch's index, and this
package's `store.json`. No app-level dump/restore step is needed since
Karakeep's data lives entirely on disk. A restored Meilisearch index is
consistent with the restored SQLite data because both come from the same
volume snapshot.

## Limitations and Differences

- The AI-based auto-tagging/summarization feature (`OPENAI_API_KEY` /
  `OLLAMA_BASE_URL` upstream) is not configured by this package — it is off
  by default, same as upstream.
- OAuth login (`OAUTH_*` upstream env vars) is not wired up by this package.

---

## Quick Reference for AI Consumers

```yaml
package_id: 'karakeep'
image: ghcr.io/karakeep-app/karakeep
architectures: [x86_64, aarch64]
subcontainers: [karakeep-sub, chrome-sub, meilisearch-sub]
volumes:
  main: { data: /data (karakeep-sub), meilisearch: /meili_data (meilisearch-sub) }
file_models:
  - store.json
startos_managed_env_vars:
  - NEXTAUTH_URL
  - NEXTAUTH_SECRET
  - MEILI_ADDR
  - MEILI_MASTER_KEY
  - BROWSER_WEB_URL
  - DATA_DIR
  - DISABLE_SIGNUPS
dependencies: none
interfaces:
  ui: { type: ui, port: 3000 }
actions:
  - toggle-signups
  - set-primary-url
tasks:
  - { action: toggle-signups, severity: important }
  - { action: set-primary-url, severity: critical }
health_checks:
  - karakeep (checkWebUrl /api/health)
  - meilisearch (checkWebUrl /health)
  - chrome (checkPortListening 9222)
```
