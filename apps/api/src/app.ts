import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { AnalysisResult, ArchitectureModel, EvidenceRetriever } from "@architecture-ai/domain";
import { ArchitectureOrchestrator } from "@architecture-ai/orchestrator";
const requestSchema = z.object({ requirements: z.string().min(1), knowledgeRevision: z.string().min(1) });
export interface ApiDependencies { orchestrator: ArchitectureOrchestrator; }
export function buildApp(dependencies: ApiDependencies): FastifyInstance {
  const app = Fastify({ logger: false });
  const analyses = new Map<string, AnalysisResult>();
  app.post("/analyses", async (request, reply) => { const parsed = requestSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ code: "INVALID_REQUEST", issues: parsed.error.issues }); const id = `ANALYSIS-${analyses.size + 1}`; const result = await dependencies.orchestrator.run({ ...parsed.data, analysisId: id }); analyses.set(id, result); return reply.code(201).send({ id, status: result.packageStatus, traceability: result.context.links.length }); });
  app.get<{ Params: { id: string } }>("/analyses/:id", async (request, reply) => { const result = analyses.get(request.params.id); if (!result) return reply.code(404).send({ code: "NOT_FOUND" }); return result; });
  app.get<{ Params: { id: string } }>("/packages/:id", async (request, reply) => { const result = analyses.get(request.params.id); if (!result) return reply.code(404).send({ code: "NOT_FOUND" }); return result.context; });
  app.get<{ Params: { id: string } }>("/packages/:id/traceability", async (request, reply) => { const result = analyses.get(request.params.id); if (!result) return reply.code(404).send({ code: "NOT_FOUND" }); return { links: result.context.links }; });
  app.get<{ Params: { id: string } }>("/packages/:id/decisions", async (request, reply) => { const result = analyses.get(request.params.id); if (!result) return reply.code(404).send({ code: "NOT_FOUND" }); return { decisions: result.context.decisions }; });
  return app;
}
export function createDefaultApp(retriever: EvidenceRetriever, model: ArchitectureModel): FastifyInstance { return buildApp({ orchestrator: new ArchitectureOrchestrator(retriever, model) }); }
