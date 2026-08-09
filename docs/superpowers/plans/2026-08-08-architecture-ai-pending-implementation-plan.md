# Architecture AI Pending Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the executable Architecture AI MVP flow so persisted analyses can generate Architecture Packages and be reviewed through the API, CLI, and web UI.

**Architecture:** Extend the existing modular monolith with SQLite-backed application services. The API owns the workflow; CLI and React/Vite are thin clients over the same HTTP contracts. Git remains the Architecture Knowledge Base System of Record, while SQLite stores operational analysis and governance state.

**Tech Stack:** Node.js 22+, pnpm, TypeScript, Fastify, React 19, Vite, Commander, Zod, Vitest, and Node 22 `node:sqlite` `DatabaseSync` for the local operational database. The deterministic model remains the default `ArchitectureModel` implementation.

## Global Constraints

- SQLite is an implementation detail for operational workflow state, not the corporate knowledge source.
- Git Markdown/OKF and the ontology remain the System of Record for architecture knowledge.
- CLI and web call the same API/application capabilities and contain no duplicated domain logic.
- Significant decisions require the lifecycle `DRAFT -> REVIEWED -> APPROVED`.
- Direct approval from `DRAFT` is rejected.
- Missing or insufficient evidence remains explicit and cannot become approved corporate knowledge.
- The local MVP runs without external infrastructure or model credentials.
- The deterministic model is the default; `ArchitectureModel` remains the extension point for a future provider.
- The phase excludes authentication, cloud deployment, real-time collaboration, free-form chat, and diagram editing.
- API errors use these stable codes: `INVALID_REQUEST`, `NOT_FOUND`, `INVALID_REVISION`, `PACKAGE_GENERATION_FAILED`, `INVALID_REVIEW_TRANSITION`, `INSUFFICIENT_EVIDENCE`, and `PERSISTENCE_ERROR`.

---

## File and module map

```text
packages/persistence/src/       SQLite schema, migrations, repositories
packages/application/src/       analysis, package, governance services
apps/api/src/                   route adapters and composition
apps/cli/src/                   HTTP client commands and exit codes
apps/web/index.html             Vite entry document
apps/web/src/main.tsx           React mount point
apps/web/src/pages/             executable workflow screens
tests/e2e/                      restart, API, CLI, package, and review tests
.architecture-ai/               ignored local SQLite database and outputs
```

`packages/domain` remains the owner of shared entities and ports. Persistence owns database access. Application services own workflows. API, CLI, and web import contracts but do not implement workflow rules.

## Task 1: Add SQLite persistence and repositories

**Files:**
- Modify: `package.json`
- Modify: `pnpm-workspace.yaml`
- Modify: `tsconfig.json`
- Create: `.architecture-ai/.gitkeep`
- Create: `packages/persistence/package.json`
- Create: `packages/persistence/tsconfig.json`
- Create: `packages/persistence/src/database.ts`
- Create: `packages/persistence/src/schema.ts`
- Create: `packages/persistence/src/analysis-repository.ts`
- Create: `packages/persistence/src/review-repository.ts`
- Create: `packages/persistence/src/index.ts`
- Test: `packages/persistence/src/persistence.test.ts`

**Interfaces:**
- `DatabaseStore.open(path: string): DatabaseStore`.
- `AnalysisRepository.create(input: AnalysisRecordInput): Promise<AnalysisRecord>`.
- `AnalysisRepository.get(id: string): Promise<AnalysisRecord | undefined>`.
- `AnalysisRepository.updateResult(id: string, result: AnalysisResult): Promise<void>`.
- `ReviewRepository.saveDecision(analysisId: string, decision: ArchitectureDecision): Promise<void>`.
- `ReviewRepository.getDecision(id: string): Promise<ArchitectureDecision | undefined>`.
- `ReviewRepository.listDecisions(analysisId: string): Promise<ArchitectureDecision[]>`.
- `ReviewRepository.recordReview(review: Review): Promise<void>`.
- `ReviewRepository.listAudit(decisionId: string): Promise<Review[]>`.

