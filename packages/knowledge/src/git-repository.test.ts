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
});
