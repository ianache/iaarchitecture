# Governed Knowledge Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a human-governed workflow that publishes new, validated Markdown/OKF knowledge documents to an isolated local Git branch while Git remains the sole Architecture Knowledge Base System of Record.

**Architecture:** A persisted `KnowledgeChangeRequest` (KCR) is workflow state only. A shared application service governs its lifecycle, and API, CLI, and Web call that service. Publication delegates to a scoped Git-worktree operation; retrieval remains restricted to explicitly selected Git revisions.

**Tech Stack:** TypeScript, Zod, Node `node:sqlite`, Fastify, Commander, React, Vitest, Testing Library, native Git worktrees.

## Global Constraints

- New knowledge only; do not edit, delete, or supersede published knowledge.
- Preserve Markdown + OKF frontmatter in Git as the System of Record.
- Support classifications `FACT`, `STANDARD`, `RECOMMENDATION`, `DECISION`, and `EXCEPTION`.
- Restrict target categories to `adrs`, `anti-patterns`, `guidelines`, `nfr`, `patterns`, `principles`, `standards`, and `technologies`.
- Lifecycle: `DRAFT -> REVIEWED -> APPROVED -> PUBLISHED`; a human reviews and approves before publication.
- API, CLI, and Web use one shared application service.
- Publication creates a local isolated branch and commit only; it must never merge `master` or invoke a remote provider.
- Commit only the target document, not `git add .`.
- KCR records are never evidence for analyses.
- Follow TDD and commit each independently testable task.

---

## File Structure

- `packages/domain/src/types.ts` and `schemas.ts`: KCR contracts and Zod validation.
- `packages/persistence/src/schema.ts`, `knowledge-change-request-repository.ts`, and `index.ts`: SQLite workflow persistence.
- `packages/application/src/knowledge-change-request-service.ts`: lifecycle, validation, deterministic target path, and publication.
- `packages/governance/src/git-workspace.ts`: scoped file write and scoped commit.
- `apps/api/src/app.ts`: KCR dependency wiring, routes, and error mapping.
- `apps/cli/src/main.ts`: matching KCR commands.
- `apps/web/src/api/client.ts`, `pages/KnowledgeChangeRequests.tsx`, and `App.tsx`: authoring workspace.
- Corresponding `*.test.ts`/ `*.test.tsx` files cover every boundary.
- `README.md` and `docs/test-cases/*.md`: executable instructions and manual coverage.

### Task 1: Define KCR contracts and persistence

**Files:**
- Modify: `packages/domain/src/types.ts`, `packages/domain/src/schemas.ts`, `packages/domain/src/schemas.test.ts`
- Create: `packages/persistence/src/knowledge-change-request-repository.ts`
- Modify: `packages/persistence/src/schema.ts`, `packages/persistence/src/persistence.test.ts`, `packages/persistence/src/index.ts`

**Interfaces:**
- Produce `KnowledgeChangeRequest`, `KnowledgeChangeRequestInput`, `KnowledgeChangeReview`, `KnowledgePublicationResult`, and `KnowledgeChangeRequestRepository`.
- Repository operations: `nextId()`, `create(input)`, `get(id)`, `list()`, `update(request)`, `recordReview(review)`, and `listAudit(id)`.
- Use a deterministic `knowledge/<category>/<key>.md` target path.

- [ ] **Step 1: Write failing tests**

```ts
expect(knowledgeChangeRequestSchema.safeParse({ key: "mfa-standard", category: "standards", type: "STANDARD" }).success).toBe(false);
await repository.create(validDraft);
expect(await reopened.get("KCR-1")).toMatchObject({ status: "DRAFT", targetPath: "knowledge/standards/mfa-standard.md" });
```

- [ ] **Step 2: Run the tests red**

Run: `pnpm --filter @architecture-ai/domain test -- schemas.test.ts` and `pnpm --filter @architecture-ai/persistence test -- persistence.test.ts`

Expected: FAIL because the KCR symbols and repository are absent.

- [ ] **Step 3: Implement the smallest contracts and repository**

```ts
export type KnowledgeChangeRequestStatus = "DRAFT" | "REVIEWED" | "APPROVED" | "PUBLISHED";
export interface KnowledgeChangeRequest {
  id: string; category: KnowledgeCategory; document: KnowledgeItem; author: string;
  baseRevision: string; targetPath: string; status: KnowledgeChangeRequestStatus;
  createdAt: string; updatedAt: string; publication?: KnowledgePublicationResult;
}
```

Create `knowledge_change_requests` and `knowledge_change_request_events` tables. Store the JSON workflow payload plus indexed lifecycle/timestamps, following `ReviewRepository` conventions.

- [ ] **Step 4: Run the tests green**

