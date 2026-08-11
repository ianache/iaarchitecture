import { z } from "zod";
import { KNOWLEDGE_TYPES, LIFECYCLE_STATES } from "./types.js";

const nonEmpty = z.string().min(1);
export const requirementSchema = z.object({ id: nonEmpty, title: nonEmpty, description: nonEmpty, source: z.string().optional(), priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(), tags: z.array(z.string()).default([]) });
export const knowledgeItemSchema = z.object({ id: nonEmpty, key: nonEmpty, title: nonEmpty, summary: nonEmpty, content: z.string().optional(), type: z.enum(KNOWLEDGE_TYPES), status: z.enum(LIFECYCLE_STATES), revision: nonEmpty, sourcePath: nonEmpty, tags: z.array(z.string()), domains: z.array(z.enum(["APPLICATION", "DATA", "SECURITY", "INFRASTRUCTURE", "INTEGRATION"])).optional(), relatedIds: z.array(z.string()).optional() });
export const traceLinkSchema = z.object({ id: nonEmpty, fromId: nonEmpty, fromType: nonEmpty, toId: nonEmpty, toType: nonEmpty, kind: nonEmpty });
export const evidenceSchema = z.object({ id: nonEmpty, knowledgeId: z.string().optional(), sourcePath: z.string().optional(), revision: z.string().optional(), excerpt: nonEmpty, classification: z.enum(KNOWLEDGE_TYPES), confidence: z.number().min(0).max(1), method: nonEmpty });
export const recommendationSchema = z.object({ id: nonEmpty, title: nonEmpty, rationale: nonEmpty, evidenceIds: z.array(z.string()), sourceRequirementIds: z.array(z.string()).min(1), sourceKnowledgeIds: z.array(z.string()), status: z.enum(LIFECYCLE_STATES), classification: z.literal("RECOMMENDATION") });
export const architectureDecisionSchema = z.object({ id: nonEmpty, title: nonEmpty, context: nonEmpty, decision: nonEmpty, rationale: nonEmpty, evidenceIds: z.array(z.string()), sourceRequirementIds: z.array(z.string()), significant: z.boolean(), status: z.enum(LIFECYCLE_STATES), classification: z.enum(["DECISION", "EXCEPTION", "RECOMMENDATION"]) });
export const skillInputSchema = z.object({ request: z.object({ requirements: nonEmpty, knowledgeRevision: nonEmpty, analysisId: z.string().optional() }), context: z.unknown(), evidence: z.array(evidenceSchema), priorDecisions: z.array(architectureDecisionSchema) });
