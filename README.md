# GitLab Access Checker

A Next.js application that audits user access across GitLab groups and projects. Enter a top-level GitLab group ID and the tool recursively discovers all subgroups and projects, then displays every user with their group and project memberships.

## Prerequisites

- **Node.js** >= 24.0.0
- **pnpm** >= 10.0.0
- A **GitLab personal access token** with `read_api` scope

## Setup

```bash
# Install dependencies
pnpm install

# Copy the example env file and fill in your token
cp .env.example .env.local
```

Edit `.env.local`:

```env
GITLAB_ACCESS_TOKEN=glpat-your-token-here
GITLAB_BASE_URL=https://gitlab.com/api/v4   # optional, defaults to gitlab.com
```

## Mock Server

If you don't have GitLab access, a mock server is available in `mock-server/`. It serves pre-captured GitLab API responses locally.

```bash
cd mock-server && pnpm install && pnpm start
```

Then point the app at it by changing `GITLAB_BASE_URL` in `.env.local`:

```env
GITLAB_BASE_URL=http://localhost:3001
```

See [mock-server/README.md](mock-server/README.md) for full instructions.

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server (Turbopack) |
| `pnpm build` | Create a production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Run ESLint with auto-fix |
| `pnpm check:types` | Type-check with TypeScript (`tsc --noEmit`) |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:watch` | Run unit tests in watch mode |
| `pnpm test:coverage` | Run unit tests with coverage report |
| `pnpm test:e2e` | Run end-to-end tests (Playwright) |

## Project Structure

```
app/
├── page.tsx            # Home page with group ID form
├── result/page.tsx     # Access report page (SSR with Suspense)
├── actions.ts          # Server actions (form submit, cache revalidation)
├── layout.tsx          # Root layout
└── globals.css         # Global styles with CSS custom properties

lib/
├── result.ts           # Result<T, E> monad (ok, error, map, flatMap, collectResults, flattenResults)
├── api-client.ts       # Generic HTTP fetch with pagination
├── gitlab-schemas.ts   # Zod schemas + types for GitLab API, accessLevelToLabel
├── gitlab-client.ts    # GitLab API client factory (createGitlabClient)
├── fetch-access-data.ts# Recursive group/project/member fetching
├── aggregate-users.ts  # User deduplication and membership aggregation
└── get-access-data.ts  # Entry point (use cache, cacheLife, cacheTag)

types/
├── api-types.ts        # FetchSuccess
├── domain-types.ts     # Membership, AggregatedUser
├── access-data-types.ts# MemberEntry, GroupWithMembers, ProjectWithMembers, GitlabClient
└── user-types.ts       # UserRecord, UserMap

e2e/
├── home.test.ts        # Home page E2E tests
└── result.test.ts      # Result page E2E tests
```

## Testing

### Unit Tests

Unit tests live alongside the source files in `lib/` with a `.test.ts` suffix. Coverage thresholds are enforced at 100%.

```bash
pnpm test
pnpm test:coverage
```

### E2E Tests

End-to-end tests use Playwright with Chromium. They build and start the production server automatically.

```bash
# Install browser (first time only)
npx playwright install chromium

# Run tests
pnpm test:e2e
```

## CI Pipeline

GitHub Actions runs on every push and pull request to `master`:

1. **actionlint** — validates workflow files and `dependabot.yml`
2. **build** — production build (runs in parallel with actionlint)
3. **lint**, **check-types**, **test**, **test-e2e** — run in parallel after a successful build

## Tech Stack

- **Next.js 16** — App Router, Server Actions, `use cache` directive
- **React 19** — Server Components with Suspense
- **TypeScript 5.9** — strict mode, `noUncheckedIndexedAccess`
- **Zod 4** — runtime validation of GitLab API responses
- **Vitest** — unit testing with v8 coverage
- **Playwright** — end-to-end testing
- **ESLint 9** — flat config with `@stylistic/eslint-plugin`

