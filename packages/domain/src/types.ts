export const KNOWLEDGE_TYPES = ["FACT", "STANDARD", "RECOMMENDATION", "DECISION", "EXCEPTION"] as const;
export type KnowledgeType = (typeof KNOWLEDGE_TYPES)[number];
export const LIFECYCLE_STATES = ["DRAFT", "REVIEWED", "APPROVED"] as const;
export type LifecycleState = (typeof LIFECYCLE_STATES)[number];
export type ArchitectureDomain = "APPLICATION" | "DATA" | "SECURITY" | "INFRASTRUCTURE" | "INTEGRATION";
export type RequirementPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ValidationStatus = "VALIDATED" | "PENDING_REVIEW" | "UNSUPPORTED";

export interface Requirement { id: string; title: string; description: string; source?: string; priority?: RequirementPriority; tags: string[]; }
export interface ArchitectureDriver { id: string; title: string; description: string; domain: ArchitectureDomain; sourceRequirementIds: string[]; }
export interface DomainControl { id: string; title: string; description: string; sourceRequirementIds: string[]; evidenceIds: string[]; status: ValidationStatus; }
export interface DomainAnalysis { domain: "SECURITY" | "INFRASTRUCTURE"; controls: DomainControl[]; gaps: string[]; assumptions: string[]; }
export interface NfrValidation { id: string; name: string; metric: string; target: string | number; unit: string; sourceRequirementIds: string[]; evidenceIds: string[]; status: ValidationStatus; rationale: string; }
export interface KnowledgeItem { id: string; key: string; title: string; summary: string; content?: string; type: KnowledgeType; status: LifecycleState; revision: string; sourcePath: string; tags: string[]; domains?: ArchitectureDomain[]; relatedIds?: string[]; conflictsWith?: string[]; }
export interface Evidence { id: string; knowledgeId?: string; sourcePath?: string; revision?: string; excerpt: string; classification: KnowledgeType; confidence: number; method: string; conflictsWith?: string[]; }
export interface Recommendation { id: string; title: string; rationale: string; evidenceIds: string[]; sourceRequirementIds: string[]; sourceKnowledgeIds: string[]; status: LifecycleState; classification: "RECOMMENDATION"; }
export interface ArchitectureDecision { id: string; title: string; context: string; decision: string; rationale: string; evidenceIds: string[]; sourceRequirementIds: string[]; significant: boolean; status: LifecycleState; classification: "DECISION" | "EXCEPTION" | "RECOMMENDATION"; }
export interface TraceLink { id: string; fromId: string; fromType: string; toId: string; toType: string; kind: string; }
export interface ArchitectureArtifact { id: string; path: string; kind: string; title: string; sourceDecisionIds: string[]; sourceRequirementIds: string[]; }
export interface Review { id: string; decisionId: string; reviewer: string; action: "REVIEW" | "APPROVE" | "REJECT" | "REQUEST_CHANGES"; comment?: string; at: string; }
export interface PackageStatus { value: "DRAFT" | "IN_REVIEW" | "APPROVED" | "INCOMPLETE"; requiredDecisionIds: string[]; approvedDecisionIds: string[]; diagnostics?: string[]; }
export interface ArchitectureContext { revision: string; requirements: Requirement[]; drivers: ArchitectureDriver[]; evidence: Evidence[]; recommendations: Recommendation[]; decisions: ArchitectureDecision[]; artifacts: ArchitectureArtifact[]; links: TraceLink[]; status: PackageStatus; security?: DomainAnalysis; infrastructure?: DomainAnalysis; nfrValidations?: NfrValidation[]; }
export interface AnalysisRequest { requirements: string; knowledgeRevision: string; analysisId?: string; }
export interface RetrievedEvidence extends Evidence { score: number; }
export interface RetrieveInput { query: string; domains?: ArchitectureDomain[]; types?: KnowledgeType[]; revision: string; limit?: number; }
export interface ModelRequest { system: string; prompt: string; evidence: Evidence[]; }
export interface ModelResponse { output: string; suggestions?: string[]; }
export interface SkillInput { request: AnalysisRequest; context: ArchitectureContext; evidence: RetrievedEvidence[]; priorDecisions: ArchitectureDecision[]; }
export interface SkillOutput { findings: string[]; drivers?: ArchitectureDriver[]; recommendations?: Recommendation[]; decisions?: ArchitectureDecision[]; evidence?: Evidence[]; risks?: string[]; unresolvedQuestions?: string[]; artifactFragments?: Record<string, string>; domainAnalysis?: DomainAnalysis; nfrValidations?: NfrValidation[]; }
export interface AnalysisResult { context: ArchitectureContext; findings: string[]; risks: string[]; artifacts: ArchitectureArtifact[]; packageStatus: PackageStatus; generation?: number; }
export interface AnalysisResultVersion { analysisId: string; generation: number; result: AnalysisResult; archivedAt: string; reason: string; }
export interface AnalysisRecord { id: string; requirements: string; knowledgeRevision: string; status: string; result?: AnalysisResult; createdAt: string; updatedAt: string; }
export interface AnalysisSummary { id: string; requirements: string; knowledgeRevision: string; status: string; createdAt: string; updatedAt: string; hasResult: boolean; }
export interface AnalysisRecordInput { id: string; requirements: string; knowledgeRevision: string; status?: string; }
export interface PackageGenerationResult { analysisId: string; directory: string; files: string[]; context: ArchitectureContext; }
export interface KnowledgeSnapshot { revision: string; items: KnowledgeItem[]; ontology: ArchitectureOntology; }
export interface ArchitectureOntology { entityKinds: string[]; relationshipKinds: string[]; }
export interface ArchitecturePackage { directory: string; files: string[]; context: ArchitectureContext; }
export interface ProjectionRevision { revision: string; indexedItems: number; }
export interface ReviewRepository { getDecision(id: string): Promise<ArchitectureDecision | undefined>; saveReview(review: Review): Promise<void>; }
export interface KnowledgeSource { readRevision(revision: string): Promise<KnowledgeSnapshot>; }
export interface EvidenceRetriever { retrieve(input: RetrieveInput): Promise<RetrievedEvidence[]>; }
export interface ArchitectureModel { complete(input: ModelRequest): Promise<ModelResponse>; }
export interface PackageRenderer { renderPackage(result: AnalysisResult, outputDirectory: string): Promise<ArchitecturePackage>; }
export interface GitWorkspace { createBranch(name: string, revision: string): Promise<string>; getWorkingDirectory(): string; writePackage(directory: string, files: Record<string, string>): Promise<void>; prepareReview(message: string): Promise<{ branch: string; commit?: string; }>; writeKnowledgeDocument(targetPath: string, content: string): Promise<void>; prepareKnowledgeReview(targetPath: string, message: string): Promise<{ branch: string; commit?: string; }>; }
export interface PackagePublicationResult { analysisId: string; branch: string; commit?: string; directory: string; files: string[]; }
export type KnowledgeCategory = "standards" | "facts" | "recommendations" | "decisions" | "exceptions";
export type KnowledgeChangeRequestStatus = "DRAFT" | "REVIEWED" | "APPROVED" | "PUBLISHED";
export interface KnowledgePublicationResult { branch: string; commit?: string; }
export interface KnowledgeChangeRequest {
  id: string; category: KnowledgeCategory; document: KnowledgeItem; author: string;
  baseRevision: string; targetPath: string; status: KnowledgeChangeRequestStatus;
  createdAt: string; updatedAt: string; publication?: KnowledgePublicationResult;
}
export type KnowledgeChangeRequestInput = Omit<KnowledgeChangeRequest, "id" | "status" | "createdAt" | "updatedAt" | "publication">;
export interface KnowledgeChangeReview { id: string; requestId: string; reviewer: string; action: "APPROVE" | "REQUEST_CHANGES" | "COMMENT"; comment?: string; createdAt: string; }
export interface KnowledgeChangeRequestRepository {
  nextId(): string;
  create(input: KnowledgeChangeRequestInput): Promise<KnowledgeChangeRequest>;
  get(id: string): Promise<KnowledgeChangeRequest | undefined>;
  list(): Promise<KnowledgeChangeRequest[]>;
  update(request: KnowledgeChangeRequest): Promise<void>;
  recordReview(review: KnowledgeChangeReview): Promise<void>;
  listAudit(id: string): Promise<KnowledgeChangeReview[]>;
}
