# Architecture AI Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn persisted Architecture AI analyses into physical, versionable Architecture Packages with complete human governance and audit history through the shared API, CLI, and Web clients.

**Architecture:** Add a focused `packages/application` layer between the existing domain/persistence/orchestrator packages and the HTTP adapters. `AnalysisService`, `PackageService`, and `GovernanceService` own workflow rules; Fastify, Commander, and React only call those capabilities through API contracts. Package generation reads persisted results and uses the existing renderer without invoking the model again.

**Tech Stack:** Node.js 22+, pnpm, TypeScript, Fastify, React 19, Vite, Commander, Zod, Vitest, Node 22 `node:sqlite` `DatabaseSync`, existing Markdown/JSON/Mermaid renderers, and local filesystem output under `.architecture-ai/`.

## Global Constraints

- SQLite is an implementation detail for operational workflow state, not the corporate knowledge source.
- Git Markdown/OKF and the ontology remain the System of Record for architecture knowledge.
- CLI and web call the same API/application capabilities and contain no duplicated workflow logic.
- Significant decisions require the lifecycle `DRAFT -> REVIEWED -> APPROVED`.
- Direct approval from `DRAFT` is rejected with `INVALID_REVIEW_TRANSITION`.
- Missing or insufficient evidence remains explicit and cannot become approved corporate knowledge.
- The deterministic model remains the default and requires no external credentials.
- Package generation must not invoke the model again; it reads the persisted `AnalysisResult`.
- Package output defaults below `.architecture-ai/`; the Knowledge Base and ontology are never modified automatically.
- The phase excludes authentication, cloud deployment, real-time collaboration, free-form chat, multi-agent orchestration, and diagram editing.
- Stable errors are `NOT_FOUND`, `PACKAGE_GENERATION_FAILED`, `INVALID_REVIEW_TRANSITION`, `INSUFFICIENT_EVIDENCE`, and `PERSISTENCE_ERROR`.

## File and module map

```text
packages/domain/src/types.ts              shared package/service result types
packages/application/src/                 analysis, package, governance workflows
packages/persistence/src/                 SQLite repositories already present
packages/artifacts/src/                   existing package renderer
apps/api/src/                              composition and HTTP route adapters
apps/cli/src/                              HTTP client and commands
apps/web/src/                              package generation and audit screens
tests/e2e/                                restart, generation, governance, client flow
README.md                                 executable workflow documentation
```

---

### Task 1: Define application contracts and persisted analysis service

**Files:**
- Modify: `packages/domain/src/types.ts`
- Modify: `packages/domain/src/ports.ts`
- Create: `packages/application/package.json`
- Create: `packages/application/tsconfig.json`
- Create: `packages/application/src/errors.ts`
- Create: `packages/application/src/analysis-service.ts`
- Create: `packages/application/src/index.ts`
- Test: `packages/application/src/analysis-service.test.ts`
- Modify: `tsconfig.json`
- Modify: `pnpm-workspace.yaml` only if the workspace glob does not already include `packages/*`

**Interfaces:**
- `AnalysisService.create(input: AnalysisRequest): Promise<AnalysisRecord>`
- `AnalysisService.get(id: string): Promise<AnalysisRecord>`
- `AnalysisRecord` contains `id`, `requirements`, `knowledgeRevision`, `status`, `result?`, `createdAt`, and `updatedAt`.
- `ApplicationError` contains `code`, `message`, and optional `cause`.
- The service consumes `ArchitectureOrchestrator`, `AnalysisRepository`, and `ReviewRepository`.

- [ ] **Step 1: Write failing tests for creation and retrieval.** Use a temporary SQLite path, a fake retriever/model orchestrator, and assert that `create` persists the result plus every decision and that a second service instance can retrieve it.
- [ ] **Step 2: Run the focused test and verify the missing package/service failure.**

```powershell
node_modules\.bin\vitest.cmd run packages/application/src/analysis-service.test.ts
```

- [ ] **Step 3: Add the application package and typed errors.** Export `NOT_FOUND`, `INVALID_REVISION`, `INSUFFICIENT_EVIDENCE`, and `PERSISTENCE_ERROR` through `ApplicationError` without changing existing domain entity names.
- [ ] **Step 4: Implement `AnalysisService.create`.** Call `AnalysisRepository.nextId`, create the draft record, run the orchestrator with the requested revision, persist the result through `updateResult`, save each decision through `ReviewRepository.saveDecision`, and translate repository/orchestrator failures to stable errors.
- [ ] **Step 5: Implement `AnalysisService.get`.** Return the persisted record or throw `ApplicationError("NOT_FOUND", ...)`.
- [ ] **Step 6: Run the focused tests and typecheck.**

```powershell
node_modules\.bin\vitest.cmd run packages/application/src/analysis-service.test.ts
node_modules\.bin\tsc.cmd -b
```

- [ ] **Step 7: Commit.**

```powershell
git add packages/application packages/domain tsconfig.json
git commit -m "feat: add persisted analysis application service"
```

### Task 2: Implement physical package generation

