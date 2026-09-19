# URSAI Phased Implementation Plan

Status: planning only  
Source: [`ursai-technical-blueprint.md`](./ursai-technical-blueprint.md)  
Prepared: 19 September 2026

## 1. Purpose and delivery principles

This document translates the technical blueprint into an executable build plan. It does **not** scaffold or implement the application, provision infrastructure, configure DNS, select paid vendors, or connect external services.

The first release should prove one dependable operational loop across three real projects:

> assigned task → time and evidence submission → manager acceptance → material shortage/request → bounded purchase approval → manual order → verified receipt and stock posting

The delivery approach is governed by these principles:

1. **Build the auditable system of record before intelligence.** Tenant isolation, permissions, accepted work, inventory transactions, approvals, costs, and audit history are prerequisites for AI.
2. **Use a modular monolith first.** Keep business modules separated in code while initially deploying one NestJS API and one PostgreSQL database. Extract services only for demonstrated scaling, reliability, or ownership needs.
3. **Design offline behavior as a core workflow.** The field application must make queued, synced, rejected, conflicted, and accepted states explicit.
4. **Keep authoritative actions deterministic.** AI may observe, summarize, and recommend; domain services and authorized people accept progress, post stock/costs, publish schedules, and execute purchases.
5. **Make ledgers append-only.** Inventory, approvals, accepted evidence, audit records, and costs are corrected through reversals or superseding records rather than destructive edits.
6. **Establish tenant and project boundaries immediately.** Even the single-company pilot must use tenant-scoped keys, server authorization, and PostgreSQL row-level security.
7. **Prefer vertical slices over disconnected layers.** Each phase should ship an end-to-end usable workflow with API, web/mobile UI, persistence, authorization, audit, and tests.
8. **Keep external integrations behind adapters.** Begin with fake and manual supplier adapters. Do not enable automated ordering until commercial access and the complete lifecycle are verified.

## 2. Recommended repository structure

Use a TypeScript-first `pnpm` workspace with Turborepo (or Nx if the team already operates it). Keep the Python AI worker in the same repository but in its own independently built workspace. The proposed structure is:

```text
ursai/
├── apps/
│   ├── web/                         # Next.js manager dashboard and client portal
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   └── tests/
│   ├── mobile/                      # Expo React Native app for field/manager/logistics roles
│   │   ├── app/
│   │   ├── features/
│   │   ├── offline/
│   │   └── tests/
│   ├── api/                         # NestJS modular monolith and REST/OpenAPI surface
│   │   ├── src/modules/
│   │   │   ├── identity-access/
│   │   │   ├── projects/
│   │   │   ├── workforce/
│   │   │   ├── tasks-scheduling/
│   │   │   ├── evidence/
│   │   │   ├── inventory/
│   │   │   ├── procurement/
│   │   │   ├── logistics/
│   │   │   ├── job-costing/
│   │   │   ├── reporting/
│   │   │   └── notifications/
│   │   └── test/
│   ├── worker/                      # Node queue consumers: outbox, media, reports, notifications
│   └── ai-worker/                   # Python AI, forecasting, and later OR-Tools jobs
│       ├── src/
│       ├── contracts/
│       ├── evaluations/
│       └── tests/
├── packages/
│   ├── api-client/                  # Generated OpenAPI client; never hand-maintained DTO copies
│   ├── contracts/                   # Shared event names, schemas, IDs, enums, sync envelopes
│   ├── domain/                      # Pure domain value types/policies with no framework imports
│   ├── database/                    # PostgreSQL schema, migrations, seeds, RLS, test fixtures
│   ├── auth/                        # Permission vocabulary and client auth helpers
│   ├── design-system/               # Accessible web tokens/components
│   ├── mobile-ui/                   # Mobile-specific components and tokens
│   ├── observability/               # Logging, trace, metrics, and correlation conventions
│   ├── config/                      # Typed config loading and environment validation
│   ├── test-kit/                    # Factories, clocks, fake object store/queue/supplier/OIDC
│   ├── eslint-config/
│   └── tsconfig/
├── infrastructure/
│   ├── local/                       # Docker Compose for local PostgreSQL/object store/queue emulator
│   ├── modules/                     # Reusable IaC modules, added only after platform decision
│   └── environments/                # Dev/staging/prod declarations; no secrets in Git
├── docs/
│   ├── architecture/                # ADRs, context/container diagrams, trust boundaries
│   ├── product/                     # Validated workflows, role matrix, glossary, decisions
│   ├── runbooks/                    # Restore, outbox replay, credential revocation, rollback
│   ├── testing/                     # Test strategy and release evidence
│   └── integrations/                # Supplier capability records and adapter contracts
├── scripts/                         # Repeatable local/CI tasks; no production credentials
├── .github/workflows/               # CI first; deployment workflows only when environments exist
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── pyproject.toml
└── README.md
```

