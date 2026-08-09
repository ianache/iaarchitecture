# Architecture AI MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal vertical slice that turns a PRD/user-story input into a traceable Application/Data/Integration Architecture Package, supports decision-level human review, and prepares an isolated Git branch/PR.

**Architecture:** Use a TypeScript modular monolith with shared application services consumed by a Fastify HTTP API, Commander CLI, and React web UI. Keep Git Markdown/OKF as the source of truth; implement graph, vector, LLM, and Git integrations behind ports so projections and providers are replaceable and reproducible from a pinned Git revision.

**Tech Stack:** pnpm workspace, Node.js 22+, TypeScript, Fastify, Zod, SQLite with FTS5, Vitest, Commander, React/Vite, Mermaid, and the Git CLI. LLM and embedding access use injected provider adapters; tests use deterministic fixtures.

## Global Constraints

- Git plus Markdown/OKF is the System of Record.
- The web UI, API, and CLI use the same backend capabilities.
- Corporate knowledge takes precedence over parametric model knowledge.
- Missing or conflicting evidence must be explicit; it cannot become an approved corporate fact silently.
- Security and Infrastructure output is minimum gap/risk/recommendation analysis in this slice.
- Significant decisions require human approval before promotion to corporate knowledge.
- Every generated claim and decision must retain traceability to requirements, evidence, and artifacts.
- Do not implement multi-agent orchestration, knowledge-authoring UI, broad wiki migration, real-time collaboration, or autonomous approval.
- All generated package output is created from a pinned knowledge-repository revision.

---

## File and module map

Create these boundaries before feature work:

```text
apps/api/src/                 HTTP routes and server composition
apps/cli/src/                 CLI commands; no domain logic
apps/web/src/                 React screens and API client
packages/domain/src/          entities, enums, ports, validation schemas
packages/knowledge/src/       Markdown/OKF parser and repository reader
packages/retrieval/src/       graph/vector projections and retrieval service
packages/orchestrator/src/    workflow, Skills, evidence policy
packages/artifacts/src/       Markdown, ADR, Mermaid, JSON renderers
packages/governance/src/      review state, audit events, Git workspace
packages/test-fixtures/       deterministic corpus, model, and scenario data
knowledge/                    curated MVP corpus
ontology/                     minimum architecture ontology
tests/e2e/                    vertical-slice tests
```

`packages/domain` owns public contracts. Other packages depend on those contracts rather than importing implementation details from each other.

## Task 1: Establish the workspace and domain contracts

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`
- Create: `packages/domain/src/types.ts`
- Create: `packages/domain/src/schemas.ts`
- Create: `packages/domain/src/ports.ts`
- Create: `packages/domain/src/index.ts`
- Test: `packages/domain/src/schemas.test.ts`

**Interfaces:**
- Produce `Requirement`, `ArchitectureDriver`, `KnowledgeItem`, `Evidence`, `Recommendation`, `ArchitectureDecision`, `TraceLink`, `ArchitectureArtifact`, `Review`, and `PackageStatus` types.
- Produce `AnalysisRequest`, `SkillInput`, and `SkillOutput` types.
- Produce ports `KnowledgeSource`, `EvidenceRetriever`, `ArchitectureModel`, `PackageRenderer`, `ReviewRepository`, and `GitWorkspace`.

- [ ] **Step 1: Write failing schema tests** for valid requirements, lifecycle/type enums, trace links, and rejection of missing stable IDs.
- [ ] **Step 2: Run `pnpm vitest packages/domain/src/schemas.test.ts`** and verify failures come from missing schemas.
- [ ] **Step 3: Implement Zod schemas and inferred TypeScript types.** Use discriminated unions for `FACT`, `STANDARD`, `RECOMMENDATION`, `DECISION`, and `EXCEPTION`, and for `DRAFT`, `REVIEWED`, and `APPROVED`.
- [ ] **Step 4: Implement the ports** with method signatures such as:

```ts
interface EvidenceRetriever {
  retrieve(input: RetrieveInput): Promise<RetrievedEvidence[]>;
}