**Files:**
- Modify: `packages/domain/src/types.ts`
- Create: `packages/application/src/package-service.ts`
- Modify: `packages/application/src/index.ts`
- Test: `packages/application/src/package-service.test.ts`
- Inspect and reuse: `packages/artifacts/src/package-renderer.ts`

**Interfaces:**
- `PackageService.generate(id: string, outputDirectory?: string): Promise<PackageGenerationResult>`
- `PackageGenerationResult` contains `analysisId`, `directory`, `files`, and `context`.
- Default output directory is `.architecture-ai/packages`.
- The service consumes `AnalysisService` or `AnalysisRepository` and `PackageRenderer`.

- [ ] **Step 1: Write a failing test that stores a result, calls `generate`, and asserts the required relative files.** Assert the list includes the eight numbered Markdown files, at least one ADR, `architecture-context.json`, and at least one Mermaid diagram.
- [ ] **Step 2: Run the focused package-service test and confirm it fails because the service does not exist.**
- [ ] **Step 3: Implement `PackageService.generate`.** Load the stored result, reject missing records with `NOT_FOUND`, call `FilePackageRenderer.renderPackage`, normalize returned paths relative to the output directory, and map renderer/filesystem errors to `PACKAGE_GENERATION_FAILED`.
- [ ] **Step 4: Ensure repeat generation uses the stored result.** The test must use a model spy and assert the model call count does not increase during the second package generation.
- [ ] **Step 5: Run package-service tests, existing renderer tests, and typecheck.**

```powershell
node_modules\.bin\vitest.cmd run packages/application/src/package-service.test.ts packages/artifacts/src/package-renderer.test.ts
node_modules\.bin\tsc.cmd -b
```

- [ ] **Step 6: Commit.**

```powershell
git add packages/application packages/domain
git commit -m "feat: generate persisted architecture packages"
```

### Task 3: Complete governance service and audit retrieval

**Files:**
- Create: `packages/application/src/governance-service.ts`
- Modify: `packages/application/src/index.ts`
- Modify: `packages/persistence/src/review-repository.ts` only for missing audit/query methods
- Test: `packages/application/src/governance-service.test.ts`

**Interfaces:**
- `GovernanceService.review(decisionId: string, reviewer: string, comment?: string): Promise<ArchitectureDecision>`
- `GovernanceService.approve(decisionId: string, reviewer: string, comment?: string): Promise<ArchitectureDecision>`
- `GovernanceService.reject(decisionId: string, reviewer: string, comment?: string): Promise<ArchitectureDecision>`
- `GovernanceService.requestChanges(decisionId: string, reviewer: string, comment?: string): Promise<ArchitectureDecision>`
- `GovernanceService.audit(decisionId: string): Promise<Review[]>`

- [ ] **Step 1: Write failing tests for the complete lifecycle.** Assert direct approval of `DRAFT` throws `INVALID_REVIEW_TRANSITION`, review changes it to `REVIEWED`, approval changes it to `APPROVED`, and audit returns both actions in append order.
- [ ] **Step 2: Add tests for reject/request-changes and missing decisions.** Assert they persist the action and `NOT_FOUND` is returned for an unknown decision.
- [ ] **Step 3: Implement the service using `ReviewRepository` as the authoritative decision state.** Do not keep a second in-memory decision map; update the decision JSON and append one review/audit record per action.
- [ ] **Step 4: Implement `audit` and ensure the repository returns only the requested decision's append-only history.**
- [ ] **Step 5: Run governance tests and typecheck.**
- [ ] **Step 6: Commit.**

```powershell
git add packages/application packages/persistence
git commit -m "feat: add auditable governance application service"
```

### Task 4: Compose API routes over application services

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/tsconfig.json`
- Create: `apps/api/src/composition.ts`
- Create: `apps/api/src/routes/analyses.ts`
- Create: `apps/api/src/routes/packages.ts`
- Create: `apps/api/src/routes/reviews.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/server.ts`
- Modify: `scripts/start-api.mjs`
- Test: `apps/api/src/routes.test.ts`

**Interfaces:**
- `buildApp(services: ApplicationServices): FastifyInstance`
- `POST /analyses` returns `{ id, status, traceability }`.
- `GET /analyses/:id` returns persisted analysis.
- `POST /packages/:id/generate` accepts `{ outputDirectory? }` and returns `PackageGenerationResult`.
- `GET /packages/:id`, `/traceability`, and `/decisions` read persisted state.
- `GET /decisions/:id/audit` returns `Review[]`.
- Review routes call `GovernanceService`, not repositories directly.

- [ ] **Step 1: Write failing route tests for package generation, audit reads, restart persistence, and all stable errors.** Use two app instances over one temporary SQLite file to prove restart behavior.
- [ ] **Step 2: Refactor composition to create `DatabaseStore`, repositories, orchestrator, renderer, and application services in one place.** Preserve the existing CORS hook and `HEAD` revision resolution.
- [ ] **Step 3: Add route modules with Zod schemas.** Map `NOT_FOUND` to 404, invalid requests/transitions to 400, insufficient evidence to 409, and generation/persistence failures to 500.
- [ ] **Step 4: Update `scripts/start-api.mjs` to pass the pinned Git revision and local database path into composition.**
- [ ] **Step 5: Run API tests, typecheck, and an HTTP smoke test against a local Fastify listener.**
- [ ] **Step 6: Commit.**

```powershell
git add apps/api scripts/start-api.mjs
git commit -m "feat: expose package generation and audit API"
```

### Task 5: Connect the CLI to package generation and audit

**Files:**
- Create: `apps/cli/src/api-client.ts`
- Create: `apps/cli/src/commands/errors.ts`
- Modify: `apps/cli/src/main.ts`
- Modify: `apps/cli/package.json`
- Modify: `README.md`
- Test: `apps/cli/src/commands.test.ts`

**Interfaces:**
- `ApiClient.createAnalysis(input): Promise<AnalysisCreateResponse>`
- `ApiClient.generatePackage(id, outputDirectory): Promise<PackageGenerationResult>`
- `ApiClient.reviewDecision(id, action, reviewer, comment?): Promise<ArchitectureDecision>`
- `ApiClient.getAudit(decisionId): Promise<Review[]>`
- API base URL is `ARCHITECTURE_AI_API_URL` or `http://127.0.0.1:3000`.

