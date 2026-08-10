import { useEffect, useMemo, useState } from "react";
import type { AnalysisResult, AnalysisSummary, ArchitectureDecision, TraceLink } from "@architecture-ai/domain";
import { createApiClient, type ApiClient } from "./api/client.js";
import { SubmitRequirements } from "./pages/SubmitRequirements.js";
import { AnalysisDetail } from "./pages/AnalysisDetail.js";
import { AnalysisHistory } from "./pages/AnalysisHistory.js";

export async function reviewDecisionAndReload({ client, decisionId, action, analysisId, load, setError }: { client: Pick<ApiClient, "reviewDecision">; decisionId: string; action: "approve" | "reject" | "request-changes"; analysisId: string; load: (id: string) => Promise<void>; setError: (error?: string) => void }) {
  try { setError(undefined); await client.reviewDecision(decisionId, action); await load(analysisId); } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
}

export function App() {
  const client = useMemo(() => createApiClient(import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000"), []);
  const [screen, setScreen] = useState<"history" | "new" | "detail">("history"); const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]); const [analysisId, setAnalysisId] = useState<string>(); const [packageData, setPackageData] = useState<AnalysisResult>(); const [decisions, setDecisions] = useState<ArchitectureDecision[]>([]); const [links, setLinks] = useState<TraceLink[]>([]); const [audit, setAudit] = useState<unknown[]>([]); const [error, setError] = useState<string>();
  async function loadHistory() { try { setError(undefined); setAnalyses((await client.listAnalyses()).analyses); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } }
  async function load(id: string) { try { setError(undefined); const [result, decisionResponse, traceability] = await Promise.all([client.getPackage(id), client.getDecisions(id), client.getTraceability(id)]); const events = await Promise.all(decisionResponse.decisions.map((decision: ArchitectureDecision) => client.getAudit(decision.id))); setAnalysisId(id); setPackageData(result); setDecisions(decisionResponse.decisions); setLinks(traceability.links); setAudit(events.flatMap((entry: { events: unknown[] }) => entry.events)); setScreen("detail"); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } }
  useEffect(() => { void loadHistory(); }, []);
  if (screen === "new") return <>{error && <p role="alert">{error}</p>}<SubmitRequirements client={client} onCreated={(id) => { void load(id); }} /></>;
  if (screen === "detail" && analysisId && packageData) return <>{error && <p role="alert">{error}</p>}<AnalysisDetail id={analysisId} result={packageData} decisions={decisions} links={links} audit={audit} onBack={() => { setScreen("history"); void loadHistory(); }} onGenerate={() => { void (async () => { try { setError(undefined); await client.generatePackage(analysisId); await load(analysisId); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } })(); }} onReview={(id, action) => { void reviewDecisionAndReload({ client, decisionId: id, action, analysisId, load, setError }); }} /></>;
  return <>{error && <main><p role="alert">{error}</p></main>}<AnalysisHistory analyses={analyses} onSelect={(id) => { void load(id); }} onNewAnalysis={() => { setError(undefined); setScreen("new"); }} /></>;
}
