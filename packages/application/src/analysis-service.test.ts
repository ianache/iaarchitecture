import { describe, expect, it } from "vitest";
import { rmSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { ArchitectureModel, EvidenceRetriever, RetrievedEvidence } from "@architecture-ai/domain";
import { ArchitectureOrchestrator } from "@architecture-ai/orchestrator";
import { AnalysisRepository, DatabaseStore, ReviewRepository } from "@architecture-ai/persistence";
import { AnalysisService } from "./analysis-service.js";

const getTempDbPath = () => `.architecture-ai/application-test-${randomUUID()}.sqlite`;
const evidence: RetrievedEvidence[] = [{ id: "E-1", knowledgeId: "KI-1", revision: "abc", excerpt: "API standard", classification: "STANDARD", confidence: 1, method: "fixture", score: 1 }];
const service = (dbPath: string, onComplete = () => {}) => {
  const store = DatabaseStore.open(dbPath);
  const orchestrator = new ArchitectureOrchestrator({ retrieve: async () => evidence } satisfies EvidenceRetriever, { complete: async () => { onComplete(); return { output: "fixture" }; } } satisfies ArchitectureModel);
  return { service: new AnalysisService(orchestrator, new AnalysisRepository(store), new ReviewRepository(store)), store };
};

describe("AnalysisService", () => {
  it("persists the orchestration result and decisions", async () => {
    const dbPath = getTempDbPath();
    const first = service(dbPath);
    let created: Awaited<ReturnType<typeof first.service.create>>;
    try {
      created = await first.service.create({ requirements: "Customers submit orders", knowledgeRevision: "abc" });
    } finally {
      first.store.close();
    }
    const second = service(dbPath);
    try {
      const loaded = await second.service.get(created!.id);
      expect(loaded.result?.context.revision).toBe("abc");
      expect(loaded.result?.context.decisions.length).toBeGreaterThan(0);
      expect(loaded.status).toBe("INCOMPLETE");
    } finally {
      second.store.close();
      rmSync(dbPath, { force: true });
    }
  });

  it("returns a typed not-found error", async () => {
    const dbPath = getTempDbPath();
    const current = service(dbPath);
    try {
      await expect(current.service.get("ANALYSIS-404")).rejects.toMatchObject({ code: "NOT_FOUND" });
    } finally {
      current.store.close();
      rmSync(dbPath, { force: true });
    }
  });

  it("preserves a structured knowledge validation error", async () => {
    const dbPath = getTempDbPath();
    const store = DatabaseStore.open(dbPath);
    const failing = { run: async () => { throw Object.assign(new Error("Knowledge metadata is invalid"), { code: "INVALID_OKF_METADATA" }); } } as unknown as ArchitectureOrchestrator;
    try {
      await expect(new AnalysisService(failing, new AnalysisRepository(store), new ReviewRepository(store)).create({ requirements: "Login", knowledgeRevision: "abc" })).rejects.toMatchObject({ code: "INVALID_OKF_METADATA", message: "Knowledge metadata is invalid" });
    } finally {
      store.close();
      rmSync(dbPath, { force: true });
    }
  });

  it("lists persisted summaries without calling the orchestrator", async () => {
    const dbPath = getTempDbPath();
    let completions = 0;
    const current = service(dbPath, () => { completions += 1; });
    try {
      await new AnalysisRepository(current.store).create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" });
      expect(await current.service.list()).toEqual([expect.objectContaining({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc", hasResult: false })]);
      expect(completions).toBe(0);
    } finally {
      current.store.close();
      rmSync(dbPath, { force: true });
    }
  });
});