### 2.1 Ownership boundaries

| Area | Responsibility | Must not own |
|---|---|---|
| `apps/web` | Manager workflows, client report views, accessible desktop/responsive UI | Authorization truth, financial calculations, direct database access |
| `apps/mobile` | Role-specific navigation, capture, local SQLite projections, sync queue, visible conflicts | Silent acceptance, authoritative stock, background-upload guarantees |
| `apps/api` | Authentication context, authorization, state transitions, transactions, OpenAPI, signed-upload authorization | CPU-heavy media processing, model execution |
| `apps/worker` | Outbox publication and idempotent asynchronous side effects | Unchecked business state changes |
| `apps/ai-worker` | Typed observations, evaluation, forecasts, schedule proposals | Direct database writes, approvals, purchases, gate bypasses |
| `packages/database` | Schema, migrations, tenant RLS, constraints, seed/reference data | UI-specific models |
| `packages/contracts` | Stable cross-process schemas and versioning | Framework-specific persistence entities |
| `packages/api-client` | Generated API bindings for web/mobile | Hand-edited business logic |

Dependency direction should be enforced: applications may depend on packages; packages must not import applications; pure domain/contracts packages must not depend on NestJS, Next.js, Expo, or database adapters. Domain modules communicate through explicit application interfaces and recorded domain events, not by reaching into another module's repositories.

## 3. Application and package plan

### 3.1 Manager and client web

Build a Next.js/React/TypeScript application with these feature areas, in order:

1. Authenticated shell, active-company context, project selector, permission-aware navigation, and data freshness indicators.
2. Project/location/scope setup and workforce views.
3. Task dependency, assignment, and schedule views.
4. Evidence review queue and accepted-progress dashboard.
5. Materials, requisitions, approvals, receiving, and budget/commitment views.
6. Internal reporting, then an explicitly published restricted client portal.

Use server-provided permissions to shape the interface, but never treat hidden UI as authorization. Favor feature folders and thin route components. Use the generated client and a query/cache library for server state; do not create a second client-side domain store.

### 3.2 Field and logistics mobile app

Build one Expo React Native application with navigation and screens selected by effective role and project assignment:

- **Field:** Today, task detail, timer, checklist, evidence capture, blockers, materials, inbox.
- **Manager:** action inbox, evidence review, assignment acknowledgment, bounded approval review where practical.
- **Logistics:** pickups, order readiness, collection exceptions, in-transit state, delivery/receipt proof.

SQLite stores authorized projections and a local outbox, not an independent source of truth. Every queued mutation contains an operation UUID, resource/base version, actor/device, local capture time, and typed payload. Media remains in protected application storage until checksum-verified finalization. The UI must preserve recoverable rejected work and distinguish local, uploading, synced, conflicted, and server-accepted states.

### 3.3 Backend API

Implement a NestJS REST API under `/v1` as a modular monolith. Each module contains application commands/queries, domain rules, persistence adapters, HTTP controllers, and tests. Common middleware/interceptors establish correlation ID, authenticated subject, active tenant membership, project scope, idempotency, version checks, and audit context.

Initial module order:

1. identity/access and audit;
2. projects, locations, cost codes, workforce, and skills;
3. tasks, dependencies, gates, assignments, time, and schedule versions;
4. media upload/finalization, evidence submission, and human review;
5. inventory ledger/reservations/counts;
6. requisitions, immutable approval packets, fake/manual ordering, receipts;
7. job costing, reports, notification inbox, and sync change feed.

