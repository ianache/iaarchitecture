import { afterEach, describe, expect, it } from "vitest";
import { rmSync } from "node:fs";
import type { ArchitectureDecision } from "@architecture-ai/domain";
import { AnalysisRepository, DatabaseStore, ReviewRepository } from "@architecture-ai/persistence";
import { ApplicationError, GovernanceService } from "./index.js";

const databasePath = ".architecture-ai/governance-service-test.sqlite";
const decision: ArchitectureDecision = { id: "DECISION-1", title: "Use MFA", context: "Login", decision: "Use TOTP", rationale: "Risk reduction", evidenceIds: [], sourceRequirementIds: ["REQ-1"], significant: true, status: "DRAFT", classification: "DECISION" };
afterEach(() => rmSync(databasePath, { force: true }));

describe("GovernanceService", () => {
  it("persists review and approval transitions with audit history", async () => {
    const store = DatabaseStore.open(databasePath);
    try {
      const analyses = new AnalysisRepository(store);
      await analyses.create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" });
      const reviews = new ReviewRepository(store);
      await reviews.saveDecision("ANALYSIS-1", decision);
      const service = new GovernanceService(reviews);
      expect((await service.review("DECISION-1", "architect")).status).toBe("REVIEWED");
      expect((await service.approve("DECISION-1", "owner")).status).toBe("APPROVED");
      expect((await service.audit("DECISION-1")).map((entry) => entry.action)).toEqual(["REVIEW", "APPROVE"]);
    } finally { store.close(); }
  });

  it("requires human review before approval", async () => {
    const store = DatabaseStore.open(databasePath);
    try {
      const analyses = new AnalysisRepository(store);
      await analyses.create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" });
      const reviews = new ReviewRepository(store);
      await reviews.saveDecision("ANALYSIS-1", decision);
      await expect(new GovernanceService(reviews).approve("DECISION-1", "owner")).rejects.toBeInstanceOf(ApplicationError);
    } finally { store.close(); }
  });
});
