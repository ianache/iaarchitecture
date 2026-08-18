import type { AnalysisResult, ArchitectureDecision, TraceLink } from "@architecture-ai/domain";
import { DecisionReview } from "./DecisionReview.js";
import { PackageOverview } from "./PackageOverview.js";
import { Traceability } from "./Traceability.js";

export function AnalysisDetail({ id, result, decisions, links, audit, onBack, onGenerate, onRegenerate, onPublish, onReview }: { id: string; result: AnalysisResult; decisions: ArchitectureDecision[]; links: TraceLink[]; audit: unknown[]; onBack: () => void; onGenerate: () => void; onRegenerate?: () => void; onPublish: () => void; onReview: (id: string, action: "review" | "approve" | "reject" | "request-changes") => void }) {
  const regenerationRequired = result.packageStatus.diagnostics?.some((diagnostic) => diagnostic.startsWith("Regeneration required:"));
  return (
    <main>
      <header className="view-header">
        <div>
          <h1 className="view-title" style={{ fontSize: 30 }}>Architecture Package: {id}</h1>
          <p className="view-subtitle">Read-only analysis detail</p>
        </div>
        <div className="view-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>Back</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onGenerate}>Generate package</button>
          {regenerationRequired && onRegenerate && <button type="button" className="btn btn-ghost btn-sm" onClick={onRegenerate}>Regenerate architecture</button>}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onPublish}
            disabled={result.packageStatus.value !== "APPROVED"}
            title={result.packageStatus.value !== "APPROVED" ? "Approve all significant decisions before publishing" : undefined}
          >
            Publish reviewed package
          </button>
        </div>
      </header>
      <div className="stack-gap" style={{ gap: 24 }}>
        <PackageOverview result={result} onTraceability={() => document.getElementById("traceability")?.scrollIntoView()} />
        <DecisionReview decisions={decisions} onAction={onReview} />
        <section className="card">
          <h2 className="card-title">Governance audit</h2>
          <p>{audit.length} review events</p>
        </section>
        <div id="traceability"><Traceability links={links} /></div>
      </div>
    </main>
  );
}
