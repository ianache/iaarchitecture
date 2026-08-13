# Design Spec: Fix KCR Route 404

Status: Approved

## Goal

Resolve the `404 Not Found` error when requesting `/knowledge-change-requests` on the production API server.

## Design

### 1. Zentralized Fallback Composition
* **File:** [`apps/api/src/app.ts`](file:///C:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/03-PERSONAL/00-Arquitectura-Empresarial-with-AgentesAI/apps/api/src/app.ts)
* **Problem:** `createDefaultApp` and other production bootstrap paths instantiate the server without passing `knowledgeChangeRequestService` in the dependency injection container, leading the Fastify app to skip KCR route registration.
* **Resolution:**
  - Import `KnowledgeChangeRequestRepository` from `@architecture-ai/persistence` inside `app.ts`.
  - Fallback to dynamic instantiation of `KnowledgeChangeRequestService` if not provided in the dependency parameters of `buildApp`.
  - Use the default SQLite `store` and a `LocalGitWorkspace` bound to the current working directory.

```typescript
const knowledgeChangeRequestService = dependencies.knowledgeChangeRequestService ?? new KnowledgeChangeRequestService(
  new KnowledgeChangeRequestRepository(store!),
  new LocalGitWorkspace(process.cwd())
);
```

## Verification Criteria
- `GET /knowledge-change-requests` returns `200 OK` on the running API server.
- All Fastify integration tests pass cleanly.
