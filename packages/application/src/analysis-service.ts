import type { AnalysisRecord, AnalysisRequest, AnalysisSummary } from "@architecture-ai/domain";
import { ArchitectureOrchestrator } from "@architecture-ai/orchestrator";
import { AnalysisRepository, ReviewRepository } from "@architecture-ai/persistence";
import { ApplicationError } from "./errors.js";

export class AnalysisService {
  constructor(private readonly orchestrator: ArchitectureOrchestrator, private readonly analyses: AnalysisRepository, private readonly reviews: ReviewRepository) {}
  async create(input: AnalysisRequest): Promise<AnalysisRecord> {
    const id = await this.analyses.nextId();
    await this.analyses.create({ id, requirements: input.requirements, knowledgeRevision: input.knowledgeRevision });
    try {
      const result = { ...(await this.orchestrator.run({ ...input, analysisId: id })), generation: 1 };
      await this.analyses.updateResult(id, result);
      await Promise.all(result.context.decisions.map((decision) => this.reviews.saveDecision(id, decision)));
      const record = await this.analyses.get(id);
      if (!record) throw new ApplicationError("PERSISTENCE_ERROR", `Created analysis could not be read: ${id}`);
      return record;
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      const code = typeof error === "object" && error && "code" in error ? (error as { code?: unknown }).code : undefined;
      if (["INVALID_OKF_METADATA", "STANDARDS_CONFLICT", "INSUFFICIENT_EVIDENCE", "TRACEABILITY_INCOMPLETE", "INVALID_REVISION"].includes(String(code))) throw new ApplicationError(code as "INVALID_OKF_METADATA" | "STANDARDS_CONFLICT" | "INSUFFICIENT_EVIDENCE" | "TRACEABILITY_INCOMPLETE" | "INVALID_REVISION", error instanceof Error ? error.message : String(error), { cause: error });
      throw new ApplicationError("PACKAGE_GENERATION_FAILED", error instanceof Error ? error.message : "Analysis generation failed", { cause: error });
    }
  }
  async get(id: string): Promise<AnalysisRecord> { const record = await this.analyses.get(id); if (!record) throw new ApplicationError("NOT_FOUND", `Analysis not found: ${id}`); return record; }
  async regenerate(id: string): Promise<AnalysisRecord> {
    const record = await this.get(id);
    if (!record.result) throw new ApplicationError("PACKAGE_NOT_READY", `Analysis has no result: ${id}`);
    if (!record.result.packageStatus.diagnostics?.some((diagnostic) => diagnostic.startsWith("Regeneration required:"))) throw new ApplicationError("INVALID_PACKAGE_STATUS", `Package does not require regeneration: ${id}`);
    try {
      const result = { ...(await this.orchestrator.run({ requirements: record.requirements, knowledgeRevision: record.knowledgeRevision, analysisId: id })), generation: (record.result.generation ?? 1) + 1 };
      await this.analyses.updateResult(id, result);
      await Promise.all(result.context.decisions.map((decision) => this.reviews.saveDecision(id, decision)));
      return await this.get(id);
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError("PACKAGE_GENERATION_FAILED", error instanceof Error ? error.message : "Analysis regeneration failed", { cause: error });
    }
  }
  async list(): Promise<AnalysisSummary[]> { return this.analyses.list(); }
}
