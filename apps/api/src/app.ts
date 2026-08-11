import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import type { AnalysisResult, ArchitectureModel, EvidenceRetriever } from "@architecture-ai/domain";
import { FilePackageRenderer } from "@architecture-ai/artifacts";
import { AnalysisService, ApplicationError, GovernanceService, PackageService, PublicationService } from "@architecture-ai/application";
import { LocalGitWorkspace } from "@architecture-ai/governance";
import { ArchitectureOrchestrator } from "@architecture-ai/orchestrator";
import { AnalysisRepository, DatabaseStore, ReviewRepository } from "@architecture-ai/persistence";

const requestSchema = z.object({ requirements: z.string().min(1), knowledgeRevision: z.string().min(1) });
const reviewSchema = z.object({ reviewer: z.string().min(1).default("human"), comment: z.string().optional() });
const packageGenerationSchema = z.object({ outputDirectory: z.string().min(1).optional() }).strict();
interface PackageReadService { get(id: string): Promise<AnalysisResult>; }
export interface ApiDependencies { orchestrator: ArchitectureOrchestrator; knowledgeRevision?: string; analysisRepository?: AnalysisRepository; reviewRepository?: ReviewRepository; analysisService?: AnalysisService; packageService?: PackageService & PackageReadService; governanceService?: GovernanceService; publicationService?: PublicationService; }

function errorResponse(error: unknown): { status: number; body: { code: string; message: string } } {
  if (error instanceof ApplicationError) { const code = error.code as string; return { status: code === "NOT_FOUND" ? 404 : code === "INVALID_REVISION" || code === "INVALID_OKF_METADATA" ? 400 : code === "INVALID_REVIEW_TRANSITION" || code === "PACKAGE_NOT_READY" || code === "INVALID_PACKAGE_STATUS" || code === "STANDARDS_CONFLICT" ? 409 : code === "INSUFFICIENT_EVIDENCE" || code === "TRACEABILITY_INCOMPLETE" ? 422 : 500, body: { code: error.code, message: error.message } }; }
  return { status: 500, body: { code: "PACKAGE_GENERATION_FAILED", message: error instanceof Error ? error.message : "Request failed" } };
}

