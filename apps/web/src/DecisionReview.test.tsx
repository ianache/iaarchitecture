import { describe, expect, it } from "vitest";
import { DecisionReview } from "./pages/DecisionReview.js";
describe("DecisionReview", () => { it("exports the human review screen", () => { expect(typeof DecisionReview).toBe("function"); }); });
