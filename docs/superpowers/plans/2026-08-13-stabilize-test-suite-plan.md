# Stabilize Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the three failing test suites (CLI command assertions, KCR mock transitions, and SQLite file locks under Windows) to restore test suite stability.

**Architecture:** Update mock status initialized in KCR tests, expand CLI expected commands list, and isolate SQLite database paths per test case to prevent concurrent execution file locks.

**Tech Stack:** Vitest, TypeScript, SQLite (`node:sqlite`).

## Global Constraints
- Every behavior change follows TDD: run tests, implement fix, verify green.
- Run tests with `--exclude '.worktrees/**'` to prevent lock conflicts with worktrees.
- Use explicit sequential options `--pool=forks --maxWorkers=1 --minWorkers=1` for verification.

---

### Task 1: Update CLI Command Assertions

**Files:**
- Modify: `apps/cli/src/commands.test.ts`

- [ ] **Step 1: Run commands test and verify the failure**
  Run: `& .\node_modules\.bin\vitest.cmd run apps/cli/src/commands.test.ts`
  Expected: FAIL (assertion mismatch due to new `knowledge-*` commands)

- [ ] **Step 2: Update assertions in commands.test.ts**
  Replace line 4 of `apps/cli/src/commands.test.ts`:
  ```typescript
  describe("CLI", () => { it("declares shared analysis, regeneration, package, review, audit, and publish commands", () => { const names = createCli().commands.map((command) => command.name()); expect(names).toEqual(["analyze", "regenerate", "package", "review", "audit", "publish", "knowledge-create", "knowledge-list", "knowledge-get", "knowledge-review", "knowledge-approve", "knowledge-publish"]); }); });
  ```

- [ ] **Step 3: Verify the test passes**
  Run: `& .\node_modules\.bin\vitest.cmd run apps/cli/src/commands.test.ts`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run:
  ```powershell
  git add apps/cli/src/commands.test.ts
  git commit -m "test: update CLI command list assertions to include knowledge commands"
  ```

---

### Task 2: Fix KCR Lifecycle Transition Test

**Files:**
- Modify: `packages/application/src/knowledge-change-request-service.test.ts`

- [ ] **Step 1: Run KCR service tests and verify the failure**
  Run: `& .\node_modules\.bin\vitest.cmd run packages/application/src/knowledge-change-request-service.test.ts`
  Expected: FAIL on `publishes an approved request successfully` (ApplicationError: Cannot transition to REVIEWED from APPROVED)

- [ ] **Step 2: Update mock status in test**
  Modify line 75 of `packages/application/src/knowledge-change-request-service.test.ts` to set `status` to `"DRAFT"` instead of `"APPROVED"`:
  ```typescript
      const request = {
        id: "KCR-1",
        status: "DRAFT",
        author: "dev",
        baseRevision: "HEAD",
  ```

- [ ] **Step 3: Verify tests pass**
  Run: `& .\node_modules\.bin\vitest.cmd run packages/application/src/knowledge-change-request-service.test.ts`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run:
  ```powershell
  git add packages/application/src/knowledge-change-request-service.test.ts
  git commit -m "test: fix KCR publication test lifecycle transition"
  ```

---

### Task 3: Isolate SQLite Test Databases

**Files:**
- Modify: `packages/application/src/package-service.test.ts`
- Modify: `packages/application/src/analysis-service.test.ts`

- [ ] **Step 1: Run PackageService tests and verify UNIQUE constraint failed**
  Run: `& .\node_modules\.bin\vitest.cmd run packages/application/src/package-service.test.ts`
  Expected: FAIL on `reads a stored result without invoking the renderer` (UNIQUE constraint failed: analyses.id)

