# Architecture AI MVP Design

Date: 2026-08-08
Status: Approved design; implementation not started

## 1. Product objective

Architecture AI is an AI-assisted enterprise architecture platform in which humans and AI agents design from the same corporate Architecture Knowledge Base. The MVP tests organizational architecture consistency, not merely diagram generation.

The proving journey is:

```text
PRD/user stories
  -> traceable architecture analysis
  -> human review of significant decisions
  -> reviewable Git branch/PR
```

The reference scenario is a representative order-management or customer-onboarding capability using realistic synthetic requirements and knowledge.

## 2. MVP scope

The MVP is a vertical slice covering:

- Raw PRD/user-story ingestion.
- Stable requirement identifiers.
- Architecture-driver identification.
- Retrieval of versioned corporate knowledge.
- Application, Data, and Integration architecture design.
- Minimum Security and Infrastructure analysis that reports gaps, risks, assumptions, and recommendations.
- NFR and standards validation.
- Traceability from requirements to artifacts.
- Generation of a versionable Architecture Package, ADRs, and C4/Mermaid diagrams.
- Decision-level human review and approval.
- Isolated Git branch/workspace output for a reviewable commit or PR.
- Web UI and API/CLI over exactly the same backend capabilities.

The MVP does not include multi-agent orchestration, knowledge-authoring UI, broad wiki migration, real-time collaboration, arbitrary diagram editing, autonomous approval, or a production-grade event-driven projection platform.

## 3. System architecture

Use an evidence-first modular monolith with one shared application backend.

```text
Web UI -------┐
              ├─ Shared API/Application Services
API/CLI ------┘
                       |
              Architecture Orchestrator
                       |
        +--------------+--------------+
        |              |              |
     Skills       Knowledge       Governance
                  Services        Services
        |              |              |
        +--------------+--------------+
                       |
       Git: Markdown + OKF + Ontology (System of Record)
                       |
             Derived Graph / Vector Projections
```

Core modules are Requirements, Knowledge, Retrieval, Orchestration, Traceability, Artifact Generation, Governance, Git Integration, and Interfaces.

The ontology, graph, and vector store are exposed behind stable interfaces. Their projections may be rebuilt from a pinned Git revision; the MVP does not require distributed event processing.

## 4. Knowledge architecture

The Architecture Wiki plus Google OKF 0.2 repository is the sole System of Record. Markdown is human-readable; OKF metadata is machine-readable; the ontology defines architecture semantics.

Suggested repository areas:

```text
knowledge/
  principles/ standards/ patterns/ anti-patterns/
  reference-architectures/ technologies/ nfr/
  adrs/ risks/ lessons-learned/ guidelines/
ontology/
  architecture-ontology.yaml
```

Each knowledge item has stable identity, title, knowledge type, lifecycle status, scope/domain, tags, relationships, ownership/review metadata, provenance, and effective version.

The minimum ontology covers requirements, architecture drivers, concerns/domains, knowledge items, technologies, systems, interfaces, data stores, quality attributes, recommendations, decisions, exceptions, risks, and artifacts.

The Knowledge Graph materializes explicit entities and relationships. The Vector Store retrieves relevant passages and documents. Every retrieval result includes source identity and repository version.

Retrieval combines metadata filters, full-text search, graph traversal, and semantic similarity.

Evidence precedence is:

1. Approved corporate knowledge.
2. Reviewed corporate knowledge.
3. Draft corporate knowledge, clearly labeled.
4. External or model-generated suggestions, classified as recommendations requiring review.

Conflicting evidence is surfaced with its sources; it is not hidden or silently resolved without an explicit policy.

## 5. Orchestration and Skills

One Architecture Orchestrator executes a staged workflow:

1. Ingest and identify requirements.
2. Analyze requirements.
3. Identify architecture drivers.
4. Retrieve versioned context.
5. Analyze architecture impacts.
6. Design Application, Data, and Integration architecture.
7. Run minimum Security and Infrastructure checks.
8. Validate NFRs and standards.
9. Generate risks, tradeoffs, and significant ADRs.
10. Generate diagrams.
11. Build traceability context.
12. Render the Architecture Package.
13. Open human review.

The Skills are analyze-requirements, retrieve-context, identify-architecture-drivers, architecture-impact-analysis, design-application-architecture, design-data-architecture, design-security-architecture, design-infrastructure-architecture, validate-nfr, validate-standards, generate-diagrams, generate-adr, and architecture-review.

