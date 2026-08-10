import { execFileSync } from "node:child_process";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createDefaultApp } from "../../apps/api/dist/app.js";
import { FilePackageRenderer } from "@architecture-ai/artifacts";
import { GitKnowledgeRepository } from "@architecture-ai/knowledge";
import { ArchitectureOrchestrator } from "@architecture-ai/orchestrator";
import { RetrievalService } from "@architecture-ai/retrieval";
import { DeterministicModel, referenceRequirements } from "@architecture-ai/test-fixtures";

describe("Architecture AI vertical slice", () => {
  it("generates a pinned, traceable package", async () => {
    const root = process.cwd();
    const revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    const snapshot = await new GitKnowledgeRepository(root).readRevision(revision);
    const retrieval = new RetrievalService();
    await retrieval.buildProjections(snapshot);
    const result = await new ArchitectureOrchestrator(retrieval, new DeterministicModel()).run({ requirements: referenceRequirements, knowledgeRevision: revision });
    expect(result.context.revision).toBe(revision);
    expect(result.context.requirements.length).toBeGreaterThan(2);
    expect(result.context.links.length).toBeGreaterThan(0);
    expect(result.packageStatus.value).toBe("DRAFT");
    const output = await new FilePackageRenderer().renderPackage(result, await mkdtemp(join(tmpdir(), "architecture-package-")));
    expect(output.files).toContain("architecture-context.json");
    expect(output.files).toContain("diagrams/integration-view.mmd");
    expect(output.files.some((file) => file.startsWith("09-adr/"))).toBe(true);
  });

  it("preserves generated package data across an API restart without rewriting files", async () => {
    const root = process.cwd();
    const revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    const databasePath = ".architecture-ai/e2e-restart-test.sqlite";
    const outputDirectory = ".architecture-ai/e2e-restart-test-packages";
    const previousDatabasePath = process.env.ARCHITECTURE_AI_DB;
    const retrieval = new RetrievalService();
    const snapshot = await new GitKnowledgeRepository(root).readRevision(revision);
    let app: ReturnType<typeof createDefaultApp> | undefined;
    let reopenedApp: ReturnType<typeof createDefaultApp> | undefined;

    await rm(databasePath, { force: true });
    await rm(outputDirectory, { recursive: true, force: true });
    process.env.ARCHITECTURE_AI_DB = databasePath;

    try {
      await retrieval.buildProjections(snapshot);
      app = createDefaultApp(retrieval, new DeterministicModel(), revision);
      const created = await app.inject({ method: "POST", url: "/analyses", payload: { requirements: referenceRequirements, knowledgeRevision: revision } });
      expect(created.statusCode).toBe(201);
      const analysisId = created.json().id as string;

      const generated = await app.inject({ method: "POST", url: `/packages/${analysisId}/generate`, payload: { outputDirectory } });
      expect(generated.statusCode).toBe(201);
      const generatedPackage = generated.json() as { directory: string };
      const generatedFile = join(generatedPackage.directory, "architecture-context.json");
      const beforeRead = await stat(generatedFile);
      const initialPackage = await app.inject({ method: "GET", url: `/packages/${analysisId}` });
      expect(initialPackage.statusCode).toBe(200);

      await app.close();
      app = undefined;
      reopenedApp = createDefaultApp(retrieval, new DeterministicModel(), revision);

      const history = await reopenedApp.inject({ method: "GET", url: "/analyses" });
      expect(history.statusCode).toBe(200);
      expect(history.json().analyses).toEqual([expect.objectContaining({ id: analysisId, knowledgeRevision: revision, hasResult: true })]);

      const reopenedPackage = await reopenedApp.inject({ method: "GET", url: `/packages/${analysisId}` });
      expect(reopenedPackage.statusCode).toBe(200);
      expect(reopenedPackage.json().context).toMatchObject({
        revision: initialPackage.json().context.revision,
        decisions: initialPackage.json().context.decisions,
        links: initialPackage.json().context.links
      });
      expect((await stat(generatedFile)).mtimeMs).toBe(beforeRead.mtimeMs);
    } finally {
      await app?.close();
      await reopenedApp?.close();
      if (previousDatabasePath === undefined) delete process.env.ARCHITECTURE_AI_DB;
      else process.env.ARCHITECTURE_AI_DB = previousDatabasePath;
      await rm(databasePath, { force: true });
      await rm(outputDirectory, { recursive: true, force: true });
    }
  });
});
