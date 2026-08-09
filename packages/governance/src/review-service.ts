import type { ArchitectureDecision, Review } from "@architecture-ai/domain";
import { AuditLog } from "./audit-log.js";
export class ReviewService {
  constructor(private readonly decisions = new Map<string, ArchitectureDecision>(), private readonly audit = new AuditLog()) {}
  addDecision(decision: ArchitectureDecision): void { this.decisions.set(decision.id, decision); }
  getDecision(id: string): ArchitectureDecision | undefined { return this.decisions.get(id); }
  private record(id: string, reviewer: string, action: Review["action"], comment?: string): ArchitectureDecision { const decision = this.decisions.get(id); if (!decision) throw new Error(`Unknown decision ${id}`); if (action === "APPROVE" && decision.status !== "REVIEWED") throw new Error("Decision must be REVIEWED before APPROVED"); if (action === "REVIEW" && decision.status !== "DRAFT") throw new Error("Only DRAFT decisions can be reviewed"); decision.status = action === "APPROVE" ? "APPROVED" : action === "REVIEW" ? "REVIEWED" : "DRAFT"; this.audit.append({ id: `REVIEW-${this.audit.all().length + 1}`, decisionId: id, reviewer, action, comment, at: new Date().toISOString() }); return decision; }
  reviewDecision(id: string, reviewer: string, comment?: string): ArchitectureDecision { return this.record(id, reviewer, "REVIEW", comment); }
  approveDecision(id: string, reviewer: string, comment?: string): ArchitectureDecision { return this.record(id, reviewer, "APPROVE", comment); }
  rejectDecision(id: string, reviewer: string, comment?: string): ArchitectureDecision { return this.record(id, reviewer, "REJECT", comment); }
  requestChanges(id: string, reviewer: string, comment?: string): ArchitectureDecision { return this.record(id, reviewer, "REQUEST_CHANGES", comment); }
  auditEntries(): Review[] { return this.audit.all(); }
}