interface ArchitectureModel {
  complete(input: ModelRequest): Promise<ModelResponse>;
}
```

- [ ] **Step 5: Run the focused tests and `pnpm tsc -b`**; confirm the domain package has no runtime dependencies.
- [ ] **Step 6: Commit** with `git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore packages/domain && git commit -m "feat: establish Architecture AI domain contracts"`.

## Task 2: Implement the Git knowledge corpus and OKF/ontology parser

**Files:**
- Create: `knowledge/principles/PR-001-evidence-first.md`
- Create: `knowledge/standards/ST-001-api-contracts.md`
- Create: `knowledge/patterns/PT-001-transactional-outbox.md`
- Create: `knowledge/anti-patterns/AP-001-shared-database.md`
- Create: `knowledge/technologies/TECH-001-postgresql.md`
- Create: `knowledge/nfr/NFR-001-availability.md`
- Create: `knowledge/adrs/ADR-001-integration-contracts.md`
- Create: `knowledge/guidelines/G-001-traceable-decisions.md`
- Create: `ontology/architecture-ontology.yaml`
- Create: `packages/knowledge/src/frontmatter.ts`
- Create: `packages/knowledge/src/git-repository.ts`
- Create: `packages/knowledge/src/ontology.ts`
- Create: `packages/knowledge/src/index.ts`
- Test: `packages/knowledge/src/frontmatter.test.ts`
- Test: `packages/knowledge/src/git-repository.test.ts`

**Interfaces:**
- Implement `KnowledgeSource.readRevision(revision): Promise<KnowledgeSnapshot>`.
- Implement `parseKnowledgeDocument(markdown, path): KnowledgeItem`.
- Implement `loadOntology(yaml): ArchitectureOntology`.

- [ ] **Step 1: Add the curated corpus** with valid metadata and explicit relationships; include at least one item of each required knowledge type and lifecycle status.
- [ ] **Step 2: Write failing parser tests** for valid frontmatter, invalid type/status, missing ID, and revision capture.
- [ ] **Step 3: Run the focused tests** and verify failure.
- [ ] **Step 4: Implement frontmatter parsing and Zod validation.** Preserve the file path, Git revision, source excerpt, and metadata in the parsed item.
- [ ] **Step 5: Implement repository reading** using the Git CLI with an explicit revision and path allowlist; reject unresolved revisions rather than falling back to the working tree.
- [ ] **Step 6: Parse the minimum ontology** and validate that referenced entity kinds are known.
- [ ] **Step 7: Run parser tests and commit** with `git add knowledge ontology packages/knowledge && git commit -m "feat: add Git knowledge corpus and OKF parser"`.

## Task 3: Build reproducible graph, vector, and evidence retrieval projections

**Files:**
- Create: `packages/retrieval/src/sqlite.ts`
- Create: `packages/retrieval/src/graph-projection.ts`
- Create: `packages/retrieval/src/vector-projection.ts`
- Create: `packages/retrieval/src/retrieval-service.ts`
- Create: `packages/retrieval/src/index.ts`
- Test: `packages/retrieval/src/retrieval-service.test.ts`

**Interfaces:**
- Implement `buildProjections(snapshot): Promise<ProjectionRevision>`.
- Implement `EvidenceRetriever.retrieve({query, domains, types, revision, limit})`.
- Return every result with `knowledgeId`, `path`, `revision`, `classification`, matched text, and retrieval method.

- [ ] **Step 1: Write failing tests** for metadata filtering, full-text retrieval, relationship traversal, evidence precedence, and revision mismatch rejection.
- [ ] **Step 2: Run tests** and confirm the projection service is absent.
- [ ] **Step 3: Create SQLite tables** for knowledge items, relationships, searchable text, and deterministic embedding vectors; enable FTS5 for local semantic-like fallback.
- [ ] **Step 4: Implement graph projection** from explicit metadata relationships.
- [ ] **Step 5: Implement vector projection behind an `EmbeddingProvider` port.** Use deterministic fixture embeddings in tests and allow an external provider in runtime configuration.
- [ ] **Step 6: Implement combined retrieval** in this order: metadata filters, full text, graph neighbors, vector similarity; deduplicate and rank approved over reviewed over draft.
- [ ] **Step 7: Add conflict reporting** when multiple applicable standards or principles disagree.
- [ ] **Step 8: Run focused tests and commit** with `git add packages/retrieval && git commit -m "feat: add reproducible knowledge projections"`.

## Task 4: Implement requirements, traceability, and evidence policy

**Files:**
- Create: `packages/orchestrator/src/requirements.ts`
- Create: `packages/orchestrator/src/traceability.ts`
- Create: `packages/orchestrator/src/evidence-policy.ts`
- Create: `packages/orchestrator/src/index.ts`
- Test: `packages/orchestrator/src/traceability.test.ts`
- Test: `packages/orchestrator/src/evidence-policy.test.ts`

**Interfaces:**
- Implement `normalizeRequirements(raw): Requirement[]`.
- Implement `TraceabilityStore.addLink(link): void`, `TraceabilityStore.requireCompleteChain(): void`, and `TraceabilityStore.toContextJson(): ArchitectureContext`.
- Implement `classifyEvidence(evidence): EvidenceClassification`.

- [ ] **Step 1: Write failing tests** for stable requirement IDs, complete and incomplete chains, pinned revisions, and model-only suggestions classified as `RECOMMENDATION`.
- [ ] **Step 2: Run tests** and confirm failures.
- [ ] **Step 3: Implement deterministic requirement normalization** using source IDs when present and stable content hashes otherwise.
- [ ] **Step 4: Implement trace-link validation** for the required chain from Requirement through Artifact; throw a typed error for missing links.
- [ ] **Step 5: Implement evidence policy** so approved/reviewed/draft corporate evidence outranks external/model suggestions and conflicts remain visible.
- [ ] **Step 6: Run focused tests and commit** with `git add packages/orchestrator && git commit -m "feat: enforce evidence and architecture traceability"`.

## Task 5: Implement the single Architecture Orchestrator and Skills

**Files:**
- Create: `packages/orchestrator/src/orchestrator.ts`
- Create: `packages/orchestrator/src/skills/analyze-requirements.ts`
- Create: `packages/orchestrator/src/skills/identify-drivers.ts`
- Create: `packages/orchestrator/src/skills/architecture-impact.ts`
- Create: `packages/orchestrator/src/skills/design-application.ts`
- Create: `packages/orchestrator/src/skills/design-data.ts`
- Create: `packages/orchestrator/src/skills/design-integration.ts`
- Create: `packages/orchestrator/src/skills/design-security.ts`
- Create: `packages/orchestrator/src/skills/design-infrastructure.ts`
- Create: `packages/orchestrator/src/skills/validate-nfr.ts`
- Create: `packages/orchestrator/src/skills/validate-standards.ts`
- Create: `packages/orchestrator/src/skills/architecture-review.ts`
- Test: `packages/orchestrator/src/orchestrator.test.ts`

**Interfaces:**
- Implement `ArchitectureOrchestrator.run(request): Promise<AnalysisResult>`.
- Each Skill implements `run(input: SkillInput): Promise<SkillOutput>`.

- [ ] **Step 1: Write a failing orchestration test** using fixture requirements, fixture evidence, and a deterministic model; assert stage order and trace links.
- [ ] **Step 2: Run the test** and verify the orchestrator is absent.
- [ ] **Step 3: Implement the orchestrator pipeline** in the approved order; pass one shared context object between Skills and retain stage results.
- [ ] **Step 4: Implement Application, Data, and Integration Skills** using retrieved evidence and deterministic model prompts.
- [ ] **Step 5: Implement Security and Infrastructure Skills** to return explicit gaps, assumptions, risks, and recommendations without pretending to produce complete designs.
- [ ] **Step 6: Implement NFR and standards validation** with source references and conflict findings.
- [ ] **Step 7: Implement review preparation** to mark significant decisions and identify required human approvals; do not approve automatically.
- [ ] **Step 8: Add typed incomplete-result handling** for missing Git revision, invalid metadata, evidence conflict, missing trace link, or failed stage.
- [ ] **Step 9: Run focused tests and commit** with `git add packages/orchestrator && git commit -m "feat: add Architecture AI orchestration workflow"`.

## Task 6: Generate the Architecture Package and diagrams

**Files:**
- Create: `packages/artifacts/src/markdown-renderer.ts`
- Create: `packages/artifacts/src/json-renderer.ts`
- Create: `packages/artifacts/src/adr-renderer.ts`
- Create: `packages/artifacts/src/mermaid-renderer.ts`
- Create: `packages/artifacts/src/package-renderer.ts`
- Create: `packages/artifacts/src/index.ts`
- Test: `packages/artifacts/src/package-renderer.test.ts`

**Interfaces:**
- Implement `renderPackage(result, outputDirectory): Promise<ArchitecturePackage>`.
- Renderers consume only `AnalysisResult` and `ArchitectureContext`; they do not call the model or retrieval services.

- [ ] **Step 1: Write golden-file tests** asserting all required files, traceability tables, evidence references, explicit Security/Infrastructure gaps, ADRs for significant decisions, and three Mermaid diagrams.
- [ ] **Step 2: Run tests** and verify missing renderer failures.
- [ ] **Step 3: Implement the eight numbered Markdown documents** with stable section headings and source/decision references.
- [ ] **Step 4: Implement `architecture-context.json`** from the validated traceability context, including Git revision and package status.
- [ ] **Step 5: Implement ADR rendering** only for decisions marked significant.
- [ ] **Step 6: Implement C4/Mermaid rendering** with element and decision IDs embedded in comments or labels.
- [ ] **Step 7: Run golden-file tests and commit** with `git add packages/artifacts && git commit -m "feat: generate traceable architecture packages"`.

## Task 7: Implement governance, audit history, and isolated Git output

**Files:**
- Create: `packages/governance/src/review-service.ts`
- Create: `packages/governance/src/audit-log.ts`
- Create: `packages/governance/src/git-workspace.ts`
- Create: `packages/governance/src/index.ts`
- Test: `packages/governance/src/review-service.test.ts`
- Test: `packages/governance/src/git-workspace.test.ts`

**Interfaces:**
- Implement `ReviewService.approveDecision`, `.rejectDecision`, and `.requestChanges`.
- Implement `GitWorkspace.createBranch`, `.writePackage`, and `.prepareReview`.

- [ ] **Step 1: Write failing tests** for decision-level transitions, reviewer identity, audit events, package-status derivation, and rejection of approval for incomplete evidence.
- [ ] **Step 2: Run tests** and verify failures.
- [ ] **Step 3: Implement review persistence** in SQLite with append-only audit events.
- [ ] **Step 4: Implement lifecycle rules** for `DRAFT -> REVIEWED -> APPROVED`; reject invalid transitions and automatic approval.
- [ ] **Step 5: Implement isolated Git workspace creation** with a validated repository path, generated branch name, pinned source revision, and package output directory.
- [ ] **Step 6: Implement review preparation** that records commit/PR metadata without merging into the main branch.
- [ ] **Step 7: Run focused tests and commit** with `git add packages/governance && git commit -m "feat: add human decision governance and Git review output"`.

## Task 8: Expose shared capabilities through the API and CLI

**Files:**
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/routes/analyses.ts`
- Create: `apps/api/src/routes/packages.ts`
- Create: `apps/api/src/routes/reviews.ts`
- Create: `apps/api/src/routes/knowledge.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/cli/src/main.ts`
- Create: `apps/cli/src/commands/analyze.ts`
- Create: `apps/cli/src/commands/package.ts`
- Create: `apps/cli/src/commands/review.ts`
- Test: `apps/api/src/routes.test.ts`
- Test: `apps/cli/src/commands.test.ts`

