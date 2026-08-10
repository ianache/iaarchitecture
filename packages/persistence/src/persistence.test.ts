import { afterEach, describe, expect, it } from "vitest";
import { DatabaseStore } from "./database.js";
import { AnalysisRepository } from "./analysis-repository.js";
import { ReviewRepository } from "./review-repository.js";
import type { AnalysisResult, ArchitectureDecision, Review } from "@architecture-ai/domain";
import { rmSync } from "node:fs";
const path = ".architecture-ai/persistence-test.sqlite";
afterEach(() => { rmSync(path, { force: true }); });
const decision: ArchitectureDecision = { id: "DEC-1", title: "Use API", context: "Need stable contracts", decision: "Use versioned API", rationale: "Compatibility", evidenceIds: ["E-1"], sourceRequirementIds: ["REQ-1"], significant: true, status: "DRAFT", classification: "DECISION" };
const result: AnalysisResult = { context: { revision: "abc", requirements: [], drivers: [], evidence: [], decisions: [], artifacts: [], links: [], status: { value: "DRAFT", requiredDecisionIds: [], approvedDecisionIds: [] } }, findings: [], risks: [], artifacts: [], packageStatus: { value: "DRAFT", requiredDecisionIds: [], approvedDecisionIds: [] } };
describe("SQLite persistence", () => {
  it("round-trips analyses, decisions and audit entries after reopen", async () => {
    let store = DatabaseStore.open(path);
    try {
      const analyses = new AnalysisRepository(store); const reviews = new ReviewRepository(store);
      await analyses.create({ id: "ANALYSIS-1", requirements: "Order submission", knowledgeRevision: "abc" }); await reviews.saveDecision("ANALYSIS-1", decision);
      const review: Review = { id: "REV-1", decisionId: "DEC-1", reviewer: "human", action: "REVIEW", at: new Date().toISOString() }; await reviews.recordReview(review);
    } finally { store.close(); }
    store = DatabaseStore.open(path);
    try { expect((await new AnalysisRepository(store).get("ANALYSIS-1"))?.requirements).toBe("Order submission"); expect((await new ReviewRepository(store).getDecision("DEC-1"))?.status).toBe("DRAFT"); expect((await new ReviewRepository(store).listAudit("DEC-1"))).toHaveLength(1); } finally { store.close(); }
  });

  it("lists analysis summaries ordered by updatedAt descending with result presence", async () => {
    const store = DatabaseStore.open(path);
    try {
      const analyses = new AnalysisRepository(store);
      await analyses.create({ id: "ANALYSIS-1", requirements: "First", knowledgeRevision: "rev-1" });
      await analyses.create({ id: "ANALYSIS-2", requirements: "Second", knowledgeRevision: "rev-2", status: "REVIEWED" });
      await analyses.updateResult("ANALYSIS-1", result);
      store.database.prepare("UPDATE analyses SET created_at = ?, updated_at = ? WHERE id = ?").run("2026-08-10T10:00:00.000Z", "2026-08-10T12:00:00.000Z", "ANALYSIS-1");
      store.database.prepare("UPDATE analyses SET created_at = ?, updated_at = ? WHERE id = ?").run("2026-08-10T11:00:00.000Z", "2026-08-10T13:00:00.000Z", "ANALYSIS-2");
      expect(await analyses.list()).toEqual([
        { id: "ANALYSIS-2", requirements: "Second", knowledgeRevision: "rev-2", status: "REVIEWED", createdAt: "2026-08-10T11:00:00.000Z", updatedAt: "2026-08-10T13:00:00.000Z", hasResult: false },
        { id: "ANALYSIS-1", requirements: "First", knowledgeRevision: "rev-1", status: "DRAFT", createdAt: "2026-08-10T10:00:00.000Z", updatedAt: "2026-08-10T12:00:00.000Z", hasResult: true },
      ]);
    } finally { store.close(); }
  });
});
