import { describe, expect, it } from "vitest";
import type { Evidence } from "@architecture-ai/domain";
import { classifyEvidence, sortEvidence } from "./evidence-policy.js";
describe("evidence policy", () => { it("ranks corporate evidence above model suggestions", () => { const model: Evidence = { id: "M", excerpt: "model", classification: "RECOMMENDATION", confidence: 1, method: "model" }; const corporate: Evidence = { id: "C", knowledgeId: "KI", revision: "abc", excerpt: "standard", classification: "STANDARD", confidence: .8, method: "git" }; expect(classifyEvidence(model)).toBe("MODEL_SUGGESTION"); expect(sortEvidence([model, corporate])[0].id).toBe("C"); }); });
