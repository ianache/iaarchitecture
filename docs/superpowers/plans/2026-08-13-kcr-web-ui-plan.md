# Knowledge Change Request Web UI Evolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a dual-column Web UI for Knowledge Change Requests featuring hybrid path generation, interactive review/approve actions, and an integrated audit timeline.

**Architecture:** Expose KCR audit logs through the Application Service and API endpoints. Update the Web API client routes to match the `/knowledge-change-requests` endpoints, and refactor the React pages to render a two-column responsive grid with a timeline and review panels.

**Tech Stack:** TypeScript, React, Fastify, Vitest.

## Global Constraints
- Every behavior change follows TDD: run tests, implement, verify green.
- CSS classes and structures must remain responsive and leverage modern CSS grids/flexbox.
- All KCR endpoints use `/knowledge-change-requests` as defined in the API.

---

### Task 1: Expose KCR Audit Service and API Endpoint

**Files:**
- Modify: `packages/application/src/knowledge-change-request-service.ts`
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/src/routes.test.ts` or add KCR audit assertions in the route tests

- [ ] **Step 1: Write a test verifying KCR audit events retrieval**
  Add a test in `apps/api/src/routes.test.ts` that hits `GET /knowledge-change-requests/KCR-1/audit` and asserts it returns the list of events.
  
- [ ] **Step 2: Run the test to verify it fails**
  Run: `& .\node_modules\.bin\vitest.cmd run apps/api/src/routes.test.ts`
  Expected: FAIL (404 Not Found)

- [ ] **Step 3: Implement listAudit in KnowledgeChangeRequestService**
  Add the following method inside `packages/application/src/knowledge-change-request-service.ts`:
  ```typescript
  async listAudit(id: string): Promise<KnowledgeChangeReview[]> {
    return this.repository.listAudit(id);
  }
  ```

- [ ] **Step 4: Register GET /knowledge-change-requests/:id/audit route in Fastify**
  Add the route inside the `if (knowledgeChangeRequestService)` block in `apps/api/src/app.ts`:
  ```typescript
      app.get<{ Params: { id: string } }>("/knowledge-change-requests/:id/audit", async (request, reply) => {
        try {
          return reply.send({ events: await knowledgeChangeRequestService.listAudit(request.params.id) });
        } catch (error) {
          const response = errorResponse(error);
          return reply.code(response.status).send(response.body);
        }
      });
  ```

- [ ] **Step 5: Verify the test passes**
  Run: `& .\node_modules\.bin\vitest.cmd run apps/api/src/routes.test.ts`
  Expected: PASS

- [ ] **Step 6: Commit**
  Run:
  ```powershell
  git add packages/application/src/knowledge-change-request-service.ts apps/api/src/app.ts apps/api/src/routes.test.ts
  git commit -m "feat: expose KCR audit history via application service and API endpoint"
  ```

---

### Task 2: Align API Client Routes and Fix Mocks

**Files:**
- Modify: `apps/web/src/api/client.ts`
- Modify: `apps/web/src/KnowledgeChangeRequests.test.tsx`
- Modify: `apps/web/src/App.dom.test.tsx`

- [ ] **Step 1: Check existing KCR web tests**
  Run: `& .\node_modules\.bin\vitest.cmd run apps/web/src/KnowledgeChangeRequests.test.tsx`
  Expected: Pass or fail depending on path matching. We need to align the API client to prevent production API failures.

- [ ] **Step 2: Update ApiClient interface and implementation in client.ts**
  In `apps/web/src/api/client.ts`, update client paths to call `/knowledge-change-requests` instead of `/knowledge/requests`, and update review methods to take reviewer/comment arguments:
  ```typescript
  export interface ApiClient {
    ...
    createKcr(input: any): Promise<{ id: string; status: string }>;
    listKcrs(): Promise<any[]>;
    getKcr(id: string): Promise<any>;
    reviewKcr(id: string, reviewer: string, comment?: string): Promise<unknown>;
    approveKcr(id: string, reviewer: string, comment?: string): Promise<unknown>;
    publishKcr(id: string, branch?: string): Promise<{ branch: string; commit?: string }>;
    getKcrAudit(id: string): Promise<{ events: any[] }>;
  }
  ```
  And inside the `createApiClient` implementation:
  ```typescript
    createKcr: (input) => json<{ id: string; status: string }>("/knowledge-change-requests", { method: "POST", body: JSON.stringify(input) }),
    listKcrs: () => json<any[]>("/knowledge-change-requests"),
    getKcr: (id) => json<any>(`/knowledge-change-requests/${id}`),
    reviewKcr: (id, reviewer, comment) => json(`/knowledge-change-requests/${id}/review`, { method: "POST", body: JSON.stringify({ reviewer, comment }) }),
    approveKcr: (id, reviewer, comment) => json(`/knowledge-change-requests/${id}/approve`, { method: "POST", body: JSON.stringify({ reviewer, comment }) }),
    publishKcr: (id, branch) => json<{ branch: string; commit?: string }>(`/knowledge-change-requests/${id}/publish`, { method: "POST", body: JSON.stringify({ branch }) }),
    getKcrAudit: (id) => json<{ events: any[] }>(`/knowledge-change-requests/${id}/audit`)
  ```

- [ ] **Step 3: Align test mocks in web tests**
  In `apps/web/src/KnowledgeChangeRequests.test.tsx` and `apps/web/src/App.dom.test.tsx`, update the mocked `client` objects to include `approveKcr` and `getKcrAudit` methods to match the new interface.

- [ ] **Step 4: Verify web tests run and compile successfully**
  Run: `& .\node_modules\.bin\vitest.cmd run apps/web/src/App.dom.test.tsx apps/web/src/KnowledgeChangeRequests.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run:
  ```powershell
  git add apps/web/src/api/client.ts apps/web/src/KnowledgeChangeRequests.test.tsx apps/web/src/App.dom.test.tsx
  git commit -m "chore: align ApiClient routes with KCR API endpoints and update mocks"
  ```

