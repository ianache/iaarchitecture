import type { AnalysisResult, ArchitectureDecision, TraceLink } from "@architecture-ai/domain";
import { DecisionReview } from "./DecisionReview.js";
import { PackageOverview } from "./PackageOverview.js";
import { Traceability } from "./Traceability.js";

export function AnalysisDetail({ id, result, decisions, links, audit, onBack, onGenerate, onRegenerate, onPublish, onReview }: { id: string; result: AnalysisResult; decisions: ArchitectureDecision[]; links: TraceLink[]; audit: unknown[]; onBack: () => void; onGenerate: () => void; onRegenerate?: () => void; onPublish: () => void; onReview: (id: string, action: "review" | "approve" | "reject" | "request-changes") => void }) {
  const regenerationRequired = result.packageStatus.diagnostics?.some((diagnostic) => diagnostic.startsWith("Regeneration required:"));
  return <main><header className="page-heading"><div><h1>Architecture Package: {id}</h1><p>Read-only analysis detail</p></div><div><button onClick={onBack}>Back</button><button onClick={onGenerate}>Generate package</button>{regenerationRequired && onRegenerate && <button onClick={onRegenerate}>Regenerate architecture</button>}<button onClick={onPublish} disabled={result.packageStatus.value !== "APPROVED"} title={result.packageStatus.value !== "APPROVED" ? "Approve all significant decisions before publishing" : undefined}>Publish reviewed package</button></div></header><PackageOverview result={result} onTraceability={() => document.getElementById("traceability")?.scrollIntoView()} /><DecisionReview decisions={decisions} onAction={onReview} /><section><h2>Governance audit</h2><p>{audit.length} review events</p></section><div id="traceability"><Traceability links={links} /></div></main>;
}