Run: `pnpm --filter @architecture-ai/domain test -- schemas.test.ts` and `pnpm --filter @architecture-ai/persistence test -- persistence.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/domain/src/types.ts packages/domain/src/schemas.ts packages/domain/src/schemas.test.ts packages/persistence/src/schema.ts packages/persistence/src/knowledge-change-request-repository.ts packages/persistence/src/persistence.test.ts packages/persistence/src/index.ts
git commit -m "feat: persist knowledge change requests"
```

### Task 2: Implement lifecycle and scoped Git publication

**Files:**
- Create: `packages/application/src/knowledge-change-request-service.ts`, `packages/application/src/knowledge-change-request-service.test.ts`
- Modify: `packages/application/src/errors.ts`, `packages/application/src/index.ts`, `packages/governance/src/git-workspace.ts`, `packages/governance/src/git-workspace.test.ts`, `packages/domain/src/types.ts`

**Interfaces:**
- Produce `KnowledgeChangeRequestService.create/list/get/review/approve/publish`.
- Extend `GitWorkspace` with `writeKnowledgeDocument(targetPath, content)` and `prepareKnowledgeReview(targetPath, message)`.

- [ ] **Step 1: Write failing lifecycle and isolation tests**

```ts
await expect(service.publish("KCR-1")).rejects.toMatchObject({ code: "INVALID_KNOWLEDGE_CHANGE_TRANSITION" });
await service.review("KCR-1", "architect");
await service.approve("KCR-1", "architect");
expect((await service.publish("KCR-1")).status).toBe("PUBLISHED");
expect(stagedPaths).toEqual(["knowledge/standards/mfa-standard.md"]);
```

- [ ] **Step 2: Run the tests red**

Run: `pnpm --filter @architecture-ai/application test -- knowledge-change-request-service.test.ts` and `pnpm --filter @architecture-ai/governance test -- git-workspace.test.ts`

Expected: FAIL because the service and scoped methods are absent.

- [ ] **Step 3: Implement lifecycle and publication**

```ts
if (request.status !== "APPROVED") {
  throw new ApplicationError("INVALID_KNOWLEDGE_CHANGE_TRANSITION", "Knowledge change request must be APPROVED before publication");
}
await workspace.createBranch(branch ?? `knowledge/${request.id.toLowerCase()}`, request.baseRevision);
await workspace.writeKnowledgeDocument(request.targetPath, renderKnowledgeMarkdown(request.document));
const publication = await workspace.prepareKnowledgeReview(request.targetPath, `docs: publish ${request.id}`);
```

Validate with the existing OKF parser before review and publication. Reject unsafe category/key values. Map worktree/commit failures to `KNOWLEDGE_PUBLICATION_FAILED` and retain `APPROVED` for retry.

- [ ] **Step 4: Run the tests green**

Run: `pnpm --filter @architecture-ai/application test -- knowledge-change-request-service.test.ts` and `pnpm --filter @architecture-ai/governance test -- git-workspace.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/application/src/knowledge-change-request-service.ts packages/application/src/knowledge-change-request-service.test.ts packages/application/src/errors.ts packages/application/src/index.ts packages/governance/src/git-workspace.ts packages/governance/src/git-workspace.test.ts packages/domain/src/types.ts
git commit -m "feat: govern knowledge publication lifecycle"
```

### Task 3: Expose matching API and CLI capabilities

**Files:**
- Modify: `apps/api/src/app.ts`, `apps/api/src/routes.test.ts`, `apps/cli/src/main.ts`, `apps/cli/src/commands.test.ts`

**Interfaces:**
- Add `ApiDependencies.knowledgeChangeRequestService`.
- Routes: `POST /knowledge-change-requests`, `GET /knowledge-change-requests`, `GET /knowledge-change-requests/:id`, `POST /:id/review`, `POST /:id/approve`, and `POST /:id/publish` below that route prefix.
- CLI commands: `knowledge-create`, `knowledge-list`, `knowledge-get`, `knowledge-review`, `knowledge-approve`, `knowledge-publish`.

- [ ] **Step 1: Write failing API/CLI tests**

```ts
expect((await app.inject({ method: "POST", url: "/knowledge-change-requests", payload: validDraft })).statusCode).toBe(201);
expect((await app.inject({ method: "POST", url: "/knowledge-change-requests/KCR-1/publish" })).statusCode).toBe(409);
expect(createCli().commands.map((command) => command.name())).toContain("knowledge-publish");
```

- [ ] **Step 2: Run the tests red**

Run: `pnpm --filter @architecture-ai/api test -- routes.test.ts` and `pnpm --filter @architecture-ai/cli test -- commands.test.ts`

Expected: FAIL because the routes and commands are absent.

- [ ] **Step 3: Add endpoints and commands**

```ts
app.post("/knowledge-change-requests/:id/approve", async (request, reply) => {
  const body = reviewSchema.safeParse(request.body ?? {});
  if (!body.success) return reply.code(400).send({ code: "INVALID_REQUEST", issues: body.error.issues });
  return reply.send(await knowledgeChangeRequests.approve(request.params.id, body.data.reviewer, body.data.comment));
});
```

