import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import type { KnowledgeSnapshot, KnowledgeSource } from "@architecture-ai/domain";
import { parseKnowledgeDocument } from "./frontmatter.js";
import { loadOntology } from "./ontology.js";

function git(args: string[], cwd: string): string { return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
function walk(dir: string): string[] { return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => { const path = join(dir, entry.name); return entry.isDirectory() ? walk(path) : [path]; }); }

export class GitKnowledgeRepository implements KnowledgeSource {
  constructor(private readonly root: string) {}
  readRevision(revision: string): Promise<KnowledgeSnapshot> {
    const resolved = git(["rev-parse", "--verify", `${revision}^{commit}`], this.root);
    const files = walk(join(this.root, "knowledge")).filter((file) => file.endsWith(".md"));
    const items = files.map((file) => parseKnowledgeDocument(git(["show", `${resolved}:${relative(this.root, file).replaceAll("\\", "/")}`], this.root), relative(this.root, file).replaceAll("\\", "/"), resolved));
    const ontology = loadOntology(git(["show", `${resolved}:ontology/architecture-ontology.yaml`], this.root));
    return Promise.resolve({ revision: resolved, items, ontology });
  }
}
