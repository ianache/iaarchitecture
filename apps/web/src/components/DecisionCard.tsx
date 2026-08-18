import type { ArchitectureDecision } from "@architecture-ai/domain";
import { badgeClassName } from "../status.js";

export function DecisionCard({ decision, onAction }: { decision: ArchitectureDecision; onAction: (action: "review" | "approve" | "reject" | "request-changes") => void }) {
  return (
    <article className="decision-card">
      <div className="decision-card-head">
        <h3 className="decision-card-title">{decision.id}: {decision.title}</h3>
        <span className={badgeClassName(decision.status)}>{decision.status}</span>
      </div>
      <p className="decision-card-body">{decision.decision}</p>
      <p className="decision-card-body"><strong>Rationale:</strong> {decision.rationale}</p>
      <p className="decision-card-ref"><strong>Evidence:</strong> {decision.evidenceIds.join(", ") || "Insufficient corporate evidence"}</p>
      <div className="decision-card-actions">
        {decision.status === "DRAFT" && <button type="button" className="action-link" onClick={() => onAction("review")}>Review</button>}
        {decision.status === "REVIEWED" && <button type="button" className="action-link" onClick={() => onAction("approve")}>Approve</button>}
        {decision.status !== "APPROVED" && <>
          <button type="button" className="action-link" onClick={() => onAction("reject")}>Reject</button>
          <button type="button" className="action-link" onClick={() => onAction("request-changes")}>Request changes</button>
        </>}
      </div>
    </article>
  );
}