- [ ] **Step 1: Write failing persistence tests** for schema creation, analysis round-trip, decision round-trip, review/audit append, and persistence after reopening the same SQLite file.
- [ ] **Step 2: Run `node_modules\\.bin\\vitest.cmd run packages/persistence/src/persistence.test.ts --run`** and verify the package is missing.
- [ ] **Step 3: Implement `DatabaseStore` with `node:sqlite` `DatabaseSync`.** Create `.architecture-ai` when needed and execute idempotent `CREATE TABLE IF NOT EXISTS` statements for `analyses`, `decisions`, `reviews`, and `audit_events`.
- [ ] **Step 4: Implement repositories** using parameterized SQL and JSON serialization for `result_json` and `decision_json`. Store `knowledge_revision`, lifecycle status, significant flag, and ISO timestamps.
- [ ] **Step 5: Add database path protection** so only `.architecture-ai/architecture-ai.sqlite` or an explicitly supplied test path is accepted; never use the corporate knowledge directory as operational storage.
- [ ] **Step 6: Run the focused test and `node_modules\\.bin\\tsc.cmd -b`**; confirm all persistence tests pass.
- [ ] **Step 7: Commit** with `git add package.json pnpm-workspace.yaml tsconfig.json .architecture-ai packages/persistence && git commit -m "feat: add SQLite workflow persistence"`.

## Task 2: Add application services for analysis, packages, and governance

**Files:**
- Modify: `packages/domain/src/types.ts`
- Modify: `packages/domain/src/ports.ts`
- Create: `packages/application/package.json`
- Create: `packages/application/tsconfig.json`
- Create: `packages/application/src/analysis-service.ts`
- Create: `packages/application/src/package-service.ts`
- Create: `packages/application/src/governance-service.ts`
- Create: `packages/application/src/model-provider.ts`
- Create: `packages/application/src/index.ts`
- Test: `packages/application/src/analysis-service.test.ts`
- Test: `packages/application/src/package-service.test.ts`
- Test: `packages/application/src/governance-service.test.ts`

**Interfaces:**
- `AnalysisService.create(input: AnalysisRequest): Promise<AnalysisRecord>`.
- `AnalysisService.get(id: string): Promise<AnalysisRecord>`.
- `PackageService.generate(id: string, outputDirectory: string): Promise<ArchitecturePackage>`.
- `GovernanceService.review(id: string, reviewer: string, comment?: string): Promise<ArchitectureDecision>`.
- `GovernanceService.approve(id: string, reviewer: string, comment?: string): Promise<ArchitectureDecision>`.
- `GovernanceService.reject(id: string, reviewer: string, comment?: string): Promise<ArchitectureDecision>`.
- `GovernanceService.requestChanges(id: string, reviewer: string, comment?: string): Promise<ArchitectureDecision>`.
- `GovernanceService.audit(id: string): Promise<Review[]>`.
- `DeterministicArchitectureModel implements ArchitectureModel` and returns stable output without network access.

- [ ] **Step 1: Extend domain contracts** with `AnalysisRecord`, `AnalysisRecordInput`, `PackageGenerationResult`, and typed service errors while preserving existing entities.
- [ ] **Step 2: Write failing service tests** for analysis persistence, orchestration result storage, package generation from a stored result, missing analysis errors, and lifecycle/audit rules.
- [ ] **Step 3: Implement `AnalysisService.create`.** Resolve the requested Git revision through `KnowledgeSource`, build retrieval projections, invoke `ArchitectureOrchestrator`, persist the result and each decision, and return `DRAFT` or `INCOMPLETE` status.
- [ ] **Step 4: Implement `PackageService.generate`.** Load the persisted analysis, call `FilePackageRenderer`, return generated relative file paths, and map filesystem/traceability failures to `PACKAGE_GENERATION_FAILED`.
- [ ] **Step 5: Implement `GovernanceService`.** Use the persistence repository as the source of decision state, enforce `DRAFT -> REVIEWED -> APPROVED`, reject direct approval with `INVALID_REVIEW_TRANSITION`, and append both review and audit records.
- [ ] **Step 6: Implement typed error mapping** for `INVALID_REVISION`, `NOT_FOUND`, `INSUFFICIENT_EVIDENCE`, and `PERSISTENCE_ERROR`.
- [ ] **Step 7: Run focused application tests and typecheck; commit** with `git add packages/domain packages/application && git commit -m "feat: add persisted analysis and governance services"`.

