import type { Evidence, KnowledgeType } from "@architecture-ai/domain";
export type EvidenceClassification = KnowledgeType | "MODEL_SUGGESTION";
const rank: Record<EvidenceClassification, number> = { FACT: 5, STANDARD: 5, DECISION: 5, EXCEPTION: 4, RECOMMENDATION: 3, MODEL_SUGGESTION: 1 };
export function classifyEvidence(evidence: Evidence): EvidenceClassification { return evidence.knowledgeId && evidence.revision ? evidence.classification : "MODEL_SUGGESTION"; }
export function rankEvidence(evidence: Evidence): number { return rank[classifyEvidence(evidence)]; }
export function sortEvidence(evidence: Evidence[]): Evidence[] { return [...evidence].sort((a, b) => rankEvidence(b) - rankEvidence(a) || b.confidence - a.confidence); }
