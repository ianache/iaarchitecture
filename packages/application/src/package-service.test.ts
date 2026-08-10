import { afterEach, describe, expect, it } from "vitest";
import { rmSync } from "node:fs";
import { join } from "node:path";
import type { AnalysisResult, ArchitecturePackage, PackageRenderer } from "@architecture-ai/domain";
import { AnalysisRepository, DatabaseStore } from "@architecture-ai/persistence";
import { PackageService } from "./package-service.js";

const databasePath = ".architecture-ai/package-service-test.sqlite";
const result: AnalysisResult = { context: { revision: "abc", requirements: [], drivers: [], evidence: [], decisions: [], artifacts: [], links: [], status: { value: "DRAFT", requiredDecisionIds: [], approvedDecisionIds: [] } }, findings: [], risks: [], artifacts: [], packageStatus: { value: "DRAFT", requiredDecisionIds: [], approvedDecisionIds: [] } };
let renderCalls = 0;
const renderer: PackageRenderer = { renderPackage: async (_value, outputDirectory): Promise<ArchitecturePackage> => { renderCalls += 1; return { directory: outputDirectory, files: ["01-architecture-analysis.md", "architecture-context.json", "09-adr/ADR-1.md", "diagrams/context.mmd"], context: result.context }; } };
afterEach(() => rmSync(databasePath, { force: true }));

describe("PackageService", () => {
  it("reads a stored result without invoking the renderer", async () => { const store = DatabaseStore.open(databasePath); try { const analyses = new AnalysisRepository(store); await analyses.create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" }); await analyses.updateResult("ANALYSIS-1", result); renderCalls = 0; await expect(new PackageService(analyses, renderer).get("ANALYSIS-1")).resolves.toEqual(result); expect(renderCalls).toBe(0); } finally { store.close(); } });
  it("rejects an unknown analysis when reading", async () => { const store = DatabaseStore.open(databasePath); try { await expect(new PackageService(new AnalysisRepository(store), renderer).get("UNKNOWN")).rejects.toMatchObject({ code: "NOT_FOUND" }); } finally { store.close(); } });
  it("rejects a stored analysis without a result when reading", async () => { const store = DatabaseStore.open(databasePath); try { const analyses = new AnalysisRepository(store); await analyses.create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" }); await expect(new PackageService(analyses, renderer).get("ANALYSIS-1")).rejects.toMatchObject({ code: "PACKAGE_NOT_READY" }); } finally { store.close(); } });
  it("generates from a stored result without rerunning orchestration", async () => { const store = DatabaseStore.open(databasePath); try { const analyses = new AnalysisRepository(store); await analyses.create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" }); await analyses.updateResult("ANALYSIS-1", result); const generated = await new PackageService(analyses, renderer).generate("ANALYSIS-1", ".architecture-ai/packages"); expect(generated.directory).toBe(join(".architecture-ai/packages", "ANALYSIS-1")); expect(generated.files).toContain("architecture-context.json"); expect(generated.files).toContain("diagrams/context.mmd"); } finally { store.close(); } });
  it("rejects an analysis without a stored result", async () => { const store = DatabaseStore.open(databasePath); try { const analyses = new AnalysisRepository(store); await analyses.create({ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc" }); await expect(new PackageService(analyses, renderer).generate("ANALYSIS-1")).rejects.toMatchObject({ code: "PACKAGE_GENERATION_FAILED" }); } finally { store.close(); } });
});
