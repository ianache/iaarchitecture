# Governed Knowledge Authoring Design

## Purpose

Add the smallest authoring workflow that lets humans and automation propose new corporate architecture knowledge without weakening the Git-first System of Record. A proposal is governed before it is published; published knowledge remains Markdown with OKF metadata in Git.

## Scope

This cycle introduces **Knowledge Change Requests** (KCRs) for new knowledge only.

- Supported knowledge classifications: `FACT`, `STANDARD`, `RECOMMENDATION`, `DECISION`, and `EXCEPTION`.
- Supported locations are the repository's existing knowledge categories: `adrs`, `anti-patterns`, `guidelines`, `nfr`, `patterns`, `principles`, `standards`, and `technologies`.
- The shared backend provides the same lifecycle operations to Web UI, API, and CLI: create, list, get, review, approve, and publish.
- Publishing writes a Markdown document with valid OKF frontmatter to an isolated local Git worktree, creates a local branch and commit, and returns the branch, commit, and resulting repository path.

## Explicitly Out of Scope

- Editing, deleting, or superseding existing published knowledge.
- Merging into `master`; a human performs the subsequent Git integration.
- Remote pull requests, GitHub/GitLab APIs, authentication/RBAC, and concurrent-edit conflict resolution.
- Treating KCR storage, a graph, or a vector index as a System of Record.

## Domain Model

`KnowledgeChangeRequest` is a workflow record, not corporate knowledge. It contains:

- immutable identifier and creation timestamp;
- requested category, title, key/slug, Markdown body, and OKF metadata;
- author identity supplied by the caller;
- lifecycle status: `DRAFT`, `REVIEWED`, `APPROVED`, or `PUBLISHED`;
- review events with reviewer, action, comment, and timestamp;
- optional publication result: branch, commit, source revision, and target path.

The KCR's document payload must validate against the existing `KnowledgeItem`/OKF schema before review and again immediately before publication. Its target path is deterministic from category and slug, preventing path traversal and duplicate output paths.

## Lifecycle and Governance

1. A caller creates a KCR in `DRAFT` with a new document and the Git revision on which it is based.
2. A human records `REVIEW`, moving it to `REVIEWED`, with a reviewer and optional comment.
3. A human records `APPROVE`, moving it to `APPROVED`.
4. Only an approved KCR can be published. Publication creates a branch from the pinned base revision, writes the new Markdown file, and commits it. On success the KCR becomes `PUBLISHED`.

Invalid transitions return a stable conflict error. A KCR cannot be published twice. Approval does not change the published Knowledge Base by itself.

## Git and System-of-Record Boundaries

The existing Architecture Wiki + OKF Git repository remains authoritative. KCR state is operational workflow state only and is not retrieved as corporate evidence. The existing Git knowledge reader continues to retrieve only the revision explicitly selected by an analysis.

Publishing uses the current local worktree mechanism extended with a narrowly scoped method for writing one knowledge document. It stages and commits only the requested document rather than every modified file in the isolated worktree. The returned commit becomes available to analysis only if a user deliberately chooses that revision or after normal human Git integration.

## API, CLI, and Web

All interfaces call the same application service and share the same request/response contracts.

- API routes expose create, list, get, review, approve, and publish operations below `/knowledge-change-requests`.
- CLI exposes matching commands and prints identifiers, lifecycle status, and publication details in a scriptable form.
- Web adds a compact KCR workspace: list proposals, create a proposal from an OKF-aware form, inspect its document and review history, and show Review, Approve, and Publish actions only when the current lifecycle allows them.

The Web UI has no direct file editor for approved repository content. It creates proposals and shows server-side validation feedback.

## Errors and Validation

- Invalid fields, unsupported category, invalid revision, duplicate target path, or invalid OKF metadata: HTTP 400 with a stable machine-readable code.
- Missing KCR: HTTP 404.
- Illegal lifecycle transition or attempted republish: HTTP 409.
- Git/worktree/commit failure: HTTP 500 with a safe message and a stable publication error code; the KCR remains `APPROVED` for a retry after the underlying issue is resolved.

No LLM output becomes a standard or approved knowledge merely by being generated. Any AI-created content is a `DRAFT` KCR and requires the same human governance.

## Testing

- Domain/application tests cover schema validation, allowed and forbidden transitions, deterministic target paths, and publication gating.
- Governance tests confirm that publication creates an isolated branch/commit and stages only the target knowledge file.
- API tests cover success and stable 400/404/409/500 contracts.
- CLI tests cover matching calls and output.
- Web DOM tests cover creating a draft, reviewing, approving, publishing, validation feedback, and action visibility by state.

## Acceptance Criteria

1. A caller can create a valid `DRAFT` proposal for a new knowledge document through Web, API, or CLI.
2. The same proposal can be reviewed and approved only through valid human-governed transitions.
3. Publishing an approved proposal produces exactly one local isolated Git branch and commit containing the validated Markdown/OKF document.
4. The change does not become retrievable corporate evidence until its Git revision is deliberately selected or integrated.
5. Invalid metadata and invalid transitions are rejected with the specified stable contracts.
6. Automated tests demonstrate the lifecycle across domain, API, CLI, governance, and Web boundaries.
