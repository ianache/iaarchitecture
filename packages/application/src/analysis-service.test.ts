import { afterEach, describe, expect, it } from "vitest";
import { rmSync } from "node:fs";
import type { ArchitectureModel, EvidenceRetriever, RetrievedEvidence } from "@architecture-ai/domain";
import { ArchitectureOrchestrator } from "@architecture-ai/orchestrator";
import { AnalysisRepository, DatabaseStore, ReviewRepository } from "@architecture-ai/persistence";
import { AnalysisService } from "./analysis-service.js";

const databasePath = ".architecture-ai/application-test.sqlite";
const evidence: RetrievedEvidence[] = [{ id: "E-1", knowledgeId: "KI-1", revision: "abc", excerpt: "API standard", classification: "STANDARD", confidence: 1, method: "fixture", score: 1 }];
const service = () => { const store = DatabaseStore.open(databasePath); const orchestrator = new ArchitectureOrchestrator({ retrieve: async () => evidence } satisfies EvidenceRetriever, { complete: async () => ({ output: "fixture" }) } satisfies ArchitectureModel); return { service: new AnalysisService(orchestrator, new AnalysisRepository(store), new ReviewRepository(store)), store }; };
afterEach(() => rmSync(databasePath, { force: true }));

describe("AnalysisService", () => {
  it("persists the orchestration result and decisions", async () => {
    const first = service(); const created = await first.service.create({ requirements: "Customers submit orders", knowledgeRevision: "abc" }); first.store.close();
    const second = service(); const loaded = await second.service.get(created.id); expect(loaded.result?.context.revision).toBe("abc"); expect(loaded.result?.context.decisions.length).toBeGreaterThan(0); expect(loaded.status).toBe("DRAFT"); second.store.close();
  });
  it("returns a typed not-found error", async () => { const current = service(); await expect(current.service.get("ANALYSIS-404")).rejects.toMatchObject({ code: "NOT_FOUND" }); current.store.close(); });
});
