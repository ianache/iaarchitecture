import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { GitWorkspace } from "@architecture-ai/domain";
export class LocalGitWorkspace implements GitWorkspace {
  private branch = "";
  constructor(private readonly root: string) {}
  async createBranch(name: string, revision: string): Promise<string> { execFileSync("git", ["rev-parse", "--verify", `${revision}^{commit}`], { cwd: this.root }); execFileSync("git", ["switch", "-c", name, revision], { cwd: this.root }); this.branch = name; return name; }
  async writePackage(directory: string, files: Record<string, string>): Promise<void> { for (const [path, content] of Object.entries(files)) { const target = join(directory, path); await mkdir(join(target, ".."), { recursive: true }); await writeFile(target, content, "utf8"); } }
  async prepareReview(message: string): Promise<{ branch: string; commit?: string }> { if (!this.branch) throw new Error("Git branch has not been created"); execFileSync("git", ["add", "."], { cwd: this.root }); execFileSync("git", ["commit", "-m", message], { cwd: this.root }); const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: this.root, encoding: "utf8" }).trim(); return { branch: this.branch, commit }; }
}