## Task 3: Complete API routes and application composition

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/tsconfig.json`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/server.ts`
- Create: `apps/api/src/composition.ts`
- Create: `apps/api/src/routes/analyses.ts`
- Create: `apps/api/src/routes/packages.ts`
- Create: `apps/api/src/routes/reviews.ts`
- Test: `apps/api/src/routes.test.ts`

**Interfaces:**
- `buildApp(services: ApplicationServices): FastifyInstance`.
- `POST /analyses` returns `201 { id, status, traceability }`.
- `GET /analyses/:id` returns the persisted analysis.
- `POST /packages/:id/generate` accepts `{ outputDirectory?: string }`.
- `GET /packages/:id`, `/traceability`, and `/decisions` read persisted state.
- `POST /decisions/:id/review|approve|reject|request-changes` accepts `{ reviewer, comment? }`.
- `GET /decisions/:id/audit` returns append-only review history.

- [ ] **Step 1: Replace the in-memory `Map` route state** with composed `AnalysisService`, `PackageService`, and `GovernanceService` instances.
- [ ] **Step 2: Write failing route tests** for create, restart persistence using two app instances over the same database, package generation, decision review, approval rejection from draft, approval after review, audit reads, and all stable error codes.
- [ ] **Step 3: Implement route modules** with Zod request schemas and a single typed error-to-status mapping: 400 for invalid request/transition, 404 for missing records, 409 for insufficient evidence, and 500 for persistence/package failures.
- [ ] **Step 4: Preserve existing route response shapes** where they are already used by tests, adding persisted fields without removing `id`, `status`, or `traceability`.
- [ ] **Step 5: Update `scripts/start-api.mjs`** to compose the production repositories/services and use the local `.architecture-ai` database.
- [ ] **Step 6: Run API tests, e2e API tests, and typecheck; commit** with `git add apps/api scripts/start-api.mjs && git commit -m "feat: expose persisted analysis and governance API"`.

## Task 4: Make the CLI a functional API client

**Files:**
- Modify: `apps/cli/package.json`
- Modify: `apps/cli/src/main.ts`
- Create: `apps/cli/src/api-client.ts`
- Create: `apps/cli/src/commands/analyze.ts`
- Create: `apps/cli/src/commands/package.ts`
- Create: `apps/cli/src/commands/review.ts`
- Create: `apps/cli/src/commands/errors.ts`
- Test: `apps/cli/src/commands.test.ts`

**Interfaces:**
- `ApiClient.createAnalysis(input): Promise<AnalysisCreateResponse>`.
- `ApiClient.generatePackage(id, outputDirectory): Promise<PackageGenerationResult>`.
- `ApiClient.reviewDecision(id, action, reviewer, comment?): Promise<ArchitectureDecision>`.
- `ApiClient.getAudit(id): Promise<Review[]>`.
- CLI environment: `ARCHITECTURE_AI_API_URL`, default `http://127.0.0.1:3000`.

- [ ] **Step 1: Write failing CLI tests** using a fake `fetch` for successful analyze/package/review calls, API error output, and non-zero command failures.
- [ ] **Step 2: Implement `ApiClient`** with JSON parsing, stable error extraction, timeout handling, and no imports from orchestrator, persistence, or renderer packages.
- [ ] **Step 3: Implement `analyze`** with `--requirements`, `--revision`, and optional `--api-url`; print the API response as JSON and return exit code 0 only for 2xx.
- [ ] **Step 4: Implement `package`** with `<analysisId>`, required `--output`, and API package generation; print generated directory/files.
- [ ] **Step 5: Implement `review`** with `<decisionId>`, `--action`, `--reviewer`, and optional `--comment`; support `review`, `approve`, `reject`, and `request-changes`.
- [ ] **Step 6: Update the root/CLI scripts** so `pnpm --filter @architecture-ai/cli build` produces a runnable CLI and document the API dependency in `README.md`.
- [ ] **Step 7: Run CLI tests, build, and a live API smoke test; commit** with `git add apps/cli README.md && git commit -m "feat: connect CLI to Architecture AI API"`.

