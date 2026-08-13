# Design Spec: Stabilize Test Suite

Status: Approved

## Goal

Resolve the three failing tests in the test suite to ensure local environment stability and robust continuous integration.

## Design

### 1. CLI Command Expansion
* **File:** [`apps/cli/src/commands.test.ts`](file:///C:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/03-PERSONAL/00-Arquitectura-Empresarial-with-AgentesAI/apps/cli/src/commands.test.ts)
* **Problem:** Recent addition of Knowledge Change Request commands (`knowledge-*`) caused the strict array equality assertion of CLI commands to fail.
* **Resolution:** Update the expected command array in `commands.test.ts` to assert all 12 registered commands, including both core and knowledge governance actions.

### 2. KCR Lifecycle Transition Test Fix
* **File:** [`packages/application/src/knowledge-change-request-service.test.ts`](file:///C:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/03-PERSONAL/00-Arquitectura-Empresarial-with-AgentesAI/packages/application/src/knowledge-change-request-service.test.ts)
* **Problem:** The test `publishes an approved request successfully` mocked the initial database request status as `"APPROVED"` but subsequently called `.review(...)` and `.approve(...)` on it, triggering an `INVALID_KNOWLEDGE_CHANGE_TRANSITION` error.
* **Resolution:** Initialize the mocked request status to `"DRAFT"`, matching the expectation of the lifecycle transitions being tested.

### 3. Isolated SQLite Test DBs
* **Files:**
  - [`packages/application/src/package-service.test.ts`](file:///C:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/03-PERSONAL/00-Arquitectura-Empresarial-with-AgentesAI/packages/application/src/package-service.test.ts)
  - [`packages/application/src/analysis-service.test.ts`](file:///C:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/03-PERSONAL/00-Arquitectura-Empresarial-with-AgentesAI/packages/application/src/analysis-service.test.ts)
* **Problem:** Shared SQLite database filenames conflict due to OS-level file locking when Vitest processes tests. Residual locks on Windows cause `UNIQUE constraint failed` or `EBUSY` when attempting to delete/unlink files in `afterEach`.
* **Resolution:** 
  - Generate dynamically-named SQLite files per test or test execution using a UUID suffix (e.g., `.architecture-ai/package-service-test-${uuid}.sqlite`).
  - Ensure each test closes and cleans up its own database file.

## Verification Criteria
- All tests pass when running with `vitest run --exclude '.worktrees/**' --pool=forks --maxWorkers=1 --minWorkers=1`.
- Clean lint and typecheck execution.
