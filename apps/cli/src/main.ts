import { Command } from "commander";

const apiBase = () => process.env.ARCHITECTURE_AI_API ?? "http://127.0.0.1:3000";
async function call(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${apiBase()}${path}`, { headers: { "content-type": "application/json" }, ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) { throw new Error(`${response.status}: ${JSON.stringify(body)}`); }
  return body;
}
export function createCli(): Command {
  const program = new Command().name("architecture-ai").description("Architecture AI automation interface");
  program.command("analyze").requiredOption("--requirements <text>").requiredOption("--revision <git-revision>").action(async (options) => console.log(JSON.stringify(await call("/analyses", { method: "POST", body: JSON.stringify({ requirements: options.requirements, knowledgeRevision: options.revision }) }), null, 2)));
  program.command("package").argument("<analysisId>").action(async (analysisId) => console.log(JSON.stringify(await call(`/packages/${analysisId}`), null, 2)));
  program.command("review").argument("<decisionId>").requiredOption("--action <action>").option("--reviewer <name>", "reviewer", "cli-user").option("--comment <text>").action(async (decisionId, options) => console.log(JSON.stringify(await call(`/decisions/${decisionId}/${options.action}`, { method: "POST", body: JSON.stringify({ reviewer: options.reviewer, comment: options.comment }) }), null, 2)));
  return program;
}
if (import.meta.url === `file://${process.argv[1]}`) createCli().parseAsync().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