## Task 5: Make the React web client executable with Vite

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/tsconfig.json`
- Create: `apps/web/index.html`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/src/main.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/api/client.ts`
- Modify: `apps/web/src/pages/SubmitRequirements.tsx`
- Modify: `apps/web/src/pages/PackageOverview.tsx`
- Modify: `apps/web/src/pages/Traceability.tsx`
- Modify: `apps/web/src/pages/DecisionReview.tsx`
- Create: `apps/web/src/pages/AuditHistory.tsx`
- Test: `apps/web/src/DecisionReview.test.tsx`
- Test: `apps/web/src/api/client.test.ts`

**Interfaces:**
- `createApiClient(baseUrl): ApiClient` uses the API routes from Task 3.
- `App` owns analysis/package/decision loading state and displays explicit API errors.
- Vite dev server defaults to port 5173 and proxies `/api` to `http://127.0.0.1:3000` or uses `VITE_API_URL`.

- [ ] **Step 1: Add Vite and React plugin dependencies/scripts**: `dev`, `build`, and `preview`; keep the existing TypeScript build script available.
- [ ] **Step 2: Add `index.html`, `main.tsx`, and Vite configuration** with a React root and `VITE_API_URL` support.
- [ ] **Step 3: Write failing client/UI tests** for request creation, package generation, traceability rendering, decision actions, audit display, and visible API error states.
- [ ] **Step 4: Implement API client methods** for all package and review endpoints; ensure the web client never calls orchestrator or persistence modules directly.
- [ ] **Step 5: Implement the screen flow**: submit requirements, show package summary, generate package, show traceability, render decisions, and show audit history.
- [ ] **Step 6: Add explicit loading, empty, invalid-revision, insufficient-evidence, and failed-generation states.** Do not hide unresolved evidence.
- [ ] **Step 7: Run web tests, `pnpm --filter @architecture-ai/web build`, and a Vite preview smoke test; commit** with `git add apps/web package.json pnpm-lock.yaml && git commit -m "feat: make Architecture AI web client executable"`.

## Task 6: Add restart-safe end-to-end verification and documentation

**Files:**
- Modify: `tests/e2e/architecture-package.test.ts`
- Modify: `tests/e2e/governance.test.ts`
- Create: `tests/e2e/restart-persistence.test.ts`
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `.gitignore`

**Interfaces:**
- E2E tests use the same composition as `scripts/start-api.mjs` with a temporary SQLite path.
- Documentation commands must work from the repository root on PowerShell.

- [ ] **Step 1: Write the restart test**: create analysis, close app/database, create a new app over the same SQLite path, retrieve `ANALYSIS-1`, generate its package, and inspect decisions.
- [ ] **Step 2: Add the full CLI-to-API-to-package test** using a local Fastify instance and fake HTTP client; assert generated files and non-zero behavior for invalid transitions.
- [ ] **Step 3: Run all tests with `node_modules\\.bin\\vitest.cmd run --run --exclude ".worktrees/**"`** and run `pnpm typecheck`.
- [ ] **Step 4: Update README** with API, CLI, web startup order, database location, `ARCHITECTURE_AI_API_URL`, `VITE_API_URL`, `ARCHITECTURE_AI_DB_PATH`, package output, and stop commands.
- [ ] **Step 5: Ensure `.architecture-ai/`, generated package directories, and local environment files are ignored while corpus and ontology remain tracked.
- [ ] **Step 6: Commit** with `git add tests README.md .env.example .gitignore && git commit -m "test: verify restart-safe Architecture AI workflow"`.

## Verification checklist

- [ ] `pnpm install` succeeds.
- [ ] `pnpm typecheck` succeeds.
- [ ] Full Vitest suite passes with `.worktrees/**` excluded.
- [ ] API restart preserves analysis and decisions.
- [ ] `analyze` calls the API and returns an analysis ID.
- [ ] `package ANALYSIS-1` generates all required artifacts.
- [ ] `review` enforces lifecycle and records audit events.
- [ ] Web starts through Vite and uses the same API contracts.
- [ ] Invalid Git revisions, incomplete evidence, missing IDs, and invalid transitions return stable errors.
- [ ] The local workflow requires no external model credentials.
- [ ] README instructions match the executable commands.
