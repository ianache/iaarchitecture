import { execFileSync } from "node:child_process";
import { GitKnowledgeRepository } from "../packages/knowledge/dist/index.js";
import { RetrievalService } from "../packages/retrieval/dist/index.js";
import { startServer } from "../apps/api/dist/server.js";
import { DeterministicModel } from "../packages/test-fixtures/dist/index.js";

const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const snapshot = await new GitKnowledgeRepository(process.cwd()).readRevision(revision);
const retrieval = new RetrievalService();
await retrieval.buildProjections(snapshot);
await startServer(retrieval, new DeterministicModel(), Number(process.env.ARCHITECTURE_AI_PORT ?? 3000));
