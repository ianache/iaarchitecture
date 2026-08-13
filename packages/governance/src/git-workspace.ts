import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { GitWorkspace } from "@architecture-ai/domain";

export class LocalGitWorkspace implements GitWorkspace {
  private branch = "";
  private worktree = "";
  constructor(private readonly root: string) {}
  async createBranch(name: string, revision: string): Promise<string> {
    execFileSync("git", ["rev-parse", "--verify", `${revision}^{commit}`], { cwd: this.root });
    this.worktree = join(this.root, ".architecture-ai", "worktrees", name);
    await mkdir(join(this.worktree, ".."), { recursive: true });
    execFileSync("git", ["worktree", "add", "-b", name, this.worktree, revision], { cwd: this.root });
    this.branch = name;
    return name;
  }
  getWorkingDirectory(): string { if (!this.worktree) throw new Error("Git worktree has not been created"); return this.worktree; }
  async writePackage(directory: string, files: Record<string, string>): Promise<void> {
    if (!this.worktree) throw new Error("Git worktree has not been created");
    for (const [path, content] of Object.entries(files)) {
      const target = join(this.worktree, directory, path);
      await mkdir(join(target, ".."), { recursive: true });
      await writeFile(target, content, "utf8");
    }
  }
  async prepareReview(message: string): Promise<{ branch: string; commit?: string }> {
    if (!this.branch || !this.worktree) throw new Error("Git branch has not been created");
    execFileSync("git", ["add", "."], { cwd: this.worktree });
    execFileSync("git", ["commit", "-m", message], { cwd: this.worktree });
    const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: this.worktree, encoding: "utf8" }).trim();
    return { branch: this.branch, commit };
  }
  async writeKnowledgeDocument(targetPath: string, content: string): Promise<void> {
    if (!this.worktree) throw new Error("Git worktree has not been created");
    const target = join(this.worktree, targetPath);
    await mkdir(join(target, ".."), { recursive: true });
    await writeFile(target, content, "utf8");
  }
  async prepareKnowledgeReview(targetPath: string, message: string): Promise<{ branch: string; commit?: string }> {
    if (!this.branch || !this.worktree) throw new Error("Git branch has not been created");
    execFileSync("git", ["add", targetPath], { cwd: this.worktree });
    execFileSync("git", ["commit", "-m", message], { cwd: this.worktree });
    const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: this.worktree, encoding: "utf8" }).trim();
    return { branch: this.branch, commit };
  }
}
