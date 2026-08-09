import { afterEach, describe, expect, it } from "vitest";
import { DatabaseStore } from "./database.js";
import { AnalysisRepository } from "./analysis-repository.js";
import { ReviewRepository } from "./review-repository.js";
import type { ArchitectureDecision, Review } from "@architecture-ai/domain";
import { rmSync } from "node:fs";
const path = ".architecture-ai/persistence-test.sqlite";
afterEach(() => { rmSync(path, { force: true }); });
const decision: ArchitectureDecision = { id: "DEC-1", title: "Use API", context: "Need stable contracts", decision: "Use versioned API", rationale: "Compatibility", evidenceIds: ["E-1"], sourceRequirementIds: ["REQ-1"], significant: true, status: "DRAFT", classification: "DECISION" };
describe("SQLite persistence", () => {
  it("round-trips analyses, decisions and audit entries after reopen", async () => {
    let store = DatabaseStore.open(path); const analyses = new AnalysisRepository(store); const reviews = new ReviewRepository(store);
    await analyses.create({ id: "ANALYSIS-1", requirements: "Order submission", knowledgeRevision: "abc" }); await reviews.saveDecision("ANALYSIS-1", decision);
    const review: Review = { id: "REV-1", decisionId: "DEC-1", reviewer: "human", action: "REVIEW", at: new Date().toISOString() }; await reviews.recordReview(review); store.close();
    store = DatabaseStore.open(path); expect((await new AnalysisRepository(store).get("ANALYSIS-1"))?.requirements).toBe("Order submission"); expect((await new ReviewRepository(store).getDecision("DEC-1"))?.status).toBe("DRAFT"); expect((await new ReviewRepository(store).listAudit("DEC-1"))).toHaveLength(1); store.close();
  });
});