Map invalid request/metadata/category/revision to 400, not found to 404, invalid transition/republish to 409, and publication failure to 500 using `{ code, message }`. Each CLI command calls exactly one matching API route and preserves API errors.

- [ ] **Step 4: Run the tests green**

Run: `pnpm --filter @architecture-ai/api test -- routes.test.ts` and `pnpm --filter @architecture-ai/cli test -- commands.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/app.ts apps/api/src/routes.test.ts apps/cli/src/main.ts apps/cli/src/commands.test.ts
git commit -m "feat: expose governed knowledge authoring"
```

### Task 4: Add the Web authoring workspace

**Files:**
- Modify: `apps/web/src/api/client.ts`, `apps/web/src/api/client.test.ts`, `apps/web/src/App.tsx`, `apps/web/src/App.dom.test.tsx`, `apps/web/src/styles.css`
- Create: `apps/web/src/pages/KnowledgeChangeRequests.tsx`, `apps/web/src/KnowledgeChangeRequests.test.tsx`

**Interfaces:**
- Extend `ApiClient` with create/list/get/review/approve/publish KCR methods.
- `KnowledgeChangeRequests` receives `{ client, onBack }` and owns list/create/detail UI state.

- [ ] **Step 1: Write failing client and DOM tests**

```tsx
render(<KnowledgeChangeRequests client={client} onBack={vi.fn()} />);
fireEvent.click(screen.getByRole("button", { name: "New knowledge proposal" }));
fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
await waitFor(() => expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument());
```

Add an App DOM test that creates `KCR-1`, reviews, approves, and publishes it, asserting calls to all KCR routes. Add invalid draft and 409 publish feedback assertions.

- [ ] **Step 2: Run the tests red**

Run: `pnpm --filter @architecture-ai/web test -- KnowledgeChangeRequests.test.tsx App.dom.test.tsx api/client.test.ts`

Expected: FAIL because the client methods and workspace are absent.

- [ ] **Step 3: Implement the minimal UI**

```tsx
{request.status === "DRAFT" && <button onClick={() => void review(request.id)}>Review</button>}
{request.status === "REVIEWED" && <button onClick={() => void approve(request.id)}>Approve</button>}
{request.status === "APPROVED" && <button onClick={() => void publish(request.id)}>Publish</button>}
```

Collect only category, key, title, summary, classification, author, base revision, tags, and Markdown body. Keep validation server-driven. Add entry/back actions without introducing a router or an approved-document editor.

- [ ] **Step 4: Run the tests green**

Run: `pnpm --filter @architecture-ai/web test -- KnowledgeChangeRequests.test.tsx App.dom.test.tsx api/client.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/api/client.ts apps/web/src/api/client.test.ts apps/web/src/pages/KnowledgeChangeRequests.tsx apps/web/src/KnowledgeChangeRequests.test.tsx apps/web/src/App.tsx apps/web/src/App.dom.test.tsx apps/web/src/styles.css
git commit -m "feat: add knowledge authoring workspace"
```

### Task 5: Document and verify the vertical slice

**Files:**
- Modify: `README.md`, `docs/test-cases/architecture-ai-manual-test-cases.md`, `docs/test-cases/architecture-ai-automated-coverage-matrix.md`

**Interfaces:**
- Consumes the completed KCR flow and documents repeatable local calls and expected Git results.

- [ ] **Step 1: Add the manual acceptance cases**

Document valid standard proposal, invalid OKF metadata, prohibited publish-before-approval, successful isolated Git publication, and confirmation the new document is not retrieved by `HEAD` until its revision is selected/integrated.

- [ ] **Step 2: Run the full tests**

Run: `pnpm -r --workspace-concurrency=1 test`

Expected: PASS including domain, persistence, application, governance, API, CLI, and Web KCR coverage.

- [ ] **Step 3: Build the deliverables**

Run: `pnpm -r build`

Expected: PASS. If a package-manager network fetch is unavailable, rerun local TypeScript/Vite build commands and record the limitation rather than masking it.

- [ ] **Step 4: Check documentation formatting**

Run: `git diff --check`

Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/test-cases/architecture-ai-manual-test-cases.md docs/test-cases/architecture-ai-automated-coverage-matrix.md
git commit -m "docs: describe governed knowledge authoring"
```

## Plan Self-Review

- Spec coverage: Tasks 1-2 implement workflow state, lifecycle, validation, Git-only publication, and the retrieval boundary. Task 3 provides the shared API/CLI contract. Task 4 provides equivalent Web actions. Task 5 covers full vertical-slice verification and documentation.
- Placeholder scan: no deferred or unspecified implementation steps remain.
- Type consistency: every later task uses the names introduced in Tasks 1 and 2: `KnowledgeChangeRequestService`, `KnowledgeChangeRequestRepository`, `writeKnowledgeDocument`, and `prepareKnowledgeReview`.
