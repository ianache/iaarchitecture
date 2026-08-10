import { describe, expect, it } from "vitest";
import { createApiClient } from "./api/client.js";
import { DecisionReview } from "./pages/DecisionReview.js";
describe("DecisionReview", () => { it("exports the human review screen", () => { expect(typeof DecisionReview).toBe("function"); }); });

describe("ApiClient", () => {
  it("uses GET to load packages and POST only to generate them", async () => {
    const requests: Array<{ url: string; method?: string }> = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      requests.push({ url: String(input), method: init?.method });
      return new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } });
    };

    try {
      const client = createApiClient("http://api.test");
      await client.getPackage("ANALYSIS-1");
      await client.generatePackage("ANALYSIS-1");
      await client.listAnalyses();
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(requests).toEqual([
      { url: "http://api.test/packages/ANALYSIS-1", method: undefined },
      { url: "http://api.test/packages/ANALYSIS-1/generate", method: "POST" },
      { url: "http://api.test/analyses", method: undefined }
    ]);
  });
});