**Interfaces:**
- API endpoints: `POST /analyses`, `GET /analyses/:id`, `GET /packages/:id`, `GET /packages/:id/traceability`, `GET /packages/:id/decisions`, `POST /decisions/:id/approve`, `POST /decisions/:id/reject`, and `POST /decisions/:id/request-changes`.
- CLI commands: `architecture-ai analyze`, `architecture-ai package`, and `architecture-ai review`.

- [ ] **Step 1: Write contract tests** for JSON request/response schemas and equivalent API/CLI behavior.
- [ ] **Step 2: Run tests** and verify routes/commands are absent.
- [ ] **Step 3: Implement application composition** so every route and command receives the same orchestrator, retrieval, artifact, and governance services.
- [ ] **Step 4: Implement route validation** with Zod and stable error codes for incomplete generation, missing evidence, invalid review transition, and unknown IDs.
- [ ] **Step 5: Implement CLI commands** as thin HTTP/application-service clients; keep no domain decisions in CLI code.
- [ ] **Step 6: Run API, CLI, and contract tests and commit** with `git add apps package.json && git commit -m "feat: expose shared Architecture AI workflow interfaces"`.

## Task 9: Build the minimal human review web UI

**Files:**
- Create: `apps/web/src/api/client.ts`
- Create: `apps/web/src/pages/SubmitRequirements.tsx`
- Create: `apps/web/src/pages/PackageOverview.tsx`
- Create: `apps/web/src/pages/Traceability.tsx`
- Create: `apps/web/src/pages/DecisionReview.tsx`
- Create: `apps/web/src/components/DecisionCard.tsx`
- Create: `apps/web/src/components/TraceabilityTable.tsx`
- Create: `apps/web/src/App.tsx`
- Test: `apps/web/src/DecisionReview.test.tsx`

