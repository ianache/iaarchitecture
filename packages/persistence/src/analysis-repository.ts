import type { AnalysisRecord, AnalysisRecordInput, AnalysisResult, AnalysisResultVersion, AnalysisSummary } from "@architecture-ai/domain";
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
  async updatePackageStatus(id: string, status: AnalysisResult["packageStatus"]["value"]): Promise<void> {
    const record = await this.get(id);
    if (!record?.result) return;
    const result = { ...record.result, packageStatus: { ...record.result.packageStatus, value: status }, context: { ...record.result.context, status: { ...record.result.context.status, value: status } } };
    await this.updateResult(id, result);
  }
  async markRegenerationRequired(id: string, reason: string): Promise<void> {
    const record = await this.get(id);
    if (!record?.result) return;
    const current = record.result;
    if (!current.packageStatus.diagnostics?.some((diagnostic) => diagnostic.startsWith("Regeneration required:"))) {
      const generation = current.generation ?? 1;
      this.store.database.prepare("INSERT OR IGNORE INTO analysis_result_versions (analysis_id, generation, result_json, archived_at, reason) VALUES (?, ?, ?, ?, ?)").run(id, generation, JSON.stringify(current), new Date().toISOString(), reason);
    }
    const diagnostic = `Regeneration required: ${reason}`;
    const diagnostics = [...(current.packageStatus.diagnostics ?? []).filter((item) => !item.startsWith("Regeneration required:")), diagnostic];
    await this.updateResult(id, { ...current, generation: current.generation ?? 1, packageStatus: { ...current.packageStatus, value: "DRAFT", diagnostics }, context: { ...current.context, status: { ...current.context.status, value: "DRAFT", diagnostics } } });
  }
  async listResultHistory(id: string): Promise<AnalysisResultVersion[]> {
    const rows = this.store.database.prepare("SELECT analysis_id, generation, result_json, archived_at, reason FROM analysis_result_versions WHERE analysis_id = ? ORDER BY generation").all(id) as Array<{ analysis_id: string; generation: number; result_json: string; archived_at: string; reason: string }>;
    return rows.map((row) => ({ analysisId: row.analysis_id, generation: Number(row.generation), result: JSON.parse(row.result_json) as AnalysisResult, archivedAt: row.archived_at, reason: row.reason }));
  }
  private map(row: Record<string, unknown>): AnalysisRecord { return { id: String(row.id), requirements: String(row.requirements), knowledgeRevision: String(row.knowledge_revision), status: String(row.status), result: row.result_json ? JSON.parse(String(row.result_json)) as AnalysisResult : undefined, createdAt: String(row.created_at), updatedAt: String(row.updated_at) }; }
}