- [ ] **Step 1: Write failing fetch-mocked tests for analyze, package generation, review, audit, API errors, and non-zero command failures.**
- [ ] **Step 2: Implement the shared HTTP client with JSON parsing, stable error extraction, and a 30-second request timeout.**
- [ ] **Step 3: Change `package` to require `--output`, call `POST /packages/:id/generate`, and print the generated directory/files as JSON.**
- [ ] **Step 4: Add `audit <decisionId>` and keep `review` actions mapped to the same API endpoints used by Web.**
- [ ] **Step 5: Build the CLI and run mocked plus live smoke tests.**
- [ ] **Step 6: Commit.**

```powershell
git add apps/cli README.md
git commit -m "feat: connect CLI to package generation and audit"
```

### Task 6: Complete Web package and audit screens

**Files:**
- Modify: `apps/web/src/api/client.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/pages/PackageOverview.tsx`
- Modify: `apps/web/src/pages/DecisionReview.tsx`
- Create: `apps/web/src/pages/AuditHistory.tsx`
- Test: `apps/web/src/api/client.test.ts`
- Test: `apps/web/src/DecisionReview.test.tsx`

**Interfaces:**
- `ApiClient.generatePackage(id, outputDirectory): Promise<PackageGenerationResult>`
- `ApiClient.getAudit(decisionId): Promise<Review[]>`
- `App` owns loading, generation, review, audit, and explicit error state.

- [ ] **Step 1: Write failing client/UI tests for package generation, generated-file display, audit rendering, loading states, and visible error messages.**
- [ ] **Step 2: Add API client methods without importing persistence, renderer, or orchestrator packages.**
- [ ] **Step 3: Add the generate-package action and render returned relative files.**
- [ ] **Step 4: Add audit history per decision and preserve explicit evidence/review statuses.**
- [ ] **Step 5: Run Web tests, TypeScript build, Vite production build, and a preview smoke test.**
- [ ] **Step 6: Commit.**

```powershell
git add apps/web package.json pnpm-lock.yaml
git commit -m "feat: show generated packages and audit history in web"
```

### Task 7: Add restart-safe end-to-end verification and documentation

**Files:**
- Modify: `tests/e2e/architecture-package.test.ts`
- Modify: `tests/e2e/governance.test.ts`
- Create: `tests/e2e/restart-persistence.test.ts`
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Write the restart test.** Create an analysis, close the app/database, create a second app over the same temporary SQLite path, retrieve the analysis, generate its package, and inspect decisions/audit.
- [ ] **Step 2: Add API-to-CLI package generation coverage and invalid transition coverage.** Assert the generated directory contains the required files and direct approval fails.
- [ ] **Step 3: Document startup order, `ARCHITECTURE_AI_API_URL`, `VITE_API_URL`, `ARCHITECTURE_AI_DB`, package output location, audit commands, and stop commands.**
- [ ] **Step 4: Ensure `.architecture-ai/`, generated packages, local environment files, and worktree artifacts are ignored while `knowledge/` and `ontology/` remain tracked.**
- [ ] **Step 5: Run the complete verification command.**

```powershell
node_modules\.bin\vitest.cmd run --exclude ".worktrees/**"
node_modules\.bin\tsc.cmd -b
pnpm --filter @architecture-ai/web build
```

- [ ] **Step 6: Commit.**

```powershell
git add tests README.md .env.example .gitignore
git commit -m "test: verify restart-safe package governance workflow"
```

## Verification checklist

- [ ] A persisted analysis generates every required package file.
- [ ] Re-generating uses persisted output and does not invoke the model again.
- [ ] Restarting the API preserves analyses, decisions, and audit history.
- [ ] CLI and Web call the same generation and governance API endpoints.
- [ ] Direct approval of `DRAFT` is rejected.
- [ ] `REVIEWED -> APPROVED` records audit history.
- [ ] Invalid revision, missing ID, insufficient evidence, generation failure, and persistence failure have stable responses.
- [ ] Full tests, typecheck, and Web build pass with `.worktrees/**` excluded.
