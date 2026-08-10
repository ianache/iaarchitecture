import { join } from "node:path";
import type { ArchitecturePackage, PackageGenerationResult, PackageRenderer } from "@architecture-ai/domain";
import { AnalysisRepository } from "@architecture-ai/persistence";
import { ApplicationError } from "./errors.js";

export class PackageService {
  constructor(private readonly analyses: AnalysisRepository, private readonly renderer: PackageRenderer, private readonly outputDirectory = ".architecture-ai/packages") {}
  async generate(id: string, outputDirectory = this.outputDirectory): Promise<PackageGenerationResult> {
    const record = await this.analyses.get(id);
    if (!record) throw new ApplicationError("NOT_FOUND", `Analysis not found: ${id}`);
    if (!record.result) throw new ApplicationError("PACKAGE_GENERATION_FAILED", `Analysis has no result: ${id}`);
    try {
      const rendered: ArchitecturePackage = await this.renderer.renderPackage(record.result, join(outputDirectory, id));
      return { analysisId: id, directory: rendered.directory, files: rendered.files, context: rendered.context };
    } catch (error) {
      throw new ApplicationError("PACKAGE_GENERATION_FAILED", error instanceof Error ? error.message : `Package generation failed: ${id}`, { cause: error });
    }
  }
}
