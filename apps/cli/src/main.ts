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
  return program;
}
if (import.meta.url === `file://${process.argv[1]}`) createCli().parseAsync().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
