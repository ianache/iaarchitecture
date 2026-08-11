# Architecture AI Next Cycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Connect human governance to a complete traceability chain and an isolated, versionable Git review workspace shared by API, CLI, and Web.

**Architecture:** Extend the canonical `AnalysisResult` with persisted recommendations and explicit trace links. Recalculate package status from persisted decisions after every governance action. Publish a reviewed package through a dedicated application service that writes and commits inside a separate Git worktree, then expose that operation through the existing shared API used by CLI and Web.

**Tech Stack:** TypeScript, Fastify, SQLite, Vitest, React/Vite, native Git CLI.

## Global Constraints

- The Architecture Wiki + OKF repository remains the System of Record.
- AI-generated knowledge without sufficient corporate evidence remains a `RECOMMENDATION` requiring human review.
- Web, API, and CLI must use the same application services.
- Significant decisions must follow `DRAFT -> REVIEWED -> APPROVED`.
- Git publication must not switch or mutate the developer's active checkout branch.
- No multi-agent architecture, real LLM provider, knowledge-authoring UI, or real-time collaboration in this cycle.

---

### Task 1: Persist recommendations and complete traceability

**Files:**

- Modify: `packages/domain/src/types.ts`
- Modify: `packages/domain/src/schemas.ts`
- Modify: `packages/orchestrator/src/orchestrator.ts`
- Modify: `packages/orchestrator/src/traceability.ts`
- Modify: `packages/artifacts/src/markdown-renderer.ts`
- Modify: `packages/artifacts/src/json-renderer.ts`
- Test: `packages/orchestrator/src/orchestrator.test.ts`
- Test: `packages/orchestrator/src/traceability.test.ts`
- Test: `packages/artifacts/src/package-renderer.test.ts`

**Interfaces:**

- Add `recommendations: Recommendation[]` to `ArchitectureContext`.
- Extend `Recommendation` with `sourceRequirementIds` and `sourceKnowledgeIds` so each recommendation can be independently traced.
- Add trace links for `KNOWLEDGE_ITEM -> RECOMMENDATION` and `RECOMMENDATION -> DECISION`.
- Preserve the existing public `AnalysisResult` and package renderer contracts.

- [ ] **Step 1: Write failing tests** asserting that an analysis creates one recommendation per requirement, recommendations identify their evidence knowledge IDs, and the complete chain contains `Recommendation` links.
- [ ] **Step 2: Run focused tests and verify the expected failure** because `ArchitectureContext.recommendations` and the new link chain do not exist.
- [ ] **Step 3: Implement the minimum domain and orchestrator changes**. Use the evidence selected for the requirement; when no evidence exists, create a recommendation with an empty evidence list and an explicit human-review rationale. Do not use the first global evidence item for every requirement.
- [ ] **Step 4: Render recommendations and their IDs in `architecture-context.json`, `01-architecture-analysis.md`, and `traceability.md`.
- [ ] **Step 5: Run focused orchestrator and artifact tests and confirm all pass.**
- [ ] **Step 6: Commit** with `feat: complete recommendation traceability`.

### Task 2: Synchronize governance and package status

**Files:**

- Modify: `packages/persistence/src/review-repository.ts`
- Modify: `packages/persistence/src/analysis-repository.ts`
- Modify: `packages/application/src/governance-service.ts`
- Modify: `packages/application/src/analysis-service.ts`
- Modify: `apps/api/src/app.ts`
- Test: `packages/application/src/governance-service.test.ts`
- Test: `packages/persistence/src/persistence.test.ts`
- Test: `apps/api/src/routes.test.ts`

**Interfaces:**

- Add a repository query that resolves a decision to its owning analysis.
- Add `AnalysisService.refreshPackageStatus(analysisId)` to derive `DRAFT`, `IN_REVIEW`, `APPROVED`, or `INCOMPLETE` from persisted decisions and traceability state.
- Governance actions must update the decision audit and then refresh the owning analysis result in one application workflow.

- [ ] **Step 1: Write failing tests** for `DRAFT -> REVIEWED -> APPROVED`, status recalculation after each action, and a rejected/requested-changes decision returning the package to a reviewable state.
- [ ] **Step 2: Run focused tests and verify they fail** because governance currently updates only the decision row.
- [ ] **Step 3: Implement the owning-analysis lookup and status refresh** without adding a second source of truth for the result.
- [ ] **Step 4: Update the API governance route** to call the coordinated workflow and return the updated decision plus package status.
- [ ] **Step 5: Run persistence, application, and API tests.**
- [ ] **Step 6: Commit** with `feat: synchronize package governance status`.

