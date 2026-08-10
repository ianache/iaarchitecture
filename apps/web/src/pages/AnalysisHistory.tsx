import type { AnalysisSummary } from "@architecture-ai/domain";

export function AnalysisHistory({ analyses, onSelect, onNewAnalysis }: { analyses: AnalysisSummary[]; onSelect: (id: string) => void; onNewAnalysis: () => void }) {
  return <main><header className="page-heading"><div><h1>Architecture AI</h1><p>Analysis history</p></div><button onClick={onNewAnalysis}>New analysis</button></header><section><h2>Analyses</h2><table><thead><tr><th>Id</th><th>Status</th><th>Knowledge revision</th><th>Updated</th><th>Action</th></tr></thead><tbody>{analyses.map((analysis) => <tr key={analysis.id}><td>{analysis.id}</td><td>{analysis.status}</td><td>{analysis.knowledgeRevision}</td><td>{analysis.updatedAt}</td><td><button onClick={() => onSelect(analysis.id)}>Select</button></td></tr>)}</tbody></table>{analyses.length === 0 && <p>No analyses yet.</p>}</section></main>;
}