All writes use database transactions. Business mutations and their outbox records commit atomically. Sensitive aggregates use optimistic versions; duplicate operation IDs return the original result, while stale versions return a typed conflict. OpenAPI is the contract used to generate web/mobile clients.

### 3.4 Database

Use one managed PostgreSQL database initially and PostgreSQL containers locally. Organize migrations in dependency groups rather than attempting all blueprint tables in one change:

1. tenant/users/memberships/roles/permissions/audit/idempotency;
2. clients/projects/project membership/locations/calendars/cost codes;
3. scope/tasks/dependencies/gates/assignments/time/submissions/reviews/schedules;
4. media/baselines/evidence/AI run metadata;
5. units/materials/locations/lots/transactions/balances/reservations/counts;
6. requisitions/quotes/approvals/orders/fulfillment/logistics/receipts;
7. budgets/reservations/cost entries/invoices/expenses/reports;
8. outbox/consumer receipts/webhook inbox/notifications/sync change cursor.

Every tenant-owned table uses tenant-inclusive foreign keys and indexes. RLS defaults to deny, with transaction-local verified tenant context. The normal runtime role cannot own tables or bypass RLS; migration and runtime roles remain separate. Ledger, approval, review, published revision, and audit records are immutable. Migration tests should prove forward migration from empty state, constraints, RLS, and fixture loading; production rollback favors a tested forward fix when data-destructive down migrations would be unsafe.

### 3.5 Shared packages

- **Contracts:** runtime-validated schemas for API-adjacent envelopes, events, AI requests/responses, and sync operations. Version every durable payload.
- **API client:** generated from the checked OpenAPI artifact in CI; fail if generated output drifts.
- **Domain:** branded identifiers, money/quantity/timezone primitives, status machines, approval packet hashing, and pure policies.
- **Database:** migrations, query/repository primitives, RLS setup, and sanitized fixtures. Do not leak database row types as public API types.
- **Auth:** permission codes, route requirements, and client helpers; the API remains authoritative.
- **UI packages:** share design tokens while keeping web and native component implementations separate where platform behavior differs.
- **Observability/config/test-kit:** consistent instrumentation, strict startup validation, deterministic clocks/IDs, and local fakes.

### 3.6 Asynchronous and AI services

The first worker publishes the transactional outbox and handles thumbnails, notifications, and report generation through a durable queue with bounded retries and a dead-letter path. Consumers record event IDs before producing non-idempotent effects.

The Python service is introduced in Phase 2 only after human evidence workflows generate trusted data. It receives typed, tenant-scoped jobs and returns structured observations through an internal API/event contract. It must never receive unrestricted credentials or write authoritative tables. Scheduling begins with deterministic dependency/critical-path calculations; OR-Tools is added only when shared-resource optimization is ready for validation.

## 4. What to build first

### 4.1 Inception deliverables (before feature code)

The first work is product and architecture validation, not UI scaffolding:

1. Interview the owner, one project manager if distinct, a plumber, tile setter, and logistics worker.
2. Map three representative projects and the real paper/chat/spreadsheet workflow.
3. Agree the glossary, role/permission matrix, delegation and purchase limits, labor-cost recognition, client visibility, languages, supported devices, media retention, and baseline task templates.
4. Prototype the field `Today → Capture → Submit` flow and manager `Review → Accept/Request evidence` flow; test outdoors and with intermittent connectivity assumptions.
5. Define acceptance evidence for a small set of representative task types and identify required human/inspection gates.
6. Produce ADRs for workspace tooling, database access/migration library, OIDC abstraction, queue abstraction, object-store abstraction, and hosting target.
7. Record supplier onboarding questions and begin commercial discovery without connecting an account.
8. Establish measurable pilot baselines and exit criteria.

### 4.2 First implemented vertical slice

After inception approval, build a narrow, non-AI slice:

1. Authenticate through a local/fake OIDC provider.
2. Resolve a tenant membership and enforce one permission plus project membership in both the API and RLS.
3. Create a project/location and task; assign it to a worker.
4. Sync the assignment to mobile and display its freshness.
5. Record offline time/checklist data and one photo with an operation ID.
6. Resume and finalize upload; submit the task for review.
7. Review it on web and append an accept/request-more-evidence decision.
8. Display accepted progress and its audit trail.
9. Prove duplicate submission, stale version, cross-tenant access, revoked-user reconnect, and interrupted upload behaviors.

