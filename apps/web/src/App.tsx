import { useEffect, useMemo, useState, type ReactElement } from "react";
import type { AnalysisResult, AnalysisSummary, ArchitectureDecision, Review, TraceLink } from "@architecture-ai/domain";
import { createApiClient, type ApiClient } from "./api/client.js";
import { Sidebar } from "./components/Sidebar.js";
import { AnalysisDetail } from "./pages/AnalysisDetail.js";
import { AnalysisHistory } from "./pages/AnalysisHistory.js";
import { KnowledgeAuthoring } from "./pages/KnowledgeAuthoring.js";

export async function reviewDecisionAndReload({ client, decisionId, action, analysisId, load, setError }: { client: Pick<ApiClient, "reviewDecision">; decisionId: string; action: "review" | "approve" | "reject" | "request-changes"; analysisId: string; load: (id: string) => Promise<void>; setError: (error?: string) => void }) {
  try { setError(undefined); await client.reviewDecision(decisionId, action); await load(analysisId); } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
}
export async function publishPackageAndReport({ client, analysisId, setError }: { client: Pick<ApiClient, "publishPackage">; analysisId: string; setError: (error?: string) => void }) {
  try { setError(undefined); const result = await client.publishPackage(analysisId); setError(`Package published on ${result.branch}${result.commit ? ` at ${result.commit}` : ""}.`); } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
}

export function App() {
  const client = useMemo(() => createApiClient(import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000"), []);
  const [workspace, setWorkspace] = useState<"architecture" | "knowledge">("architecture");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [screen, setScreen] = useState<"history" | "detail">("history"); const [showNewAnalysisPanel, setShowNewAnalysisPanel] = useState(false); const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]); const [analysisId, setAnalysisId] = useState<string>(); const [packageData, setPackageData] = useState<AnalysisResult>(); const [decisions, setDecisions] = useState<ArchitectureDecision[]>([]); const [links, setLinks] = useState<TraceLink[]>([]); const [audit, setAudit] = useState<Review[]>([]); const [knowledgeRevision, setKnowledgeRevision] = useState("HEAD"); const [error, setError] = useState<string>();
  async function loadHistory() { try { setError(undefined); setAnalyses((await client.listAnalyses()).analyses); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } }
  async function load(id: string) { try { setError(undefined); const [result, decisionResponse, traceability] = await Promise.all([client.getPackage(id), client.getDecisions(id), client.getTraceability(id)]); const events = await Promise.all(decisionResponse.decisions.map((decision) => client.getAudit(decision.id))); setAnalysisId(id); setPackageData(result); setDecisions(decisionResponse.decisions); setLinks(traceability.links); setAudit(events.flatMap((entry) => entry.events)); setScreen("detail"); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } }
  useEffect(() => { void loadHistory(); }, []);
  useEffect(() => { client.listKnowledgeItems().then((res) => { if (res.revision) setKnowledgeRevision(res.revision); }).catch(() => undefined); }, [client]);
  const toggleTheme = () => setTheme((current) => (current === "light" ? "dark" : "light"));

  let content: ReactElement;
  if (workspace === "knowledge") content = <KnowledgeAuthoring client={client} onBack={() => setWorkspace("architecture")} />;
  else if (screen === "detail" && analysisId && packageData) content = <>{error && <p role="alert" className="alert">{error}</p>}<AnalysisDetail id={analysisId} result={packageData} decisions={decisions} links={links} audit={audit} onBack={() => { setScreen("history"); void loadHistory(); }} onGenerate={() => { void (async () => { try { setError(undefined); await client.generatePackage(analysisId); await load(analysisId); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } })(); }} onRegenerate={() => { void (async () => { try { setError(undefined); await client.regenerateAnalysis(analysisId); await load(analysisId); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } })(); }} onPublish={() => { void publishPackageAndReport({ client, analysisId, setError }); }} onReview={(id, action) => { void reviewDecisionAndReload({ client, decisionId: id, action, analysisId, load, setError }); }} /></>;
  else content = <>{error && <p role="alert" className="alert">{error}</p>}<AnalysisHistory analyses={analyses} onSelect={(id) => { void load(id); }} onNewAnalysis={() => { setError(undefined); setShowNewAnalysisPanel((v) => !v); }} showNewAnalysisPanel={showNewAnalysisPanel} onCancelNewAnalysis={() => setShowNewAnalysisPanel(false)} client={client} knowledgeRevision={knowledgeRevision} onCreated={(id) => { setShowNewAnalysisPanel(false); void load(id); }} /></>;

  return (
    <div className="app-shell" data-theme={theme}>
      <Sidebar
        active={workspace}
        theme={theme}
        knowledgeRevision={knowledgeRevision}
        onNavAnalyses={() => setWorkspace("architecture")}
        onNavKcr={() => setWorkspace("knowledge")}
        onToggleTheme={toggleTheme}
      />
      <div className="app-main">{content}</div>
    </div>
  );
}
