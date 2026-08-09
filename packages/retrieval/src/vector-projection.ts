import type { KnowledgeItem } from "@architecture-ai/domain";
export interface EmbeddingProvider { embed(text: string): Promise<number[]>; }
export class DeterministicEmbeddingProvider implements EmbeddingProvider { async embed(text: string): Promise<number[]> { return [text.length % 101, text.split(/\s+/).length % 101, [...text].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 101]; } }
export class VectorProjection {
  private vectors = new Map<string, number[]>();
  constructor(private readonly provider: EmbeddingProvider = new DeterministicEmbeddingProvider()) {}
  async build(items: KnowledgeItem[]): Promise<void> { this.vectors.clear(); for (const item of items) this.vectors.set(item.id, await this.provider.embed(`${item.title} ${item.summary} ${item.content ?? ""} ${item.tags.join(" ")}`)); }
  async score(item: KnowledgeItem, query: string): Promise<number> { const vector = this.vectors.get(item.id) ?? []; const target = await this.provider.embed(query); return 1 / (1 + vector.reduce((sum, value, index) => sum + Math.abs(value - (target[index] ?? 0)), 0)); }
}
