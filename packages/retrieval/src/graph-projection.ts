import type { KnowledgeItem } from "@architecture-ai/domain";
export class GraphProjection {
  private neighbors = new Map<string, string[]>();
  build(items: KnowledgeItem[]): void { this.neighbors.clear(); for (const item of items) this.neighbors.set(item.id, item.relatedIds ?? []); }
  related(id: string): string[] { return this.neighbors.get(id) ?? []; }
}