**Interfaces:**
- Consume only the API contracts from Task 8.
- Actions must call the same decision endpoints as the CLI.

- [ ] **Step 1: Write component tests** for requirements submission, evidence display, traceability navigation, and approve/reject/request-changes actions.
- [ ] **Step 2: Run tests** and verify missing UI components.
- [ ] **Step 3: Implement the submission page** with raw PRD/user-story input and analysis creation.
- [ ] **Step 4: Implement package overview and artifact navigation** including package status and Git review destination.
- [ ] **Step 5: Implement traceability and decision review** showing evidence source, pinned revision, rationale, risks, impacted artifacts, and lifecycle status.
- [ ] **Step 6: Implement explicit incomplete/conflict states**; do not hide missing evidence behind empty UI sections.
- [ ] **Step 7: Run UI tests and commit** with `git add apps/web && git commit -m "feat: add human architecture review UI"`.

## Task 10: Prove the complete vertical slice

**Files:**
- Create: `packages/test-fixtures/reference-scenario.ts`
- Create: `packages/test-fixtures/deterministic-model.ts`
- Create: `tests/e2e/architecture-package.test.ts`
- Create: `tests/e2e/governance.test.ts`
- Create: `README.md`
- Create: `.env.example`

- [ ] **Step 1: Create deterministic reference requirements** for order management or customer onboarding, including functional requirements, integration needs, data concerns, availability, and explicit security/infrastructure gaps.
- [ ] **Step 2: Create deterministic model and embedding fixtures** that return stable output for tests without network access.
- [ ] **Step 3: Write the end-to-end test** from pinned Git corpus through orchestration, package generation, traceability validation, decision review, and isolated Git output.
- [ ] **Step 4: Write the governance test** proving model-only suggestions are `RECOMMENDATION`, cannot be approved without review, and do not enter the corporate corpus automatically.
- [ ] **Step 5: Run the complete suite** with `pnpm test` and `pnpm build`; fix failures without weakening the evidence policy.
- [ ] **Step 6: Document local setup, corpus layout, API/CLI examples, package output, and provider configuration in `README.md` and `.env.example`.
- [ ] **Step 7: Commit** with `git add . && git commit -m "test: verify Architecture AI vertical slice"`.

## Verification checklist

- [ ] `pnpm test` passes, including unit, contract, golden-file, and end-to-end tests.
- [ ] `pnpm build` passes for all workspace packages.
- [ ] A pinned Git revision is present in every retrieval result and generated context file.
- [ ] Every significant decision has evidence, a trace chain, and a human review status.
- [ ] Unsupported model knowledge is visible as a recommendation requiring review.
- [ ] Security and Infrastructure output contains explicit gap analysis.
- [ ] Web UI, API, and CLI use identical application services.
- [ ] Generated package contains all required documents, ADRs, diagrams, and JSON context.
- [ ] No generated package is merged into corporate knowledge automatically.

## Commit sequence

Use one focused commit at the end of each task. If a task is split during execution, preserve the same boundaries and keep each commit independently testable.
