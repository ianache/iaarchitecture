import { describe, expect, it } from "vitest";
import { GitKnowledgeRepository } from "./git-repository.js";

describe("GitKnowledgeRepository", () => {
  it("reads the curated corpus at an explicit revision", async () => {
    const repository = new GitKnowledgeRepository(process.cwd());
    const revision = (await import("node:child_process")).execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const snapshot = await repository.readRevision(revision);
    expect(snapshot.revision).toBe(revision);
    expect(snapshot.items.length).toBeGreaterThanOrEqual(8);
    expect(snapshot.ontology.entityKinds).toContain("REQUIREMENT");
  });
  it("returns INVALID_REVISION for an unresolvable Git revision", async () => {
    try {
      await new GitKnowledgeRepository(process.cwd()).readRevision("does-not-exist");
      throw new Error("Expected the invalid Git revision to be rejected");
    } catch (error) {
      expect(error).toMatchObject({ code: "INVALID_REVISION" });
    }
  });
});