- [ ] **Step 2: Update package-service.test.ts to use unique database paths per test case**
  Rewrite `packages/application/src/package-service.test.ts` contents:
  ```typescript
  import { afterEach, describe, expect, it } from "vitest";
  import { rmSync } from "node:fs";
  import { join } from "node:path";
  import { randomUUID } from "node:crypto";
  import type { AnalysisResult, ArchitecturePackage, PackageRenderer } from "@architecture-ai/domain";
  import { AnalysisRepository, DatabaseStore } from "@architecture-ai/persistence";
  import { PackageService } from "./package-service.js";

  const getTempDbPath = () => `.architecture-ai/package-service-test-${randomUUID()}.sqlite`;
  const result: AnalysisResult = { context: { revision: "abc", requirements: [], drivers: [], evidence: [], recommendations: [], decisions: [], artifacts: [], links: [], status: { value: "DRAFT", requiredDecisionIds: [], approvedDecisionIds: [] } }, findings: [], risks: [], artifacts: [], packageStatus: { value: "DRAFT", requiredDecisionIds: [], approvedDecisionIds: [] } };
  let renderCalls = 0;
  const renderer: PackageRenderer = { renderPackage: async (_value, outputDirectory): Promise<ArchitecturePackage> => { renderCalls += 1; return { directory: outputDirectory, files: ["01-architecture-analysis.md", "architecture-context.json", "09-adr/ADR-1.md", "diagrams/context.mmd"], context: result.context }; } };

  describe("PackageService", () => {
    it("reads a stored result without invoking the renderer", async () => {
      const dbPath = getTempDbPath();
      const store = DatabaseStore.open(dbPath);
      try {
        const analyses = new AnalysisRepository(store);
        await analyses.create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" });
        await analyses.updateResult("ANALYSIS-1", result);
        renderCalls = 0;
        await expect(new PackageService(analyses, renderer).get("ANALYSIS-1")).resolves.toEqual(result);
        expect(renderCalls).toBe(0);
      } finally {
        store.close();
        rmSync(dbPath, { force: true });
      }
    });

    it("rejects an unknown analysis when reading", async () => {
      const dbPath = getTempDbPath();
      const store = DatabaseStore.open(dbPath);
      try {
        await expect(new PackageService(new AnalysisRepository(store), renderer).get("UNKNOWN")).rejects.toMatchObject({ code: "NOT_FOUND" });
      } finally {
        store.close();
        rmSync(dbPath, { force: true });
      }
    });

    it("rejects a stored analysis without a result when reading", async () => {
      const dbPath = getTempDbPath();
      const store = DatabaseStore.open(dbPath);
      try {
        const analyses = new AnalysisRepository(store);
        await analyses.create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" });
        await expect(new PackageService(analyses, renderer).get("ANALYSIS-1")).rejects.toMatchObject({ code: "PACKAGE_NOT_READY" });
      } finally {
        store.close();
        rmSync(dbPath, { force: true });
      }
    });

    it("generates from a stored result without rerunning orchestration", async () => {
      const dbPath = getTempDbPath();
      const store = DatabaseStore.open(dbPath);
      try {
        const analyses = new AnalysisRepository(store);
        await analyses.create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" });
        await analyses.updateResult("ANALYSIS-1", result);
        const generated = await new PackageService(analyses, renderer).generate("ANALYSIS-1", ".architecture-ai/packages");
        expect(generated.directory).toBe(join(".architecture-ai/packages", "ANALYSIS-1"));
        expect(generated.files).toContain("architecture-context.json");
        expect(generated.files).toContain("diagrams/context.mmd");
      } finally {
        store.close();
        rmSync(dbPath, { force: true });
      }
    });

    it("rejects an analysis without a stored result", async () => {
      const dbPath = getTempDbPath();
      const store = DatabaseStore.open(dbPath);
      try {
        const analyses = new AnalysisRepository(store);
        await analyses.create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" });
        await expect(new PackageService(analyses, renderer).generate("ANALYSIS-1")).rejects.toMatchObject({ code: "PACKAGE_GENERATION_FAILED" });
      } finally {
        store.close();
        rmSync(dbPath, { force: true });
      }
    });
  });
  ```

