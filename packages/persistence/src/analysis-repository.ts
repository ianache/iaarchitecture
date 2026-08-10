import type { AnalysisRecord, AnalysisRecordInput, AnalysisResult, AnalysisSummary } from "@architecture-ai/domain";
import type { DatabaseStore } from "./database.js";

export type { AnalysisRecord, AnalysisRecordInput } from "@architecture-ai/domain";

export class AnalysisRepository {
  constructor(private readonly store: DatabaseStore) {}
  async nextId(): Promise<string> { const row = this.store.database.prepare("SELECT COUNT(*) AS count FROM analyses").get() as { count: number }; return `ANALYSIS-${Number(row.count) + 1}`; }
  async create(input: AnalysisRecordInput): Promise<AnalysisRecord> {
    const now = new Date().toISOString();
    this.store.database.prepare("INSERT INTO analyses (id, requirements, knowledge_revision, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(input.id, input.requirements, input.knowledgeRevision, input.status ?? "DRAFT", now, now);
    return { ...input, status: input.status ?? "DRAFT", createdAt: now, updatedAt: now };
  }
  async get(id: string): Promise<AnalysisRecord | undefined> {
    const row = this.store.database.prepare("SELECT * FROM analyses WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    return row ? this.map(row) : undefined;
  }
  async list(): Promise<AnalysisSummary[]> {
    const rows = this.store.database.prepare("SELECT id, requirements, knowledge_revision, status, created_at, updated_at, result_json FROM analyses ORDER BY updated_at DESC").all() as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      id: String(row.id),
      requirements: String(row.requirements),
      knowledgeRevision: String(row.knowledge_revision),
      status: String(row.status),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      hasResult: row.result_json !== null,
    }));
  }
  async updateResult(id: string, result: AnalysisResult): Promise<void> {
    const now = new Date().toISOString();
    const response = this.store.database.prepare("UPDATE analyses SET result_json = ?, status = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(result), result.packageStatus.value, now, id);
    if (Number(response.changes) !== 1) throw new Error(`Analysis not found: ${id}`);
  }
  private map(row: Record<string, unknown>): AnalysisRecord { return { id: String(row.id), requirements: String(row.requirements), knowledgeRevision: String(row.knowledge_revision), status: String(row.status), result: row.result_json ? JSON.parse(String(row.result_json)) as AnalysisResult : undefined, createdAt: String(row.created_at), updatedAt: String(row.updated_at) }; }
}
