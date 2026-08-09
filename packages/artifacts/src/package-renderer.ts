import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AnalysisResult, ArchitecturePackage, PackageRenderer } from "@architecture-ai/domain";
import { renderAdr } from "./adr-renderer.js";
import { renderContextJson } from "./json-renderer.js";
import { renderMarkdown } from "./markdown-renderer.js";
import { renderDiagrams } from "./mermaid-renderer.js";
export class FilePackageRenderer implements PackageRenderer {
  async renderPackage(result: AnalysisResult, outputDirectory: string): Promise<ArchitecturePackage> { const files: string[] = []; const write = async (path: string, content: string) => { await mkdir(join(outputDirectory, path, ".."), { recursive: true }); await writeFile(join(outputDirectory, path), content, "utf8"); files.push(path); }; for (const [path, content] of Object.entries(renderMarkdown(result))) await write(path, content); await write("architecture-context.json", renderContextJson(result.context)); for (const decision of result.context.decisions.filter((item) => item.significant)) await write(`09-adr/${decision.id}.md`, renderAdr(decision)); for (const [path, content] of Object.entries(renderDiagrams(result.context))) await write(`diagrams/${path}`, content); return { directory: outputDirectory, files, context: result.context }; }
}
