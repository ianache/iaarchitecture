import type { EvidenceRetriever, KnowledgeItem, KnowledgeSnapshot, RetrieveInput, RetrievedEvidence } from "@architecture-ai/domain";
import { GraphProjection } from "./graph-projection.js";
import { SQLiteProjectionStore } from "./sqlite.js";
import { VectorProjection } from "./vector-projection.js";

const statusRank = { APPROVED: 3, REVIEWED: 2, DRAFT: 1 } as const;
export class RetrievalService implements EvidenceRetriever {
  constructor(private readonly store = new SQLiteProjectionStore(), private readonly graph = new GraphProjection(), private readonly vector = new VectorProjection()) {}
  async buildProjections(snapshot: KnowledgeSnapshot): Promise<{ revision: string; indexedItems: number }> { const result = this.store.setSnapshot(snapshot); this.graph.build(snapshot.items); await this.vector.build(snapshot.items); return result; }
  async retrieve(input: RetrieveInput): Promise<RetrievedEvidence[]> {
    if (input.revision !== this.store.getRevision()) throw Object.assign(new Error(`Projection revision ${this.store.getRevision()} does not match requested ${input.revision}`), { code: "INVALID_REVISION" });
    const query = input.query.toLowerCase();
    const selected = this.store.getItems().filter((item) => (!input.types?.length || input.types.includes(item.type)) && (!input.domains?.length || input.domains.some((domain) => item.domains?.includes(domain))));
    const results = await Promise.all(selected.map(async (item) => {
      const text = `${item.title} ${item.summary} ${item.content ?? ""} ${item.tags.join(" ")}`.toLowerCase();
      const terms = query.split(/\s+/).filter(Boolean);
      const keyword = terms.length ? terms.filter((term) => text.includes(term)).length / terms.length : 0;
      const graphBoost = this.graph.related(item.id).length ? 0.05 : 0;
      const score = keyword * 0.7 + (await this.vector.score(item, input.query)) * 0.25 + graphBoost + statusRank[item.status] * 0.01;
      return { id: `EVIDENCE-${item.id}`, knowledgeId: item.id, sourcePath: item.sourcePath, revision: item.revision, excerpt: item.content ?? item.summary, classification: item.type, confidence: Math.min(1, score), method: keyword ? "full-text+vector" : "vector", conflictsWith: item.conflictsWith, score } satisfies RetrievedEvidence;
    }));
    return results.sort((a, b) => b.score - a.score).slice(0, input.limit ?? 10);
  }
}
