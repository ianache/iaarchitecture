import type { ArchitectureDecision, Review } from "@architecture-ai/domain";
import { AnalysisRepository, ReviewRepository } from "@architecture-ai/persistence";
import { ApplicationError } from "./errors.js";

export class GovernanceService {
  constructor(private readonly reviews: ReviewRepository, private readonly analyses?: AnalysisRepository) {}

  async review(decisionId: string, reviewer: string, comment?: string): Promise<ArchitectureDecision> {
    return this.record(decisionId, reviewer, "REVIEW", comment, "DRAFT", "REVIEWED");
  }

  async approve(decisionId: string, reviewer: string, comment?: string): Promise<ArchitectureDecision> {
    return this.record(decisionId, reviewer, "APPROVE", comment, "REVIEWED", "APPROVED");
  }

  async reject(decisionId: string, reviewer: string, comment?: string): Promise<ArchitectureDecision> {
    return this.record(decisionId, reviewer, "REJECT", comment, undefined, "DRAFT");
  }

  async requestChanges(decisionId: string, reviewer: string, comment?: string): Promise<ArchitectureDecision> {
    return this.record(decisionId, reviewer, "REQUEST_CHANGES", comment, undefined, "DRAFT");
  }

  async audit(decisionId: string): Promise<Review[]> {
    return this.reviews.listAudit(decisionId);
  }

  private async record(
    decisionId: string,
    reviewer: string,
    action: Review["action"],
    comment: string | undefined,
    requiredStatus: ArchitectureDecision["status"] | undefined,
    nextStatus: ArchitectureDecision["status"],
  ): Promise<ArchitectureDecision> {
    const decision = await this.reviews.getDecision(decisionId);
    if (!decision) throw new ApplicationError("NOT_FOUND", `Decision not found: ${decisionId}`);
    if (requiredStatus && decision.status !== requiredStatus) {
      throw new ApplicationError("INVALID_REVIEW_TRANSITION", `Decision must be ${requiredStatus} before ${nextStatus}`);
    }
    const updated = { ...decision, status: nextStatus };
    const review: Review = { id: `REVIEW-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, decisionId, reviewer, action, comment, at: new Date().toISOString() };
    await this.reviews.updateDecision(updated);
    await this.reviews.recordReview(review);
    await this.syncPackageStatus(decisionId);
    return updated;
  }

  private async syncPackageStatus(decisionId: string): Promise<void> {
    if (!this.analyses) return;
    const analysisId = await this.reviews.getDecisionAnalysisId(decisionId);
    if (!analysisId) return;
    const current = await this.analyses.get(analysisId);
    if (current?.result?.packageStatus.value === "INCOMPLETE") return;
    const decisions = await this.reviews.listDecisions(analysisId);
    const significant = decisions.filter((candidate) => candidate.significant);
    const status = significant.length > 0 && significant.every((candidate) => candidate.status === "APPROVED") ? "APPROVED" : significant.some((candidate) => candidate.status === "REVIEWED" || candidate.status === "APPROVED") ? "IN_REVIEW" : "DRAFT";
    await this.analyses.updatePackageStatus(analysisId, status);
  }
}
