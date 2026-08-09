import { createHash } from "node:crypto";
import type { Requirement } from "@architecture-ai/domain";
export function normalizeRequirements(raw: string | Array<Partial<Requirement>>): Requirement[] {
  if (Array.isArray(raw)) return raw.map((item, index) => ({ id: item.id ?? `REQ-${index + 1}-${createHash("sha1").update(item.description ?? item.title ?? "").digest("hex").slice(0, 8)}`, title: item.title ?? `Requirement ${index + 1}`, description: item.description ?? "", source: item.source, priority: item.priority, tags: item.tags ?? [] }));
  return raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((description, index) => ({ id: `REQ-${index + 1}-${createHash("sha1").update(description).digest("hex").slice(0, 8)}`, title: `Requirement ${index + 1}`, description, tags: [] }));
}
