import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { AnalysisResult, ArchitectureModel, EvidenceRetriever, Review } from "@architecture-ai/domain";
import { ArchitectureOrchestrator } from "@architecture-ai/orchestrator";
import { AnalysisRepository, DatabaseStore, ReviewRepository } from "@architecture-ai/persistence";

const requestSchema = z.object({ requirements: z.string().min(1), knowledgeRevision: z.string().min(1) });
const reviewSchema = z.object({ reviewer: z.string().min(1).default("human"), comment: z.string().optional() });
export interface ApiDependencies { orchestrator: ArchitectureOrchestrator; analysisRepository?: AnalysisRepository; reviewRepository?: ReviewRepository; }

export function buildApp(dependencies: ApiDependencies): FastifyInstance {
  const app = Fastify({ logger: false });
  const store = dependencies.analysisRepository && dependencies.reviewRepository ? undefined : DatabaseStore.open(process.env.ARCHITECTURE_AI_DB ?? ".architecture-ai/architecture-ai.sqlite");
  const analyses = dependencies.analysisRepository ?? new AnalysisRepository(store!);
  const reviews = dependencies.reviewRepository ?? new ReviewRepository(store!);
  const allowedOrigins = new Set((process.env.ARCHITECTURE_AI_CORS_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173").split(",").map((origin) => origin.trim()));
  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;
    if (origin && allowedOrigins.has(origin)) reply.header("access-control-allow-origin", origin);
    reply.header("access-control-allow-methods", "GET,POST,OPTIONS");
    reply.header("access-control-allow-headers", "content-type");
    reply.header("vary", "Origin");
    if (request.method === "OPTIONS") return reply.code(204).send();
  });
  app.addHook("onClose", async () => store?.close());

  app.post("/analyses", async (request, reply) => {
    const parsed = requestSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ code: "INVALID_REQUEST", issues: parsed.error.issues });
    const id = await analyses.nextId();
    await analyses.create({ id, requirements: parsed.data.requirements, knowledgeRevision: parsed.data.knowledgeRevision });
    try {
      const result = await dependencies.orchestrator.run({ ...parsed.data, analysisId: id });
      await analyses.updateResult(id, result);
      await Promise.all(result.context.decisions.map((decision) => reviews.saveDecision(id, decision)));
      return reply.code(201).send({ id, status: result.packageStatus, traceability: result.context.links.length });
    } catch (error) {
      return reply.code(500).send({ code: "PACKAGE_GENERATION_FAILED", message: error instanceof Error ? error.message : "Package generation failed" });
    }
  });
  app.get<{ Params: { id: string } }>("/analyses/:id", async (request, reply) => {
    const record = await analyses.get(request.params.id);
    if (!record?.result) return reply.code(404).send({ code: "NOT_FOUND" });
    return record.result;
  });
  app.get<{ Params: { id: string } }>("/packages/:id", async (request, reply) => {
    const record = await analyses.get(request.params.id);
    if (!record?.result) return reply.code(404).send({ code: "NOT_FOUND" });
    return record.result;
  });
  app.get<{ Params: { id: string } }>("/packages/:id/traceability", async (request, reply) => {
    const record = await analyses.get(request.params.id);
    if (!record?.result) return reply.code(404).send({ code: "NOT_FOUND" });
    return { links: record.result.context.links };
  });
  app.get<{ Params: { id: string } }>("/packages/:id/decisions", async (request, reply) => {
    const record = await analyses.get(request.params.id);
    if (!record?.result) return reply.code(404).send({ code: "NOT_FOUND" });
    return { decisions: await reviews.listDecisions(request.params.id) };
  });
  app.post<{ Params: { id: string; action: string }; Body: unknown }>("/decisions/:id/:action", async (request, reply) => {
    const action = request.params.action.toLowerCase();
    if (!["review", "approve", "reject", "request-changes"].includes(action)) return reply.code(400).send({ code: "INVALID_REQUEST" });
    const parsed = reviewSchema.safeParse(request.body ?? {});
    if (!parsed.success) return reply.code(400).send({ code: "INVALID_REQUEST", issues: parsed.error.issues });
    const decision = await reviews.getDecision(request.params.id);
    if (!decision) return reply.code(404).send({ code: "NOT_FOUND" });
    if (action === "approve" && decision.status !== "REVIEWED") return reply.code(409).send({ code: "INVALID_REVIEW_TRANSITION", message: "Decision must be REVIEWED before APPROVED" });
    if (action === "review" && decision.status !== "DRAFT") return reply.code(409).send({ code: "INVALID_REVIEW_TRANSITION" });
    const nextStatus = action === "approve" ? "APPROVED" : action === "review" ? "REVIEWED" : "DRAFT";
    decision.status = nextStatus;
    const review: Review = { id: `REVIEW-${Date.now()}`, decisionId: decision.id, reviewer: parsed.data.reviewer, action: action === "request-changes" ? "REQUEST_CHANGES" : action.toUpperCase() as Review["action"], comment: parsed.data.comment, at: new Date().toISOString() };
    await reviews.updateDecision(decision);
    await reviews.recordReview(review);
    return { decision, review };
  });
  return app;
}

export function createDefaultApp(retriever: EvidenceRetriever, model: ArchitectureModel): FastifyInstance { return buildApp({ orchestrator: new ArchitectureOrchestrator(retriever, model) }); }
