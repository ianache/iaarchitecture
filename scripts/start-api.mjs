import { execFileSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const buildCommand = process.platform === "win32"
  ? 'pnpm --filter @architecture-ai/api... build'
  : 'pnpm --filter @architecture-ai/api... build';

execSync(buildCommand, { cwd: projectRoot, stdio: "inherit", shell: true });

const { GitKnowledgeRepository } = await import(new URL("../packages/knowledge/dist/index.js", import.meta.url));
const { RetrievalService } = await import(new URL("../packages/retrieval/dist/index.js", import.meta.url));
const { startServer } = await import(new URL("../apps/api/dist/server.js", import.meta.url));
const { DeterministicModel } = await import(new URL("../packages/test-fixtures/dist/index.js", import.meta.url));

const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const snapshot = await new GitKnowledgeRepository(process.cwd()).readRevision(revision);
const retrieval = new RetrievalService();
await retrieval.buildProjections(snapshot);
await startServer(retrieval, new DeterministicModel(), Number(process.env.ARCHITECTURE_AI_PORT ?? 3000), revision);