Each Skill receives requirements, current context, retrieved evidence, prior decisions, and traceability state; it returns findings, recommendations, decisions, evidence references, risks, unresolved questions, and artifact fragments.

Corporate evidence constrains the output. Parametric model knowledge may suggest an option but may never silently become a corporate fact, standard, or approved decision.

Generation fails visibly for an unresolved Git revision, invalid required metadata, unresolvable evidence conflict, missing required trace links, or inconsistent artifact generation. Partial output is permitted only with an explicit `INCOMPLETE` status and explanation.

## 6. Canonical model and traceability

The shared canonical entities are Requirement, ArchitectureDriver, KnowledgeItem, Recommendation, ArchitectureDecision, ArchitectureArtifact, TraceLink, and Review.

The mandatory traceability chain is:

```text
Requirement
  -> Architecture Driver
  -> Retrieved Knowledge
  -> Standard / Principle / Pattern / ADR
  -> Recommendation
  -> Architecture Decision
  -> Architecture Artifact
```

Each claim and decision carries stable identifiers, source requirements, supporting knowledge IDs, repository revision, knowledge classification, lifecycle status, and an explanation for insufficient or conflicting evidence.

Traceability is stored in `architecture-context.json` and represented in Markdown with references and tables. Diagrams reference the architecture elements and decisions they depict.

Formal ADRs are generated only for significant decisions, such as security impact, production data ownership, external integration contracts, major technology choices, or material NFR tradeoffs.

## 7. Architecture Package and interfaces

```text
architecture-package/
  01-architecture-analysis.md
  02-architecture-drivers.md
  03-solution-architecture.md
  04-data-architecture.md
  05-security-architecture.md
  06-infrastructure-architecture.md
  07-compliance-report.md
  08-risks-tradeoffs.md
  09-adr/
    ADR-001-*.md
  architecture-context.json
  diagrams/
    system-context.mmd
    container-diagram.mmd
    integration-view.mmd
```

The shared backend supports creating an analysis, retrieving package status and artifacts, retrieving traceability links, listing decisions for review, approving/rejecting/requesting changes, exporting or preparing the Git branch/PR, and rebuilding projections.

The API/CLI uses stable identifiers and machine-readable JSON. The CLI has no separate architecture logic.

The minimal web UI supports requirements submission, generation status, package navigation, traceability, decision review, evidence/rationale/risk inspection, approval actions, and Git review status. It does not provide knowledge authoring, graph exploration, diagram editing, or a general-purpose chat interface.

## 8. Governance and lifecycle

Knowledge and generated decisions use the types FACT, STANDARD, RECOMMENDATION, DECISION, and EXCEPTION. Lifecycle states are DRAFT, REVIEWED, and APPROVED.

AI can analyze, recommend, design, and validate. Humans govern significant decisions.

Packages start as `DRAFT`. Decisions are reviewed independently. Rejected or changed decisions create a new package revision or trigger regeneration. Only approved decisions are eligible for promotion through the Git review process. The package status is derived from required decision statuses, and all review actions are audit logged.

Generated packages are written to an isolated branch or workspace. Only the resulting reviewed and approved Git change becomes corporate knowledge.

## 9. Acceptance criteria

The vertical slice is successful when the reference scenario demonstrates that:

- Requirements, drivers, evidence, recommendations, decisions, and artifacts are linked.
- Application, Data, and Integration designs are generated.
- Security and Infrastructure gaps are explicit.
- All required documents, ADRs, diagrams, and JSON context are produced.
- Evidence is tied to a pinned Git revision.
- Insufficient evidence is explicitly classified as a recommendation requiring review.
- A human can approve or reject significant decisions independently.
- UI and API/CLI use the same backend services and produce equivalent results.
- Output is prepared on an isolated Git branch/workspace.
- No model-generated claim is silently represented as approved corporate knowledge.

Testing should include metadata/ontology/traceability/lifecycle unit tests, UI/API/CLI contract tests, retrieval tests against the curated corpus, end-to-end tests for the reference scenario, golden-file tests for generated artifacts, governance tests for unsupported knowledge, and failure tests for invalid metadata, missing evidence, conflicting standards, and incomplete generation.

## 10. Design principles

1. Git plus Markdown/OKF is the System of Record.
2. The ontology defines semantics; graph and vector indexes are derived projections.
3. The web UI, API, and CLI use the same backend capabilities.
4. Evidence and traceability are first-class output, not post-processing.
5. Corporate knowledge takes precedence over parametric model knowledge.
6. Human approval is required for significant architecture decisions.
7. The MVP proves one complete workflow before expanding breadth.