This slice validates the highest-risk foundation—authorization, offline mutation semantics, private media, immutable review, and auditability—before broadening the data model.

## 5. Dependencies and infrastructure

Exact versions must be selected, compatibility-tested, pinned, and recorded at kickoff rather than described as “latest.”

### 5.1 Development dependencies

| Concern | Planned dependency/capability |
|---|---|
| Workspace | Node.js LTS, Corepack, `pnpm`, Turborepo/Nx |
| Web | Next.js, React, TypeScript, accessible component primitives, query/cache library, form and runtime schema validation |
| Mobile | Expo/React Native, Expo Router, SQLite, secure credential storage, protected file storage, camera/media, network state |
| API | NestJS, OpenAPI generation, runtime validation, PostgreSQL driver/query builder or ORM selected by ADR |
| Database testing | PostgreSQL containers/Testcontainers; real PostgreSQL for RLS and transaction tests |
| Python | Supported Python, typed models/schema validation, HTTP/queue client, image tooling; OR-Tools later |
| Quality | ESLint, formatter, strict TypeScript, Python lint/type checking, unit/integration/contract/E2E frameworks |
| Security | Dependency and secret scanning, SBOM generation, container scanning, signed build provenance where supported |
| Observability | OpenTelemetry SDKs, structured/redacted logging, metrics and error tracking adapters |

Avoid adding `pgvector`, a dedicated search system, custom model training, a second authoritative database, route optimization, payroll, or BIM tooling until a measured use case passes a design review.

### 5.2 Local development infrastructure

Provide a reproducible local stack only when implementation begins:

- PostgreSQL with separate migration/test/runtime roles and RLS enabled;
- S3-compatible storage emulator with private buckets and expiring signed URLs;
- queue emulator or local durable queue abstraction, including dead-letter behavior;
- fake OIDC identities for every seed role and adverse authorization fixtures;
- fake supplier adapter able to simulate confirmation, timeout/unknown result, partial fulfillment, changed quote, cancellation, and duplicate webhook;
- mail/push capture stubs rather than real delivery;
- deterministic sample projects and non-sensitive media.

### 5.3 Eventual managed infrastructure (not provisioned by this plan)

| Capability | Required properties |
|---|---|
| Container hosting | Independent API, Node worker, and Python worker scaling; health checks; controlled rollout/rollback |
| PostgreSQL | Encryption, high availability appropriate to environment, point-in-time recovery, monitoring, proven restore path |
| Object storage/CDN | Private-by-default objects, versioning/retention, malware-processing quarantine, short-lived authorized delivery |
| Queue/DLQ | At-least-once delivery, visibility timeout, bounded retry, dead-letter alarm, operator replay |
| OIDC | MFA for privileged users, subject stability, account disable/revocation; app-owned authorization remains in PostgreSQL |
| Secrets/KMS | Workload identities, encryption keys, rotation, audited access; no secrets in repository or model prompts |
| Edge protection | TLS, WAF/rate limiting, API request limits, restricted administrative paths |
| Observability | Central logs/traces/metrics, redaction, tenant-safe correlation, alerts and error tracking |
| CI/CD | Isolated dev/staging/production identities, migration gates, artifact promotion, approvals, rollback evidence |
| Backup/recovery | Database and media recovery objectives, restore drills, outbox replay, documented incident runbooks |

AWS can map these to ECS/Fargate, RDS PostgreSQL, S3, SQS/DLQ, Secrets Manager/KMS, and CloudFront/WAF, but the provider should remain an explicit owner decision. No cloud account, domain, DNS, production environment, or third-party service should be changed during planning or initial local development.

### 5.4 External dependencies requiring owner/vendor input

- OIDC vendor, MFA policy, and user lifecycle.
- Apple/Google developer accounts and device distribution strategy.
- Supplier commercial eligibility, APIs/PunchOut/cXML/EDI capabilities, sandbox, payment arrangement, and reconciliation behavior.
- Push, transactional email/SMS, accounting export/connector, error tracking, and AI providers.
- Legal/privacy requirements, retention classes, consent for worker location/media, and client-image redaction.
- Supported locales, currency expansion, devices, media volume, and cellular-data constraints.