export function buildApp(dependencies: ApiDependencies): FastifyInstance {
  const app = Fastify({ logger: false });
  const store = dependencies.analysisRepository && dependencies.reviewRepository ? undefined : DatabaseStore.open(process.env.ARCHITECTURE_AI_DB ?? ".architecture-ai/architecture-ai.sqlite");
  const analyses = dependencies.analysisRepository ?? new AnalysisRepository(store!);
  const reviews = dependencies.reviewRepository ?? new ReviewRepository(store!);
  const analysisService = dependencies.analysisService ?? new AnalysisService(dependencies.orchestrator, analyses, reviews);
  const packageService = dependencies.packageService ?? new PackageService(analyses, new FilePackageRenderer()) as PackageService & PackageReadService;
  const governanceService = dependencies.governanceService ?? new GovernanceService(reviews, analyses);
  const publicationService = dependencies.publicationService ?? new PublicationService(analyses, new FilePackageRenderer(), () => new LocalGitWorkspace(process.cwd()));
  const allowedOrigins = new Set((process.env.ARCHITECTURE_AI_CORS_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173").split(",").map((origin) => origin.trim()));
  app.addHook("onRequest", async (request, reply) => { const origin = request.headers.origin; if (origin && allowedOrigins.has(origin)) reply.header("access-control-allow-origin", origin); reply.header("access-control-allow-methods", "GET,POST,OPTIONS"); reply.header("access-control-allow-headers", "content-type"); reply.header("vary", "Origin"); if (request.method === "OPTIONS") return reply.code(204).send(); });
  app.addHook("onClose", async () => store?.close());

  app.post("/analyses", async (request, reply) => { const parsed = requestSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ code: "INVALID_REQUEST", issues: parsed.error.issues }); try { const revision = parsed.data.knowledgeRevision === "HEAD" ? dependencies.knowledgeRevision ?? parsed.data.knowledgeRevision : parsed.data.knowledgeRevision; const created = await analysisService.create({ ...parsed.data, knowledgeRevision: revision }); return reply.code(201).send({ id: created.id, status: created.result?.packageStatus, traceability: created.result?.context.links.length ?? 0 }); } catch (error) { const response = errorResponse(error); return reply.code(response.status).send(response.body); } });
  app.get("/analyses", async (_request, reply) => { try { return reply.send({ analyses: await analysisService.list() }); } catch (error) { const response = errorResponse(error); return reply.code(response.status).send(response.body); } });
  app.get<{ Params: { id: string } }>("/analyses/:id", async (request, reply) => { try { const record = await analysisService.get(request.params.id); if (!record.result) return reply.code(404).send({ code: "NOT_FOUND", message: "Analysis has no result" }); return record.result; } catch (error) { const response = errorResponse(error); return reply.code(response.status).send(response.body); } });
  app.post<{ Params: { id: string }; Body: unknown }>("/packages/:id/generate", async (request, reply) => { const parsed = packageGenerationSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ code: "INVALID_REQUEST", issues: parsed.error.issues }); try { return reply.code(201).send(await packageService.generate(request.params.id, parsed.data.outputDirectory)); } catch (error) { const response = errorResponse(error); return reply.code(response.status).send(response.body); } });
  app.get<{ Params: { id: string } }>("/packages/:id", async (request, reply) => { try { return await packageService.get(request.params.id); } catch (error) { const response = errorResponse(error); return reply.code(response.status).send(response.body); } });
  app.get<{ Params: { id: string } }>("/packages/:id/traceability", async (request, reply) => { try { const record = await analysisService.get(request.params.id); if (!record.result) return reply.code(404).send({ code: "NOT_FOUND" }); return { links: record.result.context.links }; } catch (error) { const response = errorResponse(error); return reply.code(response.status).send(response.body); } });
  app.get<{ Params: { id: string } }>("/packages/:id/decisions", async (request, reply) => { try { await analysisService.get(request.params.id); return { decisions: await reviews.listDecisions(request.params.id) }; } catch (error) { const response = errorResponse(error); return reply.code(response.status).send(response.body); } });
  app.post<{ Params: { id: string }; Body: unknown }>("/packages/:id/publish", async (request, reply) => { const body = z.object({ branch: z.string().min(1).regex(/^[A-Za-z0-9._/-]+$/).optional() }).strict().safeParse(request.body ?? {}); if (!body.success) return reply.code(400).send({ code: "INVALID_REQUEST", issues: body.error.issues }); try { return reply.code(201).send(await publicationService.publish(request.params.id, body.data.branch)); } catch (error) { const response = errorResponse(error); return reply.code(response.status).send(response.body); } });
  app.post<{ Params: { id: string; action: string }; Body: unknown }>("/decisions/:id/:action", async (request, reply) => { const action = request.params.action.toLowerCase(); if (!["review", "approve", "reject", "request-changes"].includes(action)) return reply.code(400).send({ code: "INVALID_REQUEST" }); const parsed = reviewSchema.safeParse(request.body ?? {}); if (!parsed.success) return reply.code(400).send({ code: "INVALID_REQUEST", issues: parsed.error.issues }); try { const actionMethod = action === "request-changes" ? governanceService.requestChanges.bind(governanceService) : governanceService[action as "review" | "approve" | "reject"].bind(governanceService); const decision = await actionMethod(request.params.id, parsed.data.reviewer, parsed.data.comment); return { decision, review: (await governanceService.audit(request.params.id)).at(-1) }; } catch (error) { const response = errorResponse(error); return reply.code(response.status).send(response.body); } });
  app.get<{ Params: { id: string } }>("/decisions/:id/audit", async (request, reply) => { try { return { events: await governanceService.audit(request.params.id) }; } catch (error) { const response = errorResponse(error); return reply.code(response.status).send(response.body); } });
  return app;
}

export function createDefaultApp(retriever: EvidenceRetriever, model: ArchitectureModel, knowledgeRevision?: string): FastifyInstance { return buildApp({ orchestrator: new ArchitectureOrchestrator(retriever, model), knowledgeRevision }); }
