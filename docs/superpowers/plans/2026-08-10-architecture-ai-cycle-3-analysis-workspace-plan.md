# Architecture AI Cycle 3 Analysis Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let architects reopen persisted analyses in the Web and inspect their package, governance, and traceability while keeping package reads side-effect free and package generation explicit.

**Architecture:** Extend the existing persisted `AnalysisRepository` and `AnalysisService` with summary listing. Refactor the API so `GET /packages/:id` only returns the stored result and `POST /packages/:id/generate` remains the sole artifact-writing operation. Add a Web history/detail flow using the same API contracts; do not add a package table or new source of truth.

**Tech Stack:** TypeScript 5.9, Node.js 22, SQLite `DatabaseSync`, Fastify 5, Zod, React 19, Vite 6, Vitest 2, pnpm workspace.

## Global Constraints

- Architecture Wiki + OKF remain the corporate knowledge System of Record.
- SQLite stores operational analysis state; it is not a replacement for corporate knowledge.
- `GET /packages/:id` must never write package files or rerun orchestration.
- `POST /packages/:id/generate` is the only package-generation route.
- Human governance remains `DRAFT -> REVIEWED -> APPROVED`.
- Corporate evidence remains authoritative; this cycle does not change retrieval or model policy.
- Do not implement multi-agent orchestration, production Knowledge Graph, Vector Store, authentication, ZIP downloads, or a Markdown viewer.
- Run typecheck before Vitest because workspace package exports resolve through `dist`.
- Exclude `.worktrees/**` from repository-wide Vitest discovery.

---

### Task 1: Add persisted analysis summaries

**Files:**
- Modify: `packages/persistence/src/analysis-repository.ts`
- Modify: `packages/domain/src/types.ts`
- Modify: `packages/application/src/analysis-service.ts`
- Modify: `packages/application/src/index.ts`
- Test: `packages/persistence/src/persistence.test.ts`
- Test: `packages/application/src/analysis-service.test.ts`

**Interfaces:**
- Add `AnalysisSummary { id, requirements, knowledgeRevision, status, createdAt, updatedAt, hasResult }` to the domain types.
- Add `AnalysisRepository.list(): Promise<AnalysisSummary[]>`.
- Add `AnalysisService.list(): Promise<AnalysisSummary[]>`.

- [ ] **Step 1: Write failing persistence tests**

Add a test that creates two analyses with controlled timestamps through the repository's normal create path, updates one result, calls `list()`, and asserts:

```ts
const summaries = await analyses.list();
expect(summaries.map((item) => item.id)).toEqual(["ANALYSIS-2", "ANALYSIS-1"]);
expect(summaries.find((item) => item.id === "ANALYSIS-1")?.hasResult).toBe(true);
expect(summaries.find((item) => item.id === "ANALYSIS-2")?.hasResult).toBe(false);
```

Use the existing SQLite test database pattern and close the store in `finally` so Windows can remove the file.

- [ ] **Step 2: Run the focused persistence test and verify it fails**

Run:

```powershell
$bin="C:\Users\ianache\Desktop\DATA\01-DOCUMENTOS\03-PERSONAL\00-Arquitectura-Empresarial-with-AgentesAI\node_modules\.bin"
& "$bin\vitest.cmd" run packages/persistence/src/persistence.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Expected: FAIL because `AnalysisRepository.list` is not defined.

- [ ] **Step 3: Implement the summary query**

Query the `analyses` table with `ORDER BY updated_at DESC`, project only summary fields, and set `hasResult` from `result_json IS NOT NULL`. Keep the full `AnalysisRecord` mapping private to the repository. Add the domain interface and a delegating `AnalysisService.list()` method.

- [ ] **Step 4: Add application list coverage and run focused verification**

Add an `AnalysisService.list()` test that verifies it returns summaries and does not call the orchestrator. Run:

```powershell
& "$bin\tsc.cmd" -b
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& "$bin\vitest.cmd" run packages/persistence/src/persistence.test.ts packages/application/src/analysis-service.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Expected: typecheck passes and all focused tests pass.

- [ ] **Step 5: Commit**

```powershell
git add packages/domain packages/persistence packages/application
git commit -m "feat: list persisted analysis summaries"
```

