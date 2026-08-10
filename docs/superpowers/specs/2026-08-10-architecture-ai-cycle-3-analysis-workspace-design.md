# Architecture AI Cycle 3: Analysis Workspace Design

## Goal

Allow architects to reopen persisted analyses from the Web and inspect their package, traceability, decisions, and governance after restarting the API, while keeping package generation separate from read-only queries.

## Scope

This cycle implements:

- Persistent analysis history through `GET /analyses`.
- Web navigation from analysis history to an analysis detail view.
- Read-only `GET /packages/:id` behavior.
- Explicit package generation through `POST /packages/:id/generate`.
- Reuse of the existing SQLite `analyses` table and `AnalysisRepository`.
- Preservation of the existing governance, audit, traceability, CLI, and CORS behavior.

This cycle does not implement:

- A separate package database table.
- ZIP download or a complete Markdown file viewer.
- Multi-agent orchestration.
- Production Knowledge Graph or Vector Store projections.
- Authentication, SSO, or enterprise RBAC.

## Architecture and data flow

The existing `AnalysisService` remains the application boundary for analysis queries. `AnalysisRepository.list()` reads persisted records from SQLite and returns summaries without rerunning orchestration. `PackageService.generate()` remains the only application operation that writes package artifacts.

```text
Web / CLI / API
      |
      v
AnalysisService
      |
      v
AnalysisRepository.list/get
      |
      v
SQLite analyses table
```

Package reads and writes are explicitly separated:

- `GET /packages/:id` reads the stored `AnalysisResult` and never writes files.
- `POST /packages/:id/generate` invokes `PackageService.generate()` and writes the versionable package to the requested output directory.

The persisted analysis result remains the source for the current operational view. The Architecture Wiki + OKF repository remains the corporate knowledge System of Record.

## API contracts

### `GET /analyses`

Returns summaries ordered by `updatedAt` descending:

```json
{
  "analyses": [
    {
      "id": "ANALYSIS-1",
      "requirements": "...",
      "knowledgeRevision": "abc123",
      "status": "DRAFT",
      "createdAt": "2026-08-10T10:00:00.000Z",
      "updatedAt": "2026-08-10T10:01:00.000Z",
      "hasResult": true
    }
  ]
}
```

The endpoint does not expose the full result payload or trigger orchestration.

### `GET /packages/:id`

Returns the stored `AnalysisResult`. It returns `404 NOT_FOUND` for an unknown analysis and a controlled not-ready error when the analysis has no result. It has no filesystem side effects.

### `POST /packages/:id/generate`

Generates the package using the stored result. It preserves the existing response containing analysis id, output directory, generated files, and architecture context. Generation errors remain mapped to the application error contract.

## Web experience

The initial Web state becomes the analysis history screen:

- List persisted analyses.
- Show id, status, knowledge revision, and updated date.
- Select an analysis to open its detail view.
- Start a new analysis from the same screen.

The detail screen keeps the existing capabilities:

- Package status, findings, risks, and knowledge revision.
- Explicit package generation/regeneration.
- Decision review actions.
- Governance audit count/history.
- Traceability table.
- Navigation back to history.

The Web client will expose typed methods for listing analyses, reading a package, and generating a package. Existing review and traceability methods remain unchanged.

## Error handling

- Unknown analysis: `404` with `NOT_FOUND`.
- Known analysis without result: `409` with `PACKAGE_NOT_READY`; this is distinct from a failed package generation.
- Generation failure: `500` with `PACKAGE_GENERATION_FAILED`.
- Invalid request data: `400` with `INVALID_REQUEST`.
- Read operations must not convert a missing result into an implicit generation.

## Testing and acceptance

Application and persistence tests will cover listing, ordering, summary projection, and restart persistence. API tests will cover the new list route, read-only package behavior, explicit generation, missing analysis, and missing result. Web tests will cover history rendering, selecting an analysis, returning to history, and package generation calls.

End-to-end acceptance scenario:

1. Create an analysis from the Web or CLI.
2. Generate its package.
3. Stop and restart the API.
4. Open the Web history.
5. Select the existing analysis.
6. Inspect package status, traceability, decisions, and audit.
7. Confirm that opening the package did not regenerate files.

The cycle is complete when this scenario passes and the full repository test suite plus the Web production build pass, excluding unrelated directories under `.worktrees/**`.
