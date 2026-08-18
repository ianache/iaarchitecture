import type { AnalysisSummary } from "@architecture-ai/domain";
import type { ApiClient } from "../api/client.js";
import { badgeClassName } from "../status.js";
import { NewAnalysisPanel } from "../components/NewAnalysisPanel.js";

export function AnalysisHistory({
  analyses,
  onSelect,
  onNewAnalysis,
  showNewAnalysisPanel,
  onCancelNewAnalysis,
  client,
  knowledgeRevision,
  onCreated
}: {
  analyses: AnalysisSummary[];
  onSelect: (id: string) => void;
  onNewAnalysis: () => void;
  showNewAnalysisPanel?: boolean;
  onCancelNewAnalysis?: () => void;
  client?: ApiClient;
  knowledgeRevision?: string;
  onCreated?: (id: string) => void;
}) {
  return (
    <main>
      <header className="view-header">
        <div>
          <h1 className="view-title">Architecture AI</h1>
          <p className="view-subtitle">Analysis history</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onNewAnalysis}>New analysis</button>
      </header>
      {showNewAnalysisPanel && client && onCreated && (
        <NewAnalysisPanel
          client={client}
          knowledgeRevision={knowledgeRevision ?? "HEAD"}
          onCreated={onCreated}
          onCancel={onCancelNewAnalysis ?? (() => undefined)}
        />
      )}
      <section className="card">
        <h2 className="card-title">Analyses</h2>
        {analyses.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr><th>Id</th><th>Status</th><th>Knowledge revision</th><th>Updated</th><th>Action</th></tr>
            </thead>
            <tbody>
              {analyses.map((analysis) => (
                <tr key={analysis.id}>
                  <td className="id-cell">{analysis.id}</td>
                  <td><span className={badgeClassName(analysis.status)}>{analysis.status}</span></td>
                  <td className="mono muted-cell">{analysis.knowledgeRevision}</td>
                  <td className="muted-cell">{analysis.updatedAt}</td>
                  <td><button type="button" className="action-link" onClick={() => onSelect(analysis.id)}>Select</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="empty-state">No analyses yet.</p>}
      </section>
    </main>
  );
}
