import type { ArchitectureDecision, Review } from "@architecture-ai/domain";
import type { DatabaseStore } from "./database.js";

export class ReviewRepository {
  constructor(private readonly store: DatabaseStore) {}
  async saveDecision(analysisId: string, decision: ArchitectureDecision): Promise<void> {
    const now = new Date().toISOString();
    this.store.database.prepare("INSERT OR REPLACE INTO decisions (id, analysis_id, decision_json, significant, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM decisions WHERE id = ?), ?), ?)").run(decision.id, analysisId, JSON.stringify(decision), decision.significant ? 1 : 0, decision.status, decision.id, now, now);
  }
  async getDecision(id: string): Promise<ArchitectureDecision | undefined> {
    const row = this.store.database.prepare("SELECT decision_json FROM decisions WHERE id = ?").get(id) as { decision_json?: string } | undefined;
    return row?.decision_json ? JSON.parse(row.decision_json) as ArchitectureDecision : undefined;
  }
  async getDecisionAnalysisId(id: string): Promise<string | undefined> {
    const row = this.store.database.prepare("SELECT analysis_id FROM decisions WHERE id = ?").get(id) as { analysis_id?: string } | undefined;
    return row?.analysis_id;
  }
  async listDecisions(analysisId: string): Promise<ArchitectureDecision[]> {
    const rows = this.store.database.prepare("SELECT decision_json FROM decisions WHERE analysis_id = ? ORDER BY created_at").all(analysisId) as Array<{ decision_json: string }>;
    return rows.map((row) => JSON.parse(row.decision_json) as ArchitectureDecision);
  }
  async updateDecision(decision: ArchitectureDecision): Promise<void> {
    this.store.database.prepare("UPDATE decisions SET decision_json = ?, significant = ?, status = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(decision), decision.significant ? 1 : 0, decision.status, new Date().toISOString(), decision.id);
  }
  async recordReview(review: Review): Promise<void> {
    this.store.database.prepare("INSERT INTO reviews (id, decision_id, reviewer, action, comment, at) VALUES (?, ?, ?, ?, ?, ?)").run(review.id, review.decisionId, review.reviewer, review.action, review.comment ?? null, review.at);
    this.store.database.prepare("INSERT INTO audit_events (decision_id, event_json, created_at) VALUES (?, ?, ?)").run(review.decisionId, JSON.stringify(review), review.at);
  }
  async listAudit(decisionId: string): Promise<Review[]> {
    const rows = this.store.database.prepare("SELECT event_json FROM audit_events WHERE decision_id = ? ORDER BY id").all(decisionId) as Array<{ event_json: string }>;
    return rows.map((row) => JSON.parse(row.event_json) as Review);
  }
}
