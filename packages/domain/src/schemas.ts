import { z } from "zod";
import { KNOWLEDGE_TYPES, LIFECYCLE_STATES } from "./types.js";

const nonEmpty = z.string().min(1);
export const requirementSchema = z.object({ id: nonEmpty, title: nonEmpty, description: nonEmpty, source: z.string().optional(), priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(), tags: z.array(z.string()).default([]) });
export const knowledgeItemSchema = z.object({ id: nonEmpty, key: nonEmpty, title: nonEmpty, summary: nonEmpty, content: z.string().optional(), type: z.enum(KNOWLEDGE_TYPES), status: z.enum(LIFECYCLE_STATES), revision: nonEmpty, sourcePath: nonEmpty, tags: z.array(z.string()), domains: z.array(z.enum(["APPLICATION", "DATA", "SECURITY", "INFRASTRUCTURE", "INTEGRATION"])).optional(), relatedIds: z.array(z.string()).optional(), conflictsWith: z.array(z.string()).optional() });
export const traceLinkSchema = z.object({ id: nonEmpty, fromId: nonEmpty, fromType: nonEmpty, toId: nonEmpty, toType: nonEmpty, kind: nonEmpty });
export const evidenceSchema = z.object({ id: nonEmpty, knowledgeId: z.string().optional(), sourcePath: z.string().optional(), revision: z.string().optional(), excerpt: nonEmpty, classification: z.enum(KNOWLEDGE_TYPES), confidence: z.number().min(0).max(1), method: nonEmpty, conflictsWith: z.array(z.string()).optional() });
export const recommendationSchema = z.object({ id: nonEmpty, title: nonEmpty, rationale: nonEmpty, evidenceIds: z.array(z.string()), sourceRequirementIds: z.array(z.string()).min(1), sourceKnowledgeIds: z.array(z.string()), status: z.enum(LIFECYCLE_STATES), classification: z.literal("RECOMMENDATION") });
export const architectureDecisionSchema = z.object({ id: nonEmpty, title: nonEmpty, context: nonEmpty, decision: nonEmpty, rationale: nonEmpty, evidenceIds: z.array(z.string()), sourceRequirementIds: z.array(z.string()), significant: z.boolean(), status: z.enum(LIFECYCLE_STATES), classification: z.enum(["DECISION", "EXCEPTION", "RECOMMENDATION"]) });
export const domainControlSchema = z.object({ id: nonEmpty, title: nonEmpty, description: nonEmpty, sourceRequirementIds: z.array(nonEmpty), evidenceIds: z.array(z.string()), status: z.enum(["VALIDATED", "PENDING_REVIEW", "UNSUPPORTED"]) });
export const domainAnalysisSchema = z.object({ domain: z.enum(["SECURITY", "INFRASTRUCTURE"]), controls: z.array(domainControlSchema), gaps: z.array(z.string()), assumptions: z.array(z.string()) });
export const nfrValidationSchema = z.object({ id: nonEmpty, name: nonEmpty, metric: nonEmpty, target: z.union([z.string(), z.number()]), unit: nonEmpty, sourceRequirementIds: z.array(nonEmpty), evidenceIds: z.array(z.string()), status: z.enum(["VALIDATED", "PENDING_REVIEW", "UNSUPPORTED"]), rationale: nonEmpty });
export const skillInputSchema = z.object({ request: z.object({ requirements: nonEmpty, knowledgeRevision: nonEmpty, analysisId: z.string().optional() }), context: z.unknown(), evidence: z.array(evidenceSchema), priorDecisions: z.array(architectureDecisionSchema) });

export const knowledgeCategorySchema = z.enum(["standards", "facts", "recommendations", "decisions", "exceptions"]);
export const knowledgeChangeRequestStatusSchema = z.enum(["DRAFT", "REVIEWED", "APPROVED", "PUBLISHED"]);
export const knowledgePublicationResultSchema = z.object({ branch: nonEmpty, commit: nonEmpty.optional() });
export const knowledgeChangeRequestSchema = z.object({
  id: nonEmpty,
  category: knowledgeCategorySchema,
  document: knowledgeItemSchema,
  author: nonEmpty,
  baseRevision: nonEmpty,
  targetPath: nonEmpty,
  status: knowledgeChangeRequestStatusSchema,
  createdAt: nonEmpty,
  updatedAt: nonEmpty,
  publication: knowledgePublicationResultSchema.optional()
});
export const knowledgeChangeReviewSchema = z.object({
  id: nonEmpty,
  requestId: nonEmpty,
  reviewer: nonEmpty,
  action: z.enum(["APPROVE", "REQUEST_CHANGES", "COMMENT"]),
  comment: nonEmpty.optional(),
  createdAt: nonEmpty
});
