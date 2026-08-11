import { describe, expect, it } from "vitest";
import { createApiClient } from "./api/client.js";
import { publishPackageAndReport, reviewDecisionAndReload } from "./App.js";
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
  it("publishes only through the explicit package publication endpoint", async () => {
    const requests: Array<{ url: string; method?: string; body?: string }> = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => { requests.push({ url: String(input), method: init?.method, body: String(init?.body ?? "") }); return new Response(JSON.stringify({ branch: "architecture/analysis-1" }), { status: 201 }); };
    try { await createApiClient("http://api.test").publishPackage("ANALYSIS-1", "architecture/analysis-1"); } finally { globalThis.fetch = originalFetch; }
    expect(requests).toEqual([{ url: "http://api.test/packages/ANALYSIS-1/publish", method: "POST", body: JSON.stringify({ branch: "architecture/analysis-1" }) }]);
  });
  it("surfaces structured API error contracts", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ code: "INVALID_PACKAGE_STATUS", message: "Package must be APPROVED" }), { status: 409 });
    try { await expect(createApiClient("http://api.test").publishPackage("ANALYSIS-1")).rejects.toThrow("INVALID_PACKAGE_STATUS: Package must be APPROVED"); } finally { globalThis.fetch = originalFetch; }
  });
});

describe("reviewDecisionAndReload", () => {
  it("reports a rejected review request without reloading stale analysis data", async () => {
    const errors: Array<string | undefined> = [];
    let reloads = 0;

    await reviewDecisionAndReload({
      client: { reviewDecision: async () => { throw new Error("Review request failed: 500"); } },
      decisionId: "DECISION-1",
      action: "approve",
      analysisId: "ANALYSIS-1",
      load: async () => { reloads += 1; },
      setError: (error) => errors.push(error)
    });

    expect(errors).toEqual([undefined, "Review request failed: 500"]);
    expect(reloads).toBe(0);
  });
});
describe("publishPackageAndReport", () => {
  it("reports the isolated branch and commit after publication", async () => {
    const errors: Array<string | undefined> = [];
    await publishPackageAndReport({ client: { publishPackage: async () => ({ analysisId: "ANALYSIS-1", branch: "architecture/analysis-1", commit: "abc123", directory: "packages/ANALYSIS-1", files: [] }) }, analysisId: "ANALYSIS-1", setError: (error) => errors.push(error) });
    expect(errors).toEqual([undefined, "Package published on architecture/analysis-1 at abc123."]);
  });
  it("keeps publication errors visible", async () => {
    const errors: Array<string | undefined> = [];
    await publishPackageAndReport({ client: { publishPackage: async () => { throw new Error("INVALID_PACKAGE_STATUS: Package must be APPROVED"); } }, analysisId: "ANALYSIS-1", setError: (error) => errors.push(error) });
    expect(errors).toEqual([undefined, "INVALID_PACKAGE_STATUS: Package must be APPROVED"]);
  });
});
