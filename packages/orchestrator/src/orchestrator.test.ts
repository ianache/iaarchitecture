import { describe, expect, it } from "vitest";
import type { ArchitectureModel, EvidenceRetriever, RetrievedEvidence, Requirement } from "@architecture-ai/domain";
import { ArchitectureOrchestrator } from "./orchestrator.js";
const evidence: RetrievedEvidence[] = [
  { id: "E-ORDER", knowledgeId: "KI-ORDER", sourcePath: "knowledge/standards/orders.md", revision: "abc", excerpt: "Orders publish domain events through versioned contracts.", classification: "STANDARD", confidence: 1, method: "fixture", score: 1 },
  { id: "E-PROFILE", knowledgeId: "KI-PROFILE", sourcePath: "knowledge/standards/profiles.md", revision: "abc", excerpt: "Profiles retain customer addresses in the customer domain.", classification: "STANDARD", confidence: 1, method: "fixture", score: 1 },
];
const retriever: EvidenceRetriever = { async retrieve() { return evidence; } };
const model: ArchitectureModel = { async complete() { return { output: "fixture" }; } };
const requirements: Requirement[] = [
  { id: "REQ-ORDER", title: "Order events", description: "Orders publish domain events", tags: [] },
  { id: "REQ-PROFILE", title: "Profile retention", description: "Profiles retain customer addresses", tags: [] },
  { id: "REQ-BIOMETRIC", title: "Biometric verification", description: "Biometric verification must be approved", tags: [] },
];
describe("ArchitectureOrchestrator", () => { it("creates recommendations from only matching corporate evidence and flags unsupported requirements for human review", async () => { const result = await new ArchitectureOrchestrator(retriever, model).run({ requirements, knowledgeRevision: "abc" }); const byRequirement = new Map(result.context.recommendations.map((recommendation) => [recommendation.sourceRequirementIds[0], recommendation])); expect(byRequirement.get("REQ-ORDER")).toMatchObject({ evidenceIds: ["E-ORDER"], sourceKnowledgeIds: ["KI-ORDER"] }); expect(byRequirement.get("REQ-PROFILE")).toMatchObject({ evidenceIds: ["E-PROFILE"], sourceKnowledgeIds: ["KI-PROFILE"] }); expect(byRequirement.get("REQ-BIOMETRIC")).toMatchObject({ evidenceIds: [], sourceKnowledgeIds: [], rationale: expect.stringMatching(/human review/i) }); expect(result.context.links).toEqual(expect.arrayContaining([expect.objectContaining({ fromId: "KI-ORDER", fromType: "KNOWLEDGE_ITEM", toType: "RECOMMENDATION" }), expect.objectContaining({ fromType: "RECOMMENDATION", toType: "DECISION" })])); expect(result.context.status.value).toBe("INCOMPLETE"); }); });
