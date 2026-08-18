import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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

  it("ignores untracked knowledge files that are not part of the pinned revision", async () => {
    const repository = new GitKnowledgeRepository(process.cwd());
    const revision = (await import("node:child_process")).execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const dir = join(process.cwd(), "knowledge", "scratch");
    const file = join(dir, "UNTRACKED-TEST.md");
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, "---\ntitle: Test\nstatus: DRAFT\ntype: PRINCIPLE\ntags: [security]\n---\n\n# Test\n");

    try {
      const snapshot = await repository.readRevision(revision);
      expect(snapshot.items.some((item) => item.sourcePath === "knowledge/scratch/UNTRACKED-TEST.md")).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
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
