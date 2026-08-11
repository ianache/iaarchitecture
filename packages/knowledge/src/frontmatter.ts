import type { KnowledgeItem } from "@architecture-ai/domain";
import { knowledgeItemSchema } from "@architecture-ai/domain";

function parseValue(value: string): string | string[] {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return trimmed.slice(1, -1).split(",").map((v) => v.trim().replace(/^['\"]|['\"]$/g, "")).filter(Boolean);
  return trimmed.replace(/^['\"]|['\"]$/g, "");
}

export function parseKnowledgeDocument(markdown: string, path: string, revision = "working-tree"): KnowledgeItem {
  const invalid = (message: string): never => { throw Object.assign(new Error(message), { code: "INVALID_OKF_METADATA" }); };
  if (!markdown.startsWith("---")) return invalid(`Knowledge document ${path} is missing frontmatter`);
  const end = markdown.indexOf("\n---", 3);
  if (end < 0) return invalid(`Knowledge document ${path} has unterminated frontmatter`);
  const metadata: Record<string, string | string[]> = {};
  for (const line of markdown.slice(3, end).split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    metadata[line.slice(0, separator).trim()] = parseValue(line.slice(separator + 1));
  }
  const content = markdown.slice(end + 4).trim();
  try { return knowledgeItemSchema.parse({ ...metadata, revision, sourcePath: path, content, tags: metadata.tags ?? [] }); } catch { return invalid(`Knowledge document ${path} has invalid OKF metadata`); }
}
