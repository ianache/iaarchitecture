import type { AnalysisResult } from "@architecture-ai/domain";
import { badgeClassName } from "../status.js";

export function PackageOverview({ result, onTraceability }: { result: AnalysisResult; onTraceability: () => void }) {
  return (
    <section className="card">
      <h2 className="card-title">Architecture Package</h2>
      <p>Status: <span className={badgeClassName(result.packageStatus.value)}>{result.packageStatus.value}</span></p>
      <p className="mono muted-cell">Knowledge revision: {result.context.revision}</p>
      <p>Findings: {result.findings.length}; Risks: {result.risks.length}</p>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onTraceability}>View traceability</button>
    </section>
  );
}
