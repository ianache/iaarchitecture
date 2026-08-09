import { describe, expect, it } from "vitest";
import type { KnowledgeSnapshot } from "@architecture-ai/domain";
import { RetrievalService } from "./retrieval-service.js";

const snapshot: KnowledgeSnapshot = { revision: "abc", ontology: { entityKinds: ["REQUIREMENT"], relationshipKinds: ["SUPPORTS"] }, items: [
  { id: "KI-1", key: "ST-1", title: "Versioned API contracts", summary: "External API integration contracts", content: "Contracts are explicit", type: "STANDARD", status: "APPROVED", revision: "abc", sourcePath: "knowledge/standards/ST-1.md", tags: ["api", "integration"], relatedIds: ["KI-2"] },
  { id: "KI-2", key: "PT-1", title: "Outbox", summary: "Reliable integration events", content: "Publish events safely", type: "RECOMMENDATION", status: "DRAFT", revision: "abc", sourcePath: "knowledge/patterns/PT-1.md", tags: ["integration"] },
] };

describe("RetrievalService", () => {
  it("combines text/vector retrieval and ranks approved evidence", async () => {
    const service = new RetrievalService();
    await service.buildProjections(snapshot);
    const results = await service.retrieve({ query: "API integration", revision: "abc", limit: 2 });
    expect(results[0].knowledgeId).toBe("KI-1");
    expect(results[0].revision).toBe("abc");
  });
  it("rejects a revision mismatch", async () => {
    const service = new RetrievalService();
    await service.buildProjections(snapshot);
    await expect(service.retrieve({ query: "api", revision: "wrong" })).rejects.toThrow("does not match");
  });
});
