import { useMemo, useState } from "react";
import { createApiClient } from "./api/client.js";
import { SubmitRequirements } from "./pages/SubmitRequirements.js";
export function App() { const client = useMemo(() => createApiClient("http://127.0.0.1:3000"), []); const [analysisId, setAnalysisId] = useState<string>(); return analysisId ? <p>Analysis {analysisId} is ready for review.</p> : <SubmitRequirements client={client} onCreated={setAnalysisId} />; }
