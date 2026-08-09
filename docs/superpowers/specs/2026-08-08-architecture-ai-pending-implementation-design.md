# Architecture AI Pending Implementation Design

Date: 2026-08-08  
Status: Approved design; implementation not started

## 1. Objective

Complete the executable MVP flow that currently exists as a prototype:

```text
CLI/Web -> API -> SQLite -> Git Knowledge Base -> Orchestrator
       -> Architecture Package -> Human Review -> Audit
```

The phase must preserve the central product constraint: humans, CLI automation, and AI agents use the same backend capabilities and the same Git-based corporate knowledge.

## 2. Scope and decisions

The phase covers:

- SQLite persistence for analyses, decisions, reviews, and audit events.
- API services for analysis, package generation, and governance.
- CLI commands as HTTP clients of the API.
- An executable Vite + React web client.
- Package generation from persisted analysis records.
- Decision-level review and approval with audit history.
- Deterministic/local model provider as the default.
- A stable `ArchitectureModel` port for a later OpenAI or other provider adapter.
- Restart persistence and end-to-end verification.

The phase excludes multi-user authentication, cloud deployment, real-time collaboration, free-form chat, diagram editing, and a mandatory external LLM key.

## 3. Architecture

Keep the existing modular monolith:

```text
CLI -------┐
Web -------┼─> API/Application Services ─> SQLite
Automation ┘             |
                         ├─ AnalysisService
                         ├─ PackageService
                         ├─ GovernanceService
                         ├─ ArchitectureOrchestrator
                         ├─ Knowledge/Retrieval
                         └─ GitWorkspace
```

New service boundaries:

- `AnalysisRepository`: persists and retrieves analysis requests/results.
- `ReviewRepository`: persists decisions, reviews, and audit events.
- `AnalysisService`: coordinates orchestration and persistence.
- `PackageService`: renders a package from a persisted analysis.
- `GovernanceService`: enforces lifecycle transitions and audit events.
- `ApiClient`: shared HTTP contract used by CLI and web.
- `DeterministicModel`: default model implementation for local execution/tests.

SQLite is an implementation detail for operational state, not the corporate knowledge source. Git Markdown/OKF and the ontology remain the System of Record for architecture knowledge.

## 4. SQLite persistence

Database location:

```text
.architecture-ai/architecture-ai.sqlite
```

Tables:

- `analyses`: `id`, `requirements`, `knowledge_revision`, `status`, `result_json`, `created_at`, `updated_at`.
- `decisions`: `id`, `analysis_id`, `decision_json`, `status`, `significant`, `updated_at`.
- `reviews`: `id`, `decision_id`, `reviewer`, `action`, `comment`, `created_at`.
- `audit_events`: `id`, `aggregate_type`, `aggregate_id`, `event_type`, `payload_json`, `created_at`.

Rules:

- `POST /analyses` creates a durable analysis.
- Analysis retrieval works after an API restart.
- The Git knowledge revision is stored with every analysis.
- Review transitions append audit events.
- `DRAFT -> REVIEWED -> APPROVED` is enforced.
- Direct approval from `DRAFT` is rejected.
- Failed persistence returns `PERSISTENCE_ERROR`.

## 5. API contract

```text
POST /analyses
GET  /analyses/:id

POST /packages/:id/generate
GET  /packages/:id
GET  /packages/:id/traceability
GET  /packages/:id/decisions

POST /decisions/:id/review
POST /decisions/:id/approve
POST /decisions/:id/reject
POST /decisions/:id/request-changes
GET  /decisions/:id/audit
```

Package generation returns the analysis ID, output directory, generated files, and package status. Stable API errors are:

```text
INVALID_REQUEST
NOT_FOUND
INVALID_REVISION
PACKAGE_GENERATION_FAILED
INVALID_REVIEW_TRANSITION
INSUFFICIENT_EVIDENCE
PERSISTENCE_ERROR
```

The API must not report success when Git revision resolution, traceability validation, package writing, or a required lifecycle transition fails.

## 6. CLI contract

```powershell
architecture-ai analyze --requirements "Customers submit orders" --revision HEAD
architecture-ai package ANALYSIS-1 --output .\architecture-packages\ANALYSIS-1
architecture-ai review DEC-1 --action review --reviewer "architect@example.com"
architecture-ai review DEC-1 --action approve --reviewer "architect@example.com"
```

The CLI uses `ARCHITECTURE_AI_API_URL`, defaulting to `http://127.0.0.1:3000`. It sends/receives JSON, returns non-zero exit codes for API errors, and contains no domain logic. `analyze`, `package`, and `review` call the same API capabilities used by the web client.

## 7. Web client

Add a Vite + React entrypoint:

```text
apps/web/
  index.html
  src/main.tsx
  src/App.tsx
  src/api/client.ts
  src/pages/SubmitRequirements.tsx
  src/pages/PackageOverview.tsx
  src/pages/Traceability.tsx
  src/pages/DecisionReview.tsx
```

User flow:

1. Submit PRD/user stories.
2. Create an analysis through `POST /analyses`.
3. Request package generation.
4. Inspect package status, risks, evidence, and traceability.
5. Review, approve, reject, or request changes on significant decisions.
6. Inspect audit history.

Configuration uses `VITE_API_URL`, defaulting to `http://127.0.0.1:3000`.

Commands:

```powershell
pnpm --filter @architecture-ai/web dev
pnpm --filter @architecture-ai/web build
```

## 8. Testing and acceptance

Tests must cover:

- Analysis persistence across API restarts.
- Package generation from a persisted analysis.
- Decision lifecycle and audit events.
- CLI-to-API behavior and non-zero error exits.
- Web submission and decision-review actions.
- Invalid Git revisions and stable error codes.
- Complete end-to-end flow from CLI/Web through package and governance.

Primary acceptance criterion:

> After restarting the API, `package ANALYSIS-1` retrieves the persisted analysis, generates the Architecture Package, and its decisions can be reviewed from both CLI and web.

The deterministic model is the default and requires no external key. The `ArchitectureModel` port remains the extension point for a future provider.

## 9. Design principles

1. API/application services are the single capability boundary.
2. CLI and web are thin clients.
3. SQLite stores operational workflow state; Git stores corporate architecture knowledge.
4. Significant decisions require human review.
5. Incomplete or unsupported evidence is explicit.
6. The local MVP runs without external infrastructure or model credentials.
