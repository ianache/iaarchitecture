import { afterEach, describe, expect, it } from "vitest";
import { rmSync } from "node:fs";
import type { AnalysisResult, ArchitectureDecision, GitWorkspace, PackageRenderer } from "@architecture-ai/domain";
import { AnalysisRepository, DatabaseStore, ReviewRepository } from "@architecture-ai/persistence";
import { AnalysisService, GovernanceService, PublicationService } from "./index.js";

const databasePath = ".architecture-ai/regeneration-test.sqlite";
const draftDecision: ArchitectureDecision = { id: "DECISION-1", title: "Use MFA", context: "Login", decision: "Use TOTP", rationale: "Risk reduction", evidenceIds: [], sourceRequirementIds: ["REQ-1"], significant: true, status: "DRAFT", classification: "DECISION" };
const result = (status: AnalysisResult["packageStatus"]["value"], generation: number, decision = draftDecision): AnalysisResult => ({ context: { revision: "abc", requirements: [], drivers: [], evidence: [], recommendations: [], decisions: [decision], artifacts: [], links: [], status: { value: status, requiredDecisionIds: [decision.id], approvedDecisionIds: status === "APPROVED" ? [decision.id] : [] } }, findings: [], risks: [], artifacts: [], packageStatus: { value: status, requiredDecisionIds: [decision.id], approvedDecisionIds: status === "APPROVED" ? [decision.id] : [] }, generation });
afterEach(() => rmSync(databasePath, { force: true }));

describe("regeneration after requested changes", () => {
  it("requires regeneration after a rejection", async () => {
    const store = DatabaseStore.open(databasePath);
    try {
      const analyses = new AnalysisRepository(store); const reviews = new ReviewRepository(store);
      await analyses.create({ id: "ANALYSIS-1", requirements: "Login with MFA", knowledgeRevision: "abc" });
      const approvedDecision = { ...draftDecision, status: "APPROVED" as const };
      await analyses.updateResult("ANALYSIS-1", result("APPROVED", 1, approvedDecision));
      await reviews.saveDecision("ANALYSIS-1", approvedDecision);
      await new GovernanceService(reviews, analyses).reject("DECISION-1", "architect", "Rejected for risk");
      expect((await analyses.get("ANALYSIS-1"))?.result?.packageStatus.diagnostics).toEqual(["Regeneration required: REJECT on decision DECISION-1"]);
      expect(await analyses.listResultHistory("ANALYSIS-1")).toHaveLength(1);
    } finally { store.close(); }
  });

  it("blocks publication, archives the prior result, and requires a new review before publication", async () => {
    const store = DatabaseStore.open(databasePath);
    try {
      const analyses = new AnalysisRepository(store); const reviews = new ReviewRepository(store);
      await analyses.create({ id: "ANALYSIS-1", requirements: "Login with MFA", knowledgeRevision: "abc" });
      const approvedDecision = { ...draftDecision, status: "APPROVED" as const };
      await analyses.updateResult("ANALYSIS-1", result("APPROVED", 1, approvedDecision));
      await reviews.saveDecision("ANALYSIS-1", approvedDecision);
      const governance = new GovernanceService(reviews, analyses);
      await governance.requestChanges("DECISION-1", "architect", "Use an approved authenticator");
      expect((await analyses.get("ANALYSIS-1"))?.result?.packageStatus).toMatchObject({ value: "DRAFT", diagnostics: [expect.stringMatching(/regeneration required/i)] });

      const renderer = { renderPackage: async (current: AnalysisResult, directory: string) => ({ directory, files: ["architecture-context.json"], context: current.context }) } satisfies PackageRenderer;
      const workspace = { createBranch: async () => "architecture/analysis-1", getWorkingDirectory: () => ".architecture-ai/workspace", writePackage: async () => {}, prepareReview: async () => ({ branch: "architecture/analysis-1", commit: "abc123" }), writeKnowledgeDocument: async () => {}, prepareKnowledgeReview: async () => ({ branch: "architecture/analysis-1", commit: "abc123" }) } as GitWorkspace;
      await expect(new PublicationService(analyses, renderer, () => workspace).publish("ANALYSIS-1")).rejects.toMatchObject({ code: "INVALID_PACKAGE_STATUS" });

      const orchestrator = { run: async () => result("DRAFT", 0) } as never;
      const regenerated = await new AnalysisService(orchestrator, analyses, reviews).regenerate("ANALYSIS-1");
      expect(regenerated.result).toMatchObject({ generation: 2, packageStatus: { value: "DRAFT" } });
      expect(await analyses.listResultHistory("ANALYSIS-1")).toEqual([expect.objectContaining({ generation: 1, result: expect.objectContaining({ packageStatus: expect.objectContaining({ value: "APPROVED" }) }) })]);
      expect((await reviews.getDecision("DECISION-1"))?.status).toBe("DRAFT");
      expect((await governance.audit("DECISION-1")).map((entry) => entry.action)).toEqual(["REQUEST_CHANGES"]);

      await governance.review("DECISION-1", "architect");
      await governance.approve("DECISION-1", "owner");
      await expect(new PublicationService(analyses, renderer, () => workspace).publish("ANALYSIS-1")).resolves.toMatchObject({ branch: "architecture/analysis-1" });
    } finally { store.close(); }
  });
});
