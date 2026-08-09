import { useMemo, useState } from "react";
import { createApiClient } from "./api/client.js";
import { SubmitRequirements } from "./pages/SubmitRequirements.js";
import { PackageOverview } from "./pages/PackageOverview.js";
import { DecisionReview } from "./pages/DecisionReview.js";
import { Traceability } from "./pages/Traceability.js";
export function App() {
  const client = useMemo(() => createApiClient(import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000"), []);
  const [analysisId, setAnalysisId] = useState<string>(); const [packageData, setPackageData] = useState<any>(); const [decisions, setDecisions] = useState<any[]>([]); const [links, setLinks] = useState<any[]>([]); const [error, setError] = useState<string>();
  async function load(id: string) { try { setAnalysisId(id); setPackageData(await client.getPackage(id)); setDecisions((await client.getDecisions(id)).decisions); setLinks((await client.getTraceability(id)).links); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } }
  if (!analysisId) return <SubmitRequirements client={client} onCreated={load} />;
  if (error) return <main><h1>Architecture AI</h1><p role="alert">{error}</p></main>;
  return <main><h1>Architecture Package: {analysisId}</h1>{packageData && <PackageOverview result={packageData} onTraceability={() => document.getElementById("traceability")?.scrollIntoView()} />}<DecisionReview decisions={decisions} onAction={async (id, action) => { await client.reviewDecision(id, action); await load(analysisId); }} /><div id="traceability"><Traceability links={links} /></div></main>;
}
