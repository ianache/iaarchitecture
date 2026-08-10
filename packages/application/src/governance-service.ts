import type { ArchitectureDecision, Review } from "@architecture-ai/domain";
import { ReviewRepository } from "@architecture-ai/persistence";
import { ApplicationError } from "./errors.js";

export class GovernanceService {
  constructor(private readonly reviews: ReviewRepository) {}

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
    return updated;
  }
}
