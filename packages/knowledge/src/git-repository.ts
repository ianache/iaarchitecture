import { execFileSync } from "node:child_process";
import type { KnowledgeSnapshot, KnowledgeSource } from "@architecture-ai/domain";
import { parseKnowledgeDocument } from "./frontmatter.js";
import { loadOntology } from "./ontology.js";

function git(args: string[], cwd: string): string { return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }

export class GitKnowledgeRepository implements KnowledgeSource {
  constructor(private readonly root: string) {}
  readRevision(revision: string): Promise<KnowledgeSnapshot> {
    let resolved: string;
    try { resolved = git(["rev-parse", "--verify", `${revision}^{commit}`], this.root); } catch (error) { throw Object.assign(new Error(`Git revision is invalid: ${revision}`), { code: "INVALID_REVISION", cause: error }); }

    const trackedFiles = git(["ls-tree", "-r", "--name-only", resolved, "--", "knowledge"], this.root)
      .split(/\r?\n/)
      .map((file) => file.trim())
      .filter((file) => file.length > 0 && file.endsWith(".md"));

    const items = trackedFiles.map((file) => parseKnowledgeDocument(git(["show", `${resolved}:${file}`], this.root), file, resolved));
    const ontology = loadOntology(git(["show", `${resolved}:ontology/architecture-ontology.yaml`], this.root));
    return Promise.resolve({ revision: resolved, items, ontology });
  }
}
