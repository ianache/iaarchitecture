import { afterEach, describe, expect, it } from "vitest";
import { rmSync } from "node:fs";
import { join } from "node:path";
import type { AnalysisResult, ArchitecturePackage, PackageRenderer } from "@architecture-ai/domain";
import { AnalysisRepository, DatabaseStore } from "@architecture-ai/persistence";
import { PackageService } from "./package-service.js";

const databasePath = ".architecture-ai/package-service-test.sqlite";
const result: AnalysisResult = { context: { revision: "abc", requirements: [], drivers: [], evidence: [], decisions: [], artifacts: [], links: [], status: { value: "DRAFT", requiredDecisionIds: [], approvedDecisionIds: [] } }, findings: [], risks: [], artifacts: [], packageStatus: { value: "DRAFT", requiredDecisionIds: [], approvedDecisionIds: [] } };
const renderer: PackageRenderer = { renderPackage: async (_value, outputDirectory): Promise<ArchitecturePackage> => ({ directory: outputDirectory, files: ["01-architecture-analysis.md", "architecture-context.json", "09-adr/ADR-1.md", "diagrams/context.mmd"], context: result.context }) };
afterEach(() => rmSync(databasePath, { force: true }));

describe("PackageService", () => {
  it("generates from a stored result without rerunning orchestration", async () => { const store = DatabaseStore.open(databasePath); try { const analyses = new AnalysisRepository(store); await analyses.create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" }); await analyses.updateResult("ANALYSIS-1", result); const generated = await new PackageService(analyses, renderer).generate("ANALYSIS-1", ".architecture-ai/packages"); expect(generated.directory).toBe(join(".architecture-ai/packages", "ANALYSIS-1")); expect(generated.files).toContain("architecture-context.json"); expect(generated.files).toContain("diagrams/context.mmd"); } finally { store.close(); } });
  it("rejects an analysis without a stored result", async () => { const store = DatabaseStore.open(databasePath); try { const analyses = new AnalysisRepository(store); await analyses.create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" }); await expect(new PackageService(analyses, renderer).generate("ANALYSIS-1")).rejects.toMatchObject({ code: "PACKAGE_GENERATION_FAILED" }); } finally { store.close(); } });
});