Development must proceed through abstractions and fakes while these are unresolved; unresolved procurement access cannot block the manual ordering workflow.

## 6. Phased delivery sequence

The estimates assume the blueprint's recommended cross-functional team and are ranges, not commitments. Sprints are two weeks unless the team establishes another cadence.

### Phase 0 — Discovery and architecture foundations (2 weeks)

**Tasks**

- Validate roles, journeys, task templates, evidence protocols, three-project fixtures, terminology, and product boundaries.
- Decide the workspace/build stack and document ADRs.
- Define OpenAPI, event, idempotency, optimistic concurrency, error, sync, and audit conventions.
- Threat-model authentication, tenant/project authorization, private media, offline devices, supplier inputs, and privileged approvals.
- Define data classifications, retention assumptions, logging redaction, recovery objectives, and feature-flag policy.
- Wireframe and field-test the first vertical slice.
- Define pilot metrics and testable exit gates; begin supplier capability discovery.

**Exit gate:** signed-off workflows and permissions; representative fixtures; architecture decisions; risk register; demonstrably usable prototype; no unresolved decision that changes the core data model.

### Phase 1A — Engineering foundation and access (Sprint 1)

**Tasks**

- Create the monorepo, pinned toolchains, formatting/lint/type/test commands, ownership rules, and CI checks.
- Create local PostgreSQL, object storage, queue, fake OIDC, fake supplier, and sanitized fixtures.
- Implement strict configuration, health endpoints, structured logging, trace correlation, and feature flags.
- Migrate identity, tenant, membership, role, permission, project, project membership, location, audit, and idempotency tables.
- Enforce tenant-inclusive references and RLS with separate database roles.
- Implement authenticated context and permission/project guards; build the web shell and mobile sign-in shell.

**Exit gate:** CI is green; migrations are repeatable; cross-tenant/project tests fail closed; runtime role cannot bypass RLS; secrets and logs pass checks.

### Phase 1B — Workforce, tasks, and scheduling baseline (Sprint 2)

**Tasks**

- Implement workforce profiles, skills, availability, project calendars, cost codes, scope versions, tasks, dependencies, checklists, gates, and assignments.
- Reject dependency cycles and shared-worker schedule collisions transactionally.
- Create manual schedule versions, publish one active version, notify affected users through the durable inbox, and record acknowledgments.
- Build project/task/workforce/schedule manager screens and mobile Today/task detail read models.
- Generate the OpenAPI client and add domain/API/component tests.

**Exit gate:** a manager can set up a project, publish a valid assignment, and an authorized worker can download only their permitted work; stale schedule state is visible.

### Phase 1C — Offline time, evidence, and review (Sprint 3)

**Tasks**

- Implement the mobile SQLite projection, local outbox, operation IDs, sync cursor, tombstones, conflicts, retry, and revoked-access recovery behavior.
- Add time entry validation and overlap review.
- Add signed media sessions, protected local media, resumable upload/finalization, checksums, processing status, thumbnails, limits, and authorization on fetch.
- Build guided task capture/submission and manager evidence review with immutable decisions and audit history.
- Derive accepted progress only from non-superseded authorized reviews.
- Test a full offline shift, process restart, partial upload, duplicate operation, stale version, and reconnect after revocation.

**Exit gate:** no acknowledged data loss or duplicate acceptance in fault tests; queued work never appears accepted; cross-project media access is denied.

### Phase 1D — Materials, controlled manual procurement, and costs (Sprint 4)

**Tasks**

- Implement units, materials, packaging, task requirements, inventory locations/lots, append-only transactions, balances, reservations, counts, quarantine, and corrections.
- Implement requisitions, quotes, versioned packet hashing, approval policies/decisions, atomic budget reservations, and expiry/reapproval.
- Implement the supplier interface, fake adapter, manual order confirmation, unknown outcome, fulfillment, logistics, partial/damaged receipt, returns, and stock posting.
- Implement labor/material cost entries, commitments versus actuals, and baseline budget views.
- Build field material requests, manager approval UI, logistics pickup/delivery UI, and receiving reconciliation.
- Add state-machine, concurrency, ledger invariant, adapter contract, and financial double-counting tests.