### Task 2: Separate API package reads from generation

**Files:**
- Modify: `packages/application/src/errors.ts`
- Modify: `packages/application/src/package-service.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/routes.test.ts`
- Test: `packages/application/src/package-service.test.ts`

**Interfaces:**
- Add `PACKAGE_NOT_READY` to `ApplicationErrorCode`.
- Add `PackageService.get(id): Promise<AnalysisResult>` for read-only result access.
- Keep `PackageService.generate(id, outputDirectory?)` unchanged as the artifact-writing operation.

- [ ] **Step 1: Write failing package-service tests**

Add tests asserting that `get("ANALYSIS-1")` returns the stored result and that a record without `result` rejects with `ApplicationError` code `PACKAGE_NOT_READY`. Use a renderer spy and assert the renderer was not called by `get()`.

- [ ] **Step 2: Run the focused package-service test and verify it fails**

```powershell
& "$bin\vitest.cmd" run packages/application/src/package-service.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Expected: FAIL because `get()` and `PACKAGE_NOT_READY` do not exist.

- [ ] **Step 3: Implement read-only package access and API mapping**

Implement `PackageService.get()` as:

```ts
const record = await analyses.get(id);
if (!record) throw new ApplicationError("NOT_FOUND", `Analysis not found: ${id}`);
if (!record.result) throw new ApplicationError("PACKAGE_NOT_READY", `Analysis has no result: ${id}`);
return record.result;
```

Change `GET /packages/:id` to call `packageService.get()`. Map `PACKAGE_NOT_READY` to HTTP 409. Leave `POST /packages/:id/generate` calling `generate()` and preserve its 201 response.

- [ ] **Step 4: Add API side-effect and error tests**

Extend route tests to:

- create an analysis, call `GET /packages/:id`, and assert the response is 200;
- use a renderer spy or a test package service and assert GET does not generate;
- assert unknown package returns 404 `NOT_FOUND`;
- assert a known analysis with no result returns 409 `PACKAGE_NOT_READY`;
- assert POST generation still returns 201 and generated files.

Run:

```powershell
& "$bin\tsc.cmd" -b
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& "$bin\vitest.cmd" run packages/application/src/package-service.test.ts apps/api/src/routes.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

- [ ] **Step 5: Commit**

```powershell
git add packages/application apps/api
git commit -m "fix: make package reads side-effect free"
```

### Task 3: Add analysis history API

**Files:**
- Modify: `apps/api/src/app.ts`
- Modify: `apps/api/src/routes.test.ts`
- Modify: `README.md`

**Interfaces:**
- Add `GET /analyses` returning `{ analyses: AnalysisSummary[] }`.
- Preserve existing `POST /analyses`, `GET /analyses/:id`, package, governance, CORS, and `HEAD` revision behavior.

- [ ] **Step 1: Write the failing route test**

Create two analyses with the existing test orchestrator, call `GET /analyses`, and assert the response status, summary fields, descending order, and `hasResult` values.

- [ ] **Step 2: Run the route test and verify it fails**

