import type { KnowledgeItem, KnowledgeSnapshot, ProjectionRevision } from "@architecture-ai/domain";

export class SQLiteProjectionStore {
  private revision = "";
  private items: KnowledgeItem[] = [];
  setSnapshot(snapshot: KnowledgeSnapshot): ProjectionRevision { this.revision = snapshot.revision; this.items = snapshot.items; return { revision: this.revision, indexedItems: this.items.length }; }
  getRevision(): string { return this.revision; }
  getItems(): KnowledgeItem[] { return [...this.items]; }
}
