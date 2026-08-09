import { describe, expect, it } from "vitest";
import type { ArchitectureDecision } from "@architecture-ai/domain";
import { ReviewService } from "./review-service.js";
const decision: ArchitectureDecision = { id: "DEC-1", title: "Use API", context: "ctx", decision: "Version API", rationale: "stable", evidenceIds: ["E-1"], sourceRequirementIds: ["REQ-1"], significant: true, status: "DRAFT", classification: "DECISION" };
describe("ReviewService", () => { it("enforces DRAFT -> REVIEWED -> APPROVED", () => { const service = new ReviewService(); service.addDecision({ ...decision }); expect(() => service.approveDecision("DEC-1", "alice")).toThrow("REVIEWED"); service.reviewDecision("DEC-1", "alice"); expect(service.approveDecision("DEC-1", "bob").status).toBe("APPROVED"); expect(service.auditEntries()).toHaveLength(2); }); it("rejects unknown decisions", () => { expect(() => new ReviewService().reviewDecision("missing", "alice")).toThrow("Unknown decision"); }); });
