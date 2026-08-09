# Architecture AI MVP

Architecture AI turns a PRD or user stories into an evidence-constrained, traceable Architecture Package. Git Markdown/OKF and the ontology are the System of Record; graph and vector retrieval are derived projections.

## Local workflow

```powershell
pnpm install
node_modules\.bin\vitest.cmd run --run
node_modules\.bin\tsc.cmd -b
```

The curated corpus is under `knowledge/` and the minimum ontology is under `ontology/`. All analysis requests must provide a Git revision. Generated packages contain the numbered Markdown artifacts, ADRs, Mermaid diagrams, and `architecture-context.json`.

The API exposes `POST /analyses`, package/traceability reads, and review queue reads. The CLI exposes `architecture-ai analyze`, `architecture-ai package`, and `architecture-ai review`. The web surface is a thin human review client over the same backend capabilities.

Model-only suggestions are classified as recommendations requiring review. They cannot silently become corporate facts or approved decisions.