**Exit gate:** the complete first-release loop operates through manual ordering; concurrent approvals cannot overspend; retries cannot duplicate orders, receipts, stock, or cost.

### Phase 1E — Reporting, hardening, and pilot (Sprint 5 if needed + 2-week pilot)

**Tasks**

- Generate internal reports from immutable cutoff snapshots and source links; add manager-reviewed client publication.
- Finish accessibility, localization readiness, outdoor usability, upload/data controls, and support/admin tooling.
- Add dashboards for outbox/DLQ, sync failures, media processing, and unresolved procurement outcomes.
- Execute authorization, offline, inventory, financial, recovery, performance, and device test matrices.
- Restore a backup in a clean environment; replay outbox safely; practice credential revocation and application rollback.
- Pilot across three projects, triage daily, and measure adoption, review time, stockout hours, forecast baseline, overrides, and budget accuracy.

**Exit gate:** two pilot weeks with no lost acknowledged data or duplicate ledger posting; recovery and access tests pass; owners accept the field workflow and manual controls.

### Phase 2 — AI assistance, forecasting, and draft scheduling (8–10 weeks)

**Tasks**

1. Version baseline/reference assets and capture protocols; create quality and provenance checks.
2. Build the Python worker contract and AI run ledger with model/prompt/schema/input versions, cost, latency, and errors.
3. Collect consented expert labels split by project; define held-out evaluation and abstention cases.
4. Run visual assessment in shadow mode, emitting observations and missing evidence—not acceptance.
5. Add reviewer corrections, model disable/rollback, drift monitoring, and per-tenant usage limits.
6. Implement accepted-progress velocity and deterministic critical path, then resource-constrained draft scheduling.
7. Implement time-phased material demand, count freshness, safety stock, inbound timing, and shortage drafts.
8. Add grounded report summaries linked to source records.

**Exit gate:** reviewed shadow metrics meet the agreed gate (including reported sample size/confidence); concealed-work gates remain human-only; proposed schedules are feasible/explainable; core workflows survive AI/provider outage.

### Phase 3 — Verified procurement automation (6–10 weeks, dependent on vendor access)

**Tasks**

- Validate one supplier's documented lifecycle, commercial permissions, sandbox, payment method, and webhook security.
- Implement adapter capability flags, catalog/quote/order/status/cancel/receipt operations, and provider contract tests.
- Bind approval to an immutable packet, maximum all-in amount, expiry, supplier account, delivery, and payment arrangement.
- Implement provider idempotency where supported plus internal submission keys, unknown-outcome reconciliation, webhook inbox/deduplication, and operator exceptions.
- Complete partial fulfillment, split delivery, substitutions requiring reapproval, cancellation confirmation, returns, invoice matching, credits, and pickup credential controls.
- Run controlled failure injection and tenant-feature-flag rollout: manual → shadow → assisted → narrowly automated.

**Exit gate:** approved sandbox/test scenarios pass for timeout after acceptance, replayed webhook, changed quote, partial fulfillment, cancellation, refund/credit, and reconciliation; no order can execute outside a valid authorization packet.

### Phase 4 — Scale only from evidence (post-launch)

Potential work—prioritized only from observed demand—includes accounting connectors, route optimization, richer client collaboration, measured search/vector retrieval, additional suppliers, multilingual workflows, advanced resource scheduling, and service extraction. Custom model training, BIM reconstruction, payroll, autonomous trade certification, open-ended shopping agents, and a broad marketplace remain explicitly outside the initial roadmap.

## 7. Cross-cutting workstreams

These are not final hardening tasks; they accompany every vertical slice.

### Security and privacy

- Threat model each new data flow and privileged transition.
- Test authorization with adversarial tenant/project/object IDs and pooled connections.
- Validate file signatures, limits, checksums, malware state, signed URL expiry, and authorization on every fetch.
- Redact logs and traces; never place supplier/payment secrets or private media in prompts.
- Maintain explicit retention and deletion/legal-hold behavior by record class.

