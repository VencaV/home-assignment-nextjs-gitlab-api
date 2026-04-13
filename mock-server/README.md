# Mock Server

A local Fastify server that replaces the GitLab API during development without requiring GitLab access.

Works in two steps:

1. **Capture** — one-time download of live data from GitLab into JSON files
2. **Server** — Fastify server that serves those JSON files at the same URL paths as the GitLab API

---

## Capturing data

Capture requires an active GitLab access token and network access to GitLab.

### Prerequisites

The token must have `read_api` permission for the target group.

### Running

```bash
cd mock-server
pnpm install
pnpm capture
```

The script reads credentials from `../.env.local`. If that file does not exist, set the environment variables manually:

```bash
GITLAB_ACCESS_TOKEN=glpat-... pnpm capture
```

To use a different top group ID than the default:

```bash
TOP_GROUP_ID=12345678 pnpm capture
```

### What the script downloads

For every group in the hierarchy (recursively):

| File | Endpoint |
|---|---|
| `data/group-{id}.json` | `GET /groups/{id}` |
| `data/group-{id}-subgroups.json` | `GET /groups/{id}/subgroups` |
| `data/group-{id}-members.json` | `GET /groups/{id}/members` |
| `data/group-{id}-projects.json` | `GET /groups/{id}/projects` |
| `data/project-{id}-members.json` | `GET /projects/{id}/members` |

Files are saved to the `data/` directory, which is committed to git — capture only needs to be run once (or again if the GitLab data changes).

### Data safety

Captured responses are **stripped** to only the fields the application needs (e.g. `id`, `name`, `full_path`, `web_url` for groups). All extra fields returned by the GitLab API (emails, avatar URLs, tokens, SSH URLs, etc.) are discarded.

Member data is **anonymized** with consistent fake identities — each real user is mapped to a stable alias (`user_1` / "Homer Simpson", `user_2` / "Montgomery Burns", …). The same real user always maps to the same fake identity across all files, so membership relations are preserved.

Organization paths (e.g. `XXX-external/…`) are replaced with a generic prefix (`acme-corp/…`). The real prefix is read from the `REAL_ORG_PREFIX` env variable and never stored in source code.

---

## Running the mock server

```bash
cd mock-server
pnpm install   # if not already done
pnpm start
```

The server listens on port `3001` (configurable via `PORT`):

```bash
PORT=4000 pnpm start
```

### Connecting to the Next.js application

In `.env.local` at the project root, set:

```env
GITLAB_BASE_URL=http://localhost:3001
```

The Next.js application will then call the mock server instead of `https://gitlab.com/api/v4`.

---

## Folder structure

```
mock-server/
├── capture.ts        # script for downloading data from GitLab
├── server.ts         # Fastify mock server
├── package.json
├── tsconfig.json
├── .gitignore        # ignores node_modules/
├── README.md
└── data/             # captured GitLab data (committed to git)
    ├── group-10975505.json
    ├── group-10975505-subgroups.json
    ├── group-10975505-members.json
    ├── group-10975505-projects.json
    └── …
```
