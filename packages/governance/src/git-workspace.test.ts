import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { LocalGitWorkspace } from "./git-workspace.js";
describe("LocalGitWorkspace", () => { it("requires an isolated branch before review preparation", async () => { const workspace = new LocalGitWorkspace(process.cwd()); await expect(workspace.prepareReview("should fail")).rejects.toThrow("branch"); }); });
it("creates and commits in an isolated worktree without switching the active checkout", async () => {
  const root = await mkdtemp(join(tmpdir(), "architecture-ai-git-"));
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root }); execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
  await writeFile(join(root, "README.md"), "base\n"); execFileSync("git", ["add", "."], { cwd: root }); execFileSync("git", ["commit", "-qm", "base"], { cwd: root });
  const workspace = new LocalGitWorkspace(root); await workspace.createBranch("architecture-review", "HEAD");
  expect(execFileSync("git", ["branch", "--show-current"], { cwd: root, encoding: "utf8" }).trim()).toBe("main");
  await workspace.writePackage("packages/ANALYSIS-1", { "architecture-context.json": "{}\n" });
  const prepared = await workspace.prepareReview("publish architecture package");
  expect(prepared.branch).toBe("architecture-review"); expect(prepared.commit).toMatch(/^[0-9a-f]{40}$/);
  expect(await readFile(join(root, ".architecture-ai", "worktrees", "architecture-review", "packages/ANALYSIS-1/architecture-context.json"), "utf8")).toBe("{}\n");
}, 15000);
