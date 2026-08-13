import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "./client.js";

afterEach(() => vi.unstubAllGlobals());

describe("ApiClient validation errors", () => {
  it("keeps the API code and message for a standards conflict", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ code: "STANDARDS_CONFLICT", message: "Conflicting corporate standards" }), { status: 409, headers: { "content-type": "application/json" } })));
    await expect(createApiClient("http://api.test").createAnalysis("Login", "abc")).rejects.toThrow("STANDARDS_CONFLICT: Conflicting corporate standards");
  });

  it("handles 409 on KCR publish", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ code: "INVALID_KCR_STATUS", message: "KCR must be APPROVED" }), { status: 409, headers: { "content-type": "application/json" } })));
    await expect(createApiClient("http://api.test").publishKcr("KCR-1")).rejects.toThrow("INVALID_KCR_STATUS: KCR must be APPROVED");
  });
});