- [ ] **Step 3: Update analysis-service.test.ts to use unique database paths per test case**
  Rewrite `packages/application/src/analysis-service.test.ts` contents:
  ```typescript
  import { describe, expect, it } from "vitest";
  import { rmSync } from "node:fs";
  import { randomUUID } from "node:crypto";
  import type { ArchitectureModel, EvidenceRetriever, RetrievedEvidence } from "@architecture-ai/domain";
  import { ArchitectureOrchestrator } from "@architecture-ai/orchestrator";
  import { AnalysisRepository, DatabaseStore, ReviewRepository } from "@architecture-ai/persistence";
  import { AnalysisService } from "./analysis-service.js";

  const getTempDbPath = () => `.architecture-ai/application-test-${randomUUID()}.sqlite`;
  const evidence: RetrievedEvidence[] = [{ id: "E-1", knowledgeId: "KI-1", revision: "abc", excerpt: "API standard", classification: "STANDARD", confidence: 1, method: "fixture", score: 1 }];
  const service = (dbPath: string, onComplete = () => {}) => {
    const store = DatabaseStore.open(dbPath);
    const orchestrator = new ArchitectureOrchestrator({ retrieve: async () => evidence } satisfies EvidenceRetriever, { complete: async () => { onComplete(); return { output: "fixture" }; } } satisfies ArchitectureModel);
    return { service: new AnalysisService(orchestrator, new AnalysisRepository(store), new ReviewRepository(store)), store };
  };

  describe("AnalysisService", () => {
    it("persists the orchestration result and decisions", async () => {
      const dbPath = getTempDbPath();
      const first = service(dbPath);
      let created: Awaited<ReturnType<typeof first.service.create>>;
      try {
        created = await first.service.create({ requirements: "Customers submit orders", knowledgeRevision: "abc" });
      } finally {
        first.store.close();
      }
      const second = service(dbPath);
      try {
        const loaded = await second.service.get(created!.id);
        expect(loaded.result?.context.revision).toBe("abc");
        expect(loaded.result?.context.decisions.length).toBeGreaterThan(0);
        expect(loaded.status).toBe("INCOMPLETE");
      } finally {
        second.store.close();
        rmSync(dbPath, { force: true });
      }
    });

    it("returns a typed not-found error", async () => {
      const dbPath = getTempDbPath();
      const current = service(dbPath);
      try {
        await expect(current.service.get("ANALYSIS-404")).rejects.toMatchObject({ code: "NOT_FOUND" });
      } finally {
        current.store.close();
        rmSync(dbPath, { force: true });
      }
    });

    it("preserves a structured knowledge validation error", async () => {
      const dbPath = getTempDbPath();
      const store = DatabaseStore.open(dbPath);
      const failing = { run: async () => { throw Object.assign(new Error("Knowledge metadata is invalid"), { code: "INVALID_OKF_METADATA" }); } } as unknown as ArchitectureOrchestrator;
      try {
        await expect(new AnalysisService(failing, new AnalysisRepository(store), new ReviewRepository(store)).create({ requirements: "Login", knowledgeRevision: "abc" })).rejects.toMatchObject({ code: "INVALID_OKF_METADATA", message: "Knowledge metadata is invalid" });
      } finally {
        store.close();
        rmSync(dbPath, { force: true });
      }
    });

    it("lists persisted summaries without calling the orchestrator", async () => {
      const dbPath = getTempDbPath();
      let completions = 0;
      const current = service(dbPath, () => { completions += 1; });
      try {
        await new AnalysisRepository(current.store).create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" });
        expect(await current.service.list()).toEqual([expect.objectContaining({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc", hasResult: false })]);
        expect(completions).toBe(0);
      } finally {
        current.store.close();
        rmSync(dbPath, { force: true });
      }
    });
  });
  ```

- [ ] **Step 4: Verify test suites pass**
  Run: `& .\node_modules\.bin\vitest.cmd run --exclude '.worktrees/**' --pool=forks --maxWorkers=1 --minWorkers=1`
  Expected: All 94 tests PASS

- [ ] **Step 5: Commit**
  Run:
  ```powershell
  git add packages/application/src/package-service.test.ts packages/application/src/analysis-service.test.ts
  git commit -m "test: isolate SQLite database files in application tests to avoid file locking on Windows"
  ```
