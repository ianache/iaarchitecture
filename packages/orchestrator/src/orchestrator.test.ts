import { describe, expect, it } from "vitest";
import type { ArchitectureModel, EvidenceRetriever, RetrievedEvidence } from "@architecture-ai/domain";
import { ArchitectureOrchestrator } from "./orchestrator.js";
const evidence: RetrievedEvidence[] = [{ id: "E-1", knowledgeId: "KI-1", sourcePath: "knowledge/standards/ST.md", revision: "abc", excerpt: "Versioned contracts", classification: "STANDARD", confidence: 1, method: "fixture", score: 1 }];
const retriever: EvidenceRetriever = { async retrieve() { return evidence; } };
const model: ArchitectureModel = { async complete() { return { output: "fixture" }; } };
describe("ArchitectureOrchestrator", () => { it("runs the vertical architecture workflow and returns traceability", async () => { const result = await new ArchitectureOrchestrator(retriever, model).run({ requirements: "Customers submit orders\nOrders publish integration events\nOrder records must persist", knowledgeRevision: "abc" }); expect(result.context.requirements).toHaveLength(3); expect(result.context.drivers).toHaveLength(3); expect(result.context.decisions.every((decision) => decision.status === "DRAFT")).toBe(true); expect(result.context.links.some((link) => link.kind === "DERIVES")).toBe(true); expect(result.findings.some((finding) => finding.includes("Security design gap"))).toBe(true); }); });
