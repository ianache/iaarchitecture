import type { ArchitectureDecision } from "@architecture-ai/domain";
import { DecisionCard } from "../components/DecisionCard.js";

export function DecisionReview({ decisions, onAction }: { decisions: ArchitectureDecision[]; onAction: (id: string, action: "review" | "approve" | "reject" | "request-changes") => void }) {
  return (
    <section className="card">
      <h2 className="card-title">Decision review</h2>
      <div className="stack-gap">
        {decisions.map((decision) => <DecisionCard key={decision.id} decision={decision} onAction={(action) => onAction(decision.id, action)} />)}
      </div>
    </section>
  );
}
