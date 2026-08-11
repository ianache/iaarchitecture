import { afterEach, describe, expect, it, vi } from "vitest";
import { createCli } from "../src/main.js";
afterEach(() => vi.unstubAllGlobals());
describe("CLI", () => { it("declares shared analysis, regeneration, package, review, audit, and publish commands", () => { const names = createCli().commands.map((command) => command.name()); expect(names).toEqual(["analyze", "regenerate", "package", "review", "audit", "publish"]); }); });
describe("CLI validation errors", () => {
  it("keeps the API code and message when analysis validation fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ code: "INSUFFICIENT_EVIDENCE", message: "Human review is required" }), { status: 422, headers: { "content-type": "application/json" } })));
    const program = createCli().exitOverride();
    await expect(program.parseAsync(["node", "architecture-ai", "analyze", "--requirements", "Login", "--revision", "abc"])).rejects.toThrow("INSUFFICIENT_EVIDENCE: Human review is required");
  });
});
