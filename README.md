# URSAI

URSAI is a construction workforce and project management platform. This repository currently
contains the **local project foundation only**: web, API, mobile, shared contracts/domain types,
and the initial PostgreSQL migration structure. It does not connect to production or implement AI,
purchasing, payments, or supplier integrations.

## Repository map

| Path                     | Purpose                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `apps/web`               | Next.js manager dashboard foundation and local placeholder |
| `apps/api`               | NestJS modular API foundation with `/v1/health`            |
| `apps/mobile`            | Expo/React Native field application foundation             |
| `packages/contracts`     | Shared, versioned TypeScript API contracts                 |
| `packages/domain`        | Framework-independent domain primitives                    |
| `packages/database`      | SQL migrations, conventions, and migration tests           |
| `packages/tsconfig`      | Strict shared TypeScript configurations                    |
| `packages/eslint-config` | Shared project lint rules                                  |
| `infrastructure/local`   | Optional local-only PostgreSQL Compose service             |

The product architecture and delivery sequence are documented in
[`ursai-technical-blueprint.md`](./ursai-technical-blueprint.md) and
[`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md).

## Prerequisites

- Node.js 22 or newer (an active LTS release is recommended)
- Corepack and pnpm 10.28.1
- Optional: Docker with Compose for the local PostgreSQL service
- For native mobile development: the platform prerequisites described by Expo for Android Studio
  or Xcode, or a compatible Expo Go development device

No real credentials are required for the foundation. Values in `.env.example` files are local-only
examples and are not suitable for production.

## Install

From the repository root:

```bash
corepack enable
corepack prepare pnpm@10.28.1 --activate
pnpm install
```

Commit the generated `pnpm-lock.yaml` before the first dependency update or deployment. After that
initial lockfile exists, CI should be tightened to use `pnpm install --frozen-lockfile`.

## Configure local environment

The current placeholder and health endpoint run without environment files. To prepare for local
service development, copy the documented examples:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Do not place real passwords, API keys, access tokens, production endpoints, or other secrets in
these files or commit them.

## Run locally

Run each application in its own terminal from the repository root.

### Web dashboard

```bash
pnpm dev:web
```

Open <http://localhost:3000>. The page is static placeholder data and has no production connection.

### API

```bash
pnpm dev:api
```

Verify the foundation endpoint at <http://localhost:4000/v1/health>.

### Mobile

```bash
pnpm dev:mobile
```

Follow the Expo CLI instructions to open the application in Expo Go, an emulator, a simulator, or
the web preview. `EXPO_PUBLIC_API_URL` defaults to the local API address when copied from the
example; a physical device may require the development machine's LAN address instead of
`localhost`.

### Optional local PostgreSQL

```bash
docker compose -f infrastructure/local/compose.yaml up -d postgres
docker compose -f infrastructure/local/compose.yaml ps
```

The Compose password is deliberately local-only. The API does not connect to PostgreSQL yet; the
service exists so later foundation work can exercise migrations and row-level security locally.
Stop it with:

```bash
docker compose -f infrastructure/local/compose.yaml down
```

## Quality commands

Run the full validation suite:

```bash
pnpm check
```

Or run checks independently:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Target a single workspace when iterating:

```bash
pnpm --filter @ursai/web test
pnpm --filter @ursai/api typecheck
pnpm --filter @ursai/mobile lint
```

## Database migration convention

Migration files live in `packages/database/migrations` and are immutable after application. The
initial migration establishes tenants, globally identified users, tenant memberships, and a
deny-by-default row-level-security boundary for memberships. It is not automatically applied by
the API in this foundation.

Future migration tooling must use a dedicated owner/migration role. The runtime database role must
not own tables and must not have `BYPASSRLS`.

## Human configuration still required

Before implementing authenticated or deployed environments, the team must choose and configure:

- a managed OIDC provider and local authentication strategy;
- development, staging, and production hosting accounts and workload identities;
- secret management, object storage, queue, notification, and observability providers;
- Apple and Google application signing/distribution accounts;
- media retention, privacy/consent, locale, device, and accessibility requirements.

These decisions require separate approval. Nothing in this foundation changes DNS, `ursai.net`,
production infrastructure, supplier accounts, or any external service.