### Task 3: Publish reviewed packages through an isolated Git worktree

**Files:**

- Modify: `packages/domain/src/types.ts`
- Modify: `packages/governance/src/git-workspace.ts`
- Create: `packages/application/src/review-package-service.ts`
- Modify: `packages/application/src/index.ts`
- Modify: `apps/api/src/app.ts`
- Modify: `apps/cli/src/main.ts`
- Test: `packages/governance/src/git-workspace.test.ts`
- Test: `packages/application/src/review-package-service.test.ts`
- Test: `apps/api/src/routes.test.ts`
- Test: `apps/cli/src/commands.test.ts`

**Interfaces:**

- Replace branch switching with an isolated worktree operation: `git worktree add -b <branch> <path> <revision>`.
- Add `ReviewPackageService.prepare(analysisId, options)` returning `{ analysisId, branch, workspacePath, commit, files, status }`.
- Expose `POST /packages/:id/review` with `{ branch, message?, workspacePath? }`; reject packages whose significant decisions are not all `APPROVED`.
- Add CLI command `review-package <analysisId> --branch <branch> [--workspace <path>] [--message <message>]`.

- [ ] **Step 1: Write failing tests** proving the active checkout branch is unchanged, the worktree is based on the pinned revision, unapproved decisions return a stable conflict, and approved packages produce a commit.
- [ ] **Step 2: Run focused tests and verify the expected failures.**
- [ ] **Step 3: Implement isolated worktree creation and cleanup-safe package writing.**
- [ ] **Step 4: Implement `ReviewPackageService` using `PackageService` output and the persisted package status.**
- [ ] **Step 5: Add the API route and CLI command through the shared application service.**
- [ ] **Step 6: Run governance, application, API, and CLI tests.**
- [ ] **Step 7: Commit** with `feat: publish approved packages to isolated git worktrees`.

### Task 4: Add Web review-publication controls and integration coverage

**Files:**

- Modify: `apps/web/src/api/client.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/pages/AnalysisDetail.tsx`
- Create: `apps/web/src/pages/ReviewPublication.tsx`
- Test: `apps/web/src/App.test.tsx`
- Test: `apps/web/src/ReviewPublication.test.tsx`
- Modify: `README.md`
- Modify: `docs/test-cases/architecture-ai-cycle-3-manual-test-cases.md`

**Interfaces:**

- Add typed `prepareReviewPackage()` to `ApiClient`.
- The detail view shows recommendation traceability, package status, and a publication action only when all significant decisions are approved.
- Failed publication/review actions remain visible without losing the current analysis detail.

- [ ] **Step 1: Add a DOM test harness dependency/configuration and write failing App lifecycle tests** for history → detail → review → publication → history.
- [ ] **Step 2: Run the Web tests and verify the lifecycle tests fail for the missing publication control.
- [ ] **Step 3: Implement typed API client and publication state handling.**
- [ ] **Step 4: Render recommendation links and the review-publication result in the detail workspace.**
- [ ] **Step 5: Run Web tests and build.**
- [ ] **Step 6: Update manual cases with branch, commit, approval-gate, and package-status scenarios.
- [ ] **Step 7: Commit** with `feat: expose git review publication in web workspace`.

### Task 5: End-to-end verification and handoff

**Files:**

- Modify: `tests/e2e/architecture-package.test.ts`
- Create: `tests/e2e/review-publication.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Write the failing reference scenario** covering requirements, evidence, recommendation, decision review, approval, isolated worktree commit, and restart persistence.
- [ ] **Step 2: Run it and verify the missing publication integration.**
- [ ] **Step 3: Implement only the missing integration wiring exposed by the test.**
- [ ] **Step 4: Run the complete verification suite: typecheck, all Vitest tests, Web build, API startup, and one real API/Web smoke flow.
- [ ] **Step 5: Document the completed flow, commands, outputs, and known deferred scope.
- [ ] **Step 6: Commit** with `test: verify next cycle review publication flow`.