---

### Task 3: Implement Enhanced KCR Web UI

**Files:**
- Modify: `apps/web/src/pages/KnowledgeChangeRequests.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Write a test verifying the new path suggestion and form rendering**
  In `apps/web/src/KnowledgeChangeRequests.test.tsx`, add assertions verifying the creation view updates target path suggestions, and the detail view includes reviewer action fields and an audit timeline list.
  
- [ ] **Step 2: Run the test to verify it fails**
  Run: `& .\node_modules\.bin\vitest.cmd run apps/web/src/KnowledgeChangeRequests.test.tsx`
  Expected: FAIL

- [ ] **Step 3: Implement KCR Creation View path generator**
  In the creation view of `apps/web/src/pages/KnowledgeChangeRequests.tsx`, add state or handlers that update the proposed path suggestion dynamically as `category` and `key` inputs are typed:
  ```typescript
  const [key, setKey] = useState("");
  const [category, setCategory] = useState("standards");
  const [targetPath, setTargetPath] = useState("knowledge/standards/");

  // Trigger whenever key or category updates:
  useEffect(() => {
    setTargetPath(`knowledge/${category}/${key || "document"}.md`);
  }, [key, category]);
  ```
  Bind these states to the creation form inputs.

- [ ] **Step 4: Implement KCR Detail View split columns layout**
  In the detail view of `apps/web/src/pages/KnowledgeChangeRequests.tsx`, design the two-column grid.
  - Column Left: Metadata, colored status badges (`DRAFT` grey, `REVIEWED` blue, `APPROVED` green, `PUBLISHED` purple), the interactive review form (dropdown for action, reviewer input, comment textarea), and the vertical timeline audit events.
  - Column Right: Render standard markdown representation of the document, inside a scrolling container.
  Add timeline list loader:
  ```typescript
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  // In loadDetail(id):
  const auditRes = await client.getKcrAudit(id);
  setAuditEvents(auditRes.events);
  ```

- [ ] **Step 5: Add CSS classes to styles.css for premium presentation**
  Add styles in `apps/web/src/styles.css` to cover:
  - `.kcr-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 2rem; }`
  - Badges styles: `.badge-draft`, `.badge-reviewed`, `.badge-approved`, `.badge-published`.
  - Timeline styling: `.timeline { border-left: 2px solid #dde3ef; padding-left: 1rem; margin-top: 1rem; }`, `.timeline-item { margin-bottom: 1.5rem; position: relative; }`.
  - Markdown content reader box.

- [ ] **Step 6: Verify web tests and manual flows**
  Run: `& .\node_modules\.bin\vitest.cmd run apps/web/src/KnowledgeChangeRequests.test.tsx`
  Expected: PASS

- [ ] **Step 7: Commit**
  Run:
  ```powershell
  git add apps/web/src/pages/KnowledgeChangeRequests.tsx apps/web/src/styles.css
  git commit -m "feat: implement dual-column layout, dynamic path suggestion, and audit timeline in KCR Web UI"
  ```
