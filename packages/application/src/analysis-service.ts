import type { AnalysisRecord, AnalysisRequest } from "@architecture-ai/domain";
import { ArchitectureOrchestrator } from "@architecture-ai/orchestrator";
import { AnalysisRepository, ReviewRepository } from "@architecture-ai/persistence";
import { ApplicationError } from "./errors.js";

export class AnalysisService {
  constructor(private readonly orchestrator: ArchitectureOrchestrator, private readonly analyses: AnalysisRepository, private readonly reviews: ReviewRepository) {}
  async create(input: AnalysisRequest): Promise<AnalysisRecord> {
    const id = await this.analyses.nextId();
    await this.analyses.create({ id, requirements: input.requirements, knowledgeRevision: input.knowledgeRevision });
    try {
      const result = await this.orchestrator.run({ ...input, analysisId: id });
      await this.analyses.updateResult(id, result);
      await Promise.all(result.context.decisions.map((decision) => this.reviews.saveDecision(id, decision)));
      const record = await this.analyses.get(id);
      if (!record) throw new ApplicationError("PERSISTENCE_ERROR", `Created analysis could not be read: ${id}`);
      return record;
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError("PACKAGE_GENERATION_FAILED", error instanceof Error ? error.message : "Analysis generation failed", { cause: error });
    }
  }
  async get(id: string): Promise<AnalysisRecord> { const record = await this.analyses.get(id); if (!record) throw new ApplicationError("NOT_FOUND", `Analysis not found: ${id}`); return record; }
}
