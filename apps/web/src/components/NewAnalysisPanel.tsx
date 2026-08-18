import { useState } from "react";
import type { ApiClient } from "../api/client.js";

export function NewAnalysisPanel({
  client,
  knowledgeRevision,
  onCreated,
  onCancel
}: {
  client: ApiClient;
  knowledgeRevision: string;
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const [requirements, setRequirements] = useState("");
  const submitDisabled = !requirements.trim();

  return (
    <section className="card" style={{ marginBottom: 28 }}>
      <h3 className="card-title" style={{ fontSize: 19, marginBottom: 4 }}>New analysis</h3>
      <p className="view-subtitle" style={{ marginBottom: 20 }}>
        Scope this run against knowledge revision <span className="mono" style={{ color: "var(--mono-accent)" }}>{knowledgeRevision}</span>
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await client.createAnalysis(requirements, knowledgeRevision);
          onCreated(result.id);
        }}
      >
        <label className="field field-eyebrow">
          PRD or user stories
          <textarea className="field-control" rows={6} value={requirements} onChange={(event) => setRequirements(event.target.value)} />
        </label>
        <div className="view-actions" style={{ marginTop: 4 }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitDisabled}>Generate architecture package</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