```powershell
& "$bin\vitest.cmd" run apps/api/src/routes.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

Expected: FAIL with 404 because the route does not exist.

- [ ] **Step 3: Implement the route through `AnalysisService.list()`**

Add a Fastify GET route that returns `{ analyses: await analysisService.list() }`. Do not query SQLite directly from the route and do not include full `AnalysisResult` payloads.

- [ ] **Step 4: Update API documentation and verify**

Document `GET /analyses` and the distinction between `GET /packages/:id` and `POST /packages/:id/generate` in `README.md`. Run typecheck and the API route suite.

- [ ] **Step 5: Commit**

```powershell
git add apps/api README.md
git commit -m "feat: expose persisted analysis history"
```

### Task 4: Implement Web history and detail navigation

**Files:**
- Modify: `apps/web/src/api/client.ts`
- Modify: `apps/web/src/App.tsx`
- Create: `apps/web/src/pages/AnalysisHistory.tsx`
- Create: `apps/web/src/pages/AnalysisDetail.tsx`
- Modify: `apps/web/src/DecisionReview.test.tsx`
- Create: `apps/web/src/AnalysisHistory.test.tsx`
- Modify: `apps/web/src/styles.css`

**Interfaces:**
- Add `ApiClient.listAnalyses(): Promise<{ analyses: AnalysisSummary[] }>`.
- Add `ApiClient.getPackage(id)` as a read-only GET call.
- Keep `generatePackage(id, outputDirectory?)` as an explicit POST call.
- `AnalysisHistory` receives summaries and an `onSelect(id)` callback.
- `AnalysisDetail` receives `analysisId`, API-loaded result, decisions, links, audit, and callbacks for generation/review/back.

- [ ] **Step 1: Write failing Web tests**

Add tests that render `AnalysisHistory` with two summaries and assert both ids/statuses appear, and that selecting a row calls `onSelect`. Add a client mock test that verifies package loading uses `GET /packages/:id` while generation uses `POST /packages/:id/generate`.

- [ ] **Step 2: Run the focused Web tests and verify the new test fails**

```powershell
& "$bin\vitest.cmd" run apps/web/src/AnalysisHistory.test.tsx apps/web/src/DecisionReview.test.tsx --pool=forks --maxWorkers=1 --minWorkers=1
```

Expected: FAIL because the history component and client method do not exist.

- [ ] **Step 3: Implement the Web history screen**

Create a small table/list with id, status, revision, updated date, and a select button. Add a new-analysis action that returns to `SubmitRequirements`. Keep loading and error states explicit.

- [ ] **Step 4: Implement the detail screen and route state**

Refactor `App` to load history initially, set the selected id on row selection, and load detail data with read-only `getPackage()`, decisions, traceability, and audit. Provide a Back button. Add an explicit Generate Package button that calls `generatePackage()` and then reloads the read-only detail.

- [ ] **Step 5: Verify Web behavior and build**

```powershell
& "$bin\tsc.cmd" -b
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& "$bin\vitest.cmd" run apps/web/src/AnalysisHistory.test.tsx apps/web/src/DecisionReview.test.tsx --pool=forks --maxWorkers=1 --minWorkers=1
Push-Location apps/web
& "$bin\vite.cmd" build
$code=$LASTEXITCODE
Pop-Location
exit $code
```

- [ ] **Step 6: Commit**

```powershell
git add apps/web
git commit -m "feat: add Web analysis history workspace"
```

### Task 5: End-to-end restart verification and final documentation

**Files:**
- Modify: `tests/e2e/architecture-package.test.ts`
- Modify: `apps/api/src/routes.test.ts`
- Modify: `README.md`
- Modify: `.gitignore` only if new generated test output needs exclusion

**Interfaces:**
- The acceptance flow uses the public API contracts only; it must not reach into SQLite internals from the E2E test.

- [ ] **Step 1: Add the restart/reopen E2E test**

Create an analysis through the API, generate its package, close the app, reopen the app against the same SQLite test database, call `GET /analyses`, select the analysis, call `GET /packages/:id`, and assert the same revision, decisions, and traceability are returned. Record the package file modification time before the GET and assert it is unchanged afterward.

- [ ] **Step 2: Run the E2E test and verify it passes**

```powershell
& "$bin\tsc.cmd" -b
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& "$bin\vitest.cmd" run tests/e2e/architecture-package.test.ts --pool=forks --maxWorkers=1 --minWorkers=1
```

- [ ] **Step 3: Update README manual validation**

Document the history flow, explicit generation command, read-only package query, restart verification, and `PACKAGE_NOT_READY` response.

- [ ] **Step 4: Run the complete verification suite**

```powershell
& "$bin\tsc.cmd" -b
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& "$bin\vitest.cmd" run --exclude '.worktrees/**' --pool=forks --maxWorkers=1 --minWorkers=1
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Push-Location apps/web
& "$bin\vite.cmd" build
$code=$LASTEXITCODE
Pop-Location
exit $code
```

Expected: all repository tests pass, no `.worktrees/**` suite is discovered, and the Web production build succeeds.

- [ ] **Step 5: Commit final documentation and verification changes**

```powershell
git add tests/e2e apps/api README.md .gitignore
git commit -m "test: verify analysis workspace restart flow"
```
