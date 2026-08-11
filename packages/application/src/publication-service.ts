import { join } from "node:path";
import type { PackagePublicationResult, PackageRenderer, GitWorkspace } from "@architecture-ai/domain";
import { AnalysisRepository } from "@architecture-ai/persistence";
import { ApplicationError } from "./errors.js";

export class PublicationService {
  constructor(private readonly analyses: AnalysisRepository, private readonly renderer: PackageRenderer, private readonly workspaceFactory: () => GitWorkspace) {}
  async publish(id: string, branch = `architecture/${id.toLowerCase()}`): Promise<PackagePublicationResult> {
    const record = await this.analyses.get(id);
    if (!record) throw new ApplicationError("NOT_FOUND", `Analysis not found: ${id}`);
    if (!record.result) throw new ApplicationError("PACKAGE_NOT_READY", `Analysis has no result: ${id}`);
    if (record.result.packageStatus.value !== "APPROVED") throw new ApplicationError("INVALID_PACKAGE_STATUS", `Package must be APPROVED before Git publication: ${id}`);
    try {
      const workspace = this.workspaceFactory();
      try { await workspace.createBranch(branch, record.knowledgeRevision); } catch (error) { throw new ApplicationError("INVALID_REVISION", `Knowledge revision is not a valid Git revision: ${record.knowledgeRevision}`, { cause: error }); }
      const directory = join(workspace.getWorkingDirectory(), "packages", id);
      const rendered = await this.renderer.renderPackage(record.result, directory);
      const review = await workspace.prepareReview(`Publish architecture package ${id}`);
      return { analysisId: id, branch: review.branch, commit: review.commit, directory: rendered.directory, files: rendered.files };
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError("GIT_PUBLICATION_FAILED", error instanceof Error ? error.message : `Git publication failed: ${id}`, { cause: error });
    }
  }
}
