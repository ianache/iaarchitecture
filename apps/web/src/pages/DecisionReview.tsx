import type { ArchitectureDecision } from "@architecture-ai/domain";
import { DecisionCard } from "../components/DecisionCard.js";
export function DecisionReview({ decisions, onAction }: { decisions: ArchitectureDecision[]; onAction: (id: string, action: "approve" | "reject" | "request-changes") => void }) { return <section><h2>Decision review</h2>{decisions.map((decision) => <DecisionCard key={decision.id} decision={decision} onAction={(action) => onAction(decision.id, action)} />)}</section>; }
