import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AnalysisResult } from "@architecture-ai/domain";
import { FilePackageRenderer } from "./package-renderer.js";
const result: AnalysisResult = { context: { revision: "abc", requirements: [], drivers: [], evidence: [], decisions: [{ id: "DEC-1", title: "Use contracts", context: "ctx", decision: "Version contracts", rationale: "stable", evidenceIds: [], sourceRequirementIds: [], significant: true, status: "DRAFT", classification: "DECISION" }], artifacts: [], links: [], status: { value: "DRAFT", requiredDecisionIds: ["DEC-1"], approvedDecisionIds: [] } }, findings: [], risks: ["security gap"], artifacts: [], packageStatus: { value: "DRAFT", requiredDecisionIds: ["DEC-1"], approvedDecisionIds: [] } };
describe("FilePackageRenderer", () => { it("renders the required package, ADR, context, and diagrams", async () => { const directory = await mkdtemp(join(tmpdir(), "architecture-ai-")); const output = await new FilePackageRenderer().renderPackage(result, directory); expect(output.files).toContain("01-architecture-analysis.md"); expect(output.files).toContain("architecture-context.json"); expect(output.files).toContain("09-adr/DEC-1.md"); expect(output.files).toContain("diagrams/system-context.mmd"); expect(await readFile(join(directory, "architecture-context.json"), "utf8")).toContain('"revision": "abc"'); }); });