### Reliability and operations

- Define service-level indicators before targets; instrument latency, errors, queue age, sync health, and data freshness.
- Make queue effects idempotent; expose DLQ inspection/replay with authorization and audit.
- Test database/media restoration and reference reconciliation.
- Ensure AI, supplier, push, and report failures degrade to visible manual queues.

### Testing

Use a test pyramid suited to transactional workflows:

- pure unit/property tests for state machines, money, quantities, packet hashes, forecasts, and schedule constraints;
- real-PostgreSQL integration tests for transactions, locks, constraints, RLS, outbox, and ledgers;
- API contract and generated-client drift tests;
- supplier adapter contract suites shared by fake and real adapters;
- web/mobile component tests plus a small set of critical E2E journeys;
- device/offline chaos scenarios and media interruption tests;
- load tests against the agreed pilot profile;
- recovery, security, and AI held-out regression suites as release evidence.

### Product and accessibility

- Conduct field usability sessions each sprint, including outdoor contrast, gloves/large targets, limited typing, and slow networks.
- Keep data freshness and authoritative state understandable in every role.
- Review instrumentation for misuse: photo volume and uncertain AI output are not worker productivity or disciplinary evidence.
- Capture decisions and measure outcomes against the pre-pilot baseline.

## 8. Milestones, dependencies, and critical path

| Milestone | Depends on | Unlocks |
|---|---|---|
| Validated workflow/permission model | Owner and field interviews | Stable schema and UX |
| Tenant/RLS/auth foundation | OIDC abstraction decision | Every protected feature |
| Tasks/assignments and schedule versions | Projects/workforce | Mobile daily plan |
| Offline sync and private media | Auth, task versioning, object-store abstraction | Evidence workflow |
| Human acceptance and accepted progress | Evidence and review rules | Forecast inputs and reporting |
| Inventory ledger | Units/materials and receipt invariants | Shortage calculations |
| Approval/order state machine | Budgets, requisitions, fake supplier | Safe manual procurement and future connectors |
| Stable manual pilot data | Full Phase 1 loop | AI evaluation and schedule optimization |
| Verified supplier access | Vendor/commercial process, not engineering alone | Phase 3 automation |

The critical technical path is authorization/RLS → task/version model → offline sync/private media → human acceptance → inventory/approval ledgers → pilot. AI and live supplier integration must not move onto this path prematurely.

## 9. Definition of done and release governance

A story is done only when it includes:

- explicit acceptance and authorization rules;
- migration/contract changes and backward-compatibility notes where applicable;
- unit and real-infrastructure integration coverage;
- audit, idempotency, conflict, and failure behavior for mutations;
- accessible loading/empty/error/offline/stale states;
- logs, traces, metrics, redaction, and an operator recovery path;
- updated documentation and generated clients;
- no embedded secrets or production-specific assumptions.

A phase release additionally requires passing its exit gate, a reviewed migration plan, security/privacy review, recovery evidence, performance results at the agreed load, release/rollback instructions, and product-owner signoff. High-risk capabilities use tenant-level flags and progressive rollout.

## 10. Decisions required before implementation begins

The following should be resolved during Phase 0 and captured as ADRs or product decisions:

1. Team size, decision owners, pilot participants, and three representative projects.
2. Supported device/OS range, connectivity profile, languages, and accessibility needs.
3. Role delegation, project membership rules, purchasing limits, and multi-approver conditions.
4. Task templates, evidence requirements, inspection/test gates, units, cost codes, and scheduling calendars.
5. Labor approval/rate policy and material receipt/invoice job-cost recognition.
6. Client-visible information and report publication workflow.
7. Media/document retention, privacy/consent, location use, and redaction requirements.
8. Workspace tooling, database library, managed OIDC shortlist, cloud target, and observability approach.
9. First supplier account/capabilities and whether accounting export is required in the pilot.
10. Pilot volumes, service/recovery targets, success metrics, and stop/go criteria.

None of these decisions authorizes changes to production infrastructure, DNS, domains, supplier accounts, payment rails, or any external service. Such changes require a separate, explicit implementation request and approved rollout plan.
