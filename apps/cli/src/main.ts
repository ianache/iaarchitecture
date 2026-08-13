import { Command } from "commander";

const apiBase = () => process.env.ARCHITECTURE_AI_API_URL ?? process.env.ARCHITECTURE_AI_API ?? "http://127.0.0.1:3000";
async function call(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${apiBase()}${path}`, { headers: { "content-type": "application/json" }, ...init });
  const body = await response.json().catch(() => ({})) as { code?: string; message?: string };
  if (!response.ok) { throw new Error(`${body.code ?? response.status}: ${body.message ?? JSON.stringify(body)}`); }
  return body;
}
export function createCli(): Command {
  const program = new Command().name("architecture-ai").description("Architecture AI automation interface");
  program.command("analyze").requiredOption("--requirements <text>").requiredOption("--revision <git-revision>").action(async (options) => console.log(JSON.stringify(await call("/analyses", { method: "POST", body: JSON.stringify({ requirements: options.requirements, knowledgeRevision: options.revision }) }), null, 2)));
  program.command("regenerate").argument("<analysisId>").action(async (analysisId) => console.log(JSON.stringify(await call(`/analyses/${analysisId}/regenerate`, { method: "POST" }), null, 2)));
  program.command("package").argument("<analysisId>").option("--output <directory>").action(async (analysisId, options) => console.log(JSON.stringify(await call(`/packages/${analysisId}/generate`, { method: "POST", body: JSON.stringify({ outputDirectory: options.output }) }), null, 2)));
  program.command("review").argument("<decisionId>").requiredOption("--action <action>").option("--reviewer <name>", "reviewer", "cli-user").option("--comment <text>").action(async (decisionId, options) => console.log(JSON.stringify(await call(`/decisions/${decisionId}/${options.action}`, { method: "POST", body: JSON.stringify({ reviewer: options.reviewer, comment: options.comment }) }), null, 2)));
  program.command("audit").argument("<decisionId>").action(async (decisionId) => console.log(JSON.stringify(await call(`/decisions/${decisionId}/audit`), null, 2)));
  program.command("publish").argument("<analysisId>").option("--branch <name>").action(async (analysisId, options) => console.log(JSON.stringify(await call(`/packages/${analysisId}/publish`, { method: "POST", body: JSON.stringify({ branch: options.branch }) }), null, 2)));

  program.command("knowledge-create").requiredOption("--document <json>").requiredOption("--base-revision <revision>").requiredOption("--target-path <path>").requiredOption("--category <category>").action(async (options) => console.log(JSON.stringify(await call("/knowledge-change-requests", { method: "POST", body: JSON.stringify({ document: JSON.parse(options.document), baseRevision: options.baseRevision, targetPath: options.targetPath, category: options.category }) }), null, 2)));
  program.command("knowledge-list").action(async () => console.log(JSON.stringify(await call("/knowledge-change-requests"), null, 2)));
  program.command("knowledge-get").argument("<id>").action(async (id) => console.log(JSON.stringify(await call(`/knowledge-change-requests/${id}`), null, 2)));
  program.command("knowledge-review").argument("<id>").option("--reviewer <name>", "reviewer", "cli-user").option("--comment <text>").action(async (id, options) => console.log(JSON.stringify(await call(`/knowledge-change-requests/${id}/review`, { method: "POST", body: JSON.stringify({ reviewer: options.reviewer, comment: options.comment }) }), null, 2)));
  program.command("knowledge-approve").argument("<id>").option("--reviewer <name>", "reviewer", "cli-user").option("--comment <text>").action(async (id, options) => console.log(JSON.stringify(await call(`/knowledge-change-requests/${id}/approve`, { method: "POST", body: JSON.stringify({ reviewer: options.reviewer, comment: options.comment }) }), null, 2)));
  program.command("knowledge-publish").argument("<id>").option("--branch <name>").action(async (id, options) => console.log(JSON.stringify(await call(`/knowledge-change-requests/${id}/publish`, { method: "POST", body: JSON.stringify({ branch: options.branch }) }), null, 2)));

  return program;
}
import { fileURLToPath } from "url";
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) createCli().parseAsync().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
