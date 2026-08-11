import type { AnalysisRequest, AnalysisResult, ArchitectureArtifact, ArchitectureContext, ArchitectureDecision, ArchitectureModel, EvidenceRetriever, RetrievedEvidence, SkillInput, SkillOutput, Recommendation } from "@architecture-ai/domain";
import { normalizeRequirements, TraceabilityStore } from "./index.js";
import { analyzeRequirements } from "./skills/analyze-requirements.js";
import { identifyDrivers } from "./skills/identify-drivers.js";
import { architectureImpactAnalysis } from "./skills/architecture-impact.js";
import { designApplication } from "./skills/design-application.js";
import { designData } from "./skills/design-data.js";
import { designIntegration } from "./skills/design-integration.js";
import { designSecurity } from "./skills/design-security.js";
import { designInfrastructure } from "./skills/design-infrastructure.js";
import { validateNfr } from "./skills/validate-nfr.js";
import { validateStandards } from "./skills/validate-standards.js";
import { prepareArchitectureReview } from "./skills/architecture-review.js";

export class ArchitectureOrchestrator {
  constructor(private readonly retriever: EvidenceRetriever, private readonly model: ArchitectureModel) {}
  async run(request: AnalysisRequest): Promise<AnalysisResult> {
    const requirements = normalizeRequirements(request.requirements);
    const blank: ArchitectureContext = { revision: request.knowledgeRevision, requirements, drivers: [], evidence: [], recommendations: [], decisions: [], artifacts: [], links: [], status: { value: "DRAFT", requiredDecisionIds: [], approvedDecisionIds: [] } };
    const input = (context: ArchitectureContext, evidence: RetrievedEvidence[] = []): SkillInput => ({ request, context, evidence, priorDecisions: context.decisions });
    const evidence = await this.retriever.retrieve({ query: request.requirements, revision: request.knowledgeRevision, limit: 10 });
    const standardKnowledgeIds = new Set(evidence.filter((item) => item.classification === "STANDARD").map((item) => item.knowledgeId).filter((id): id is string => Boolean(id)));
    const conflicting = evidence.find((item) => item.classification === "STANDARD" && item.conflictsWith?.some((knowledgeId) => standardKnowledgeIds.has(knowledgeId)));
    if (conflicting) throw Object.assign(new Error(`Corporate standard ${conflicting.knowledgeId} conflicts with retrieved standard ${conflicting.conflictsWith?.find((knowledgeId) => standardKnowledgeIds.has(knowledgeId))}`), { code: "STANDARDS_CONFLICT" });
    const driverOutput = identifyDrivers(input(blank, evidence));
    blank.drivers = driverOutput.drivers ?? [];
    const securityOutput = designSecurity(input(blank, evidence));
    const infrastructureOutput = designInfrastructure(input(blank, evidence));
    const nfrOutput = validateNfr(input(blank, evidence));
    blank.security = securityOutput.domainAnalysis;
    blank.infrastructure = infrastructureOutput.domainAnalysis;
    blank.nfrValidations = nfrOutput.nfrValidations ?? [];
    const outputs: SkillOutput[] = [analyzeRequirements(input(blank, evidence)), driverOutput, architectureImpactAnalysis(input(blank, evidence)), designApplication(input(blank, evidence)), designData(input(blank, evidence)), designIntegration(input(blank, evidence)), securityOutput, infrastructureOutput, nfrOutput, validateStandards(input(blank, evidence))];
    const review = prepareArchitectureReview(input(blank, evidence));
    blank.evidence = evidence;
    blank.recommendations = requirements.map((requirement, index): Recommendation => {
      const terms = `${requirement.title} ${requirement.description}`.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 3 && !["must", "with", "through", "from", "the", "and"].includes(term));
      const matching = evidence.filter((item) => terms.filter((term) => item.excerpt.toLowerCase().includes(term) || (item.sourcePath ?? "").toLowerCase().includes(term)).length >= 2);
      const sourceKnowledgeIds = [...new Set(matching.map((item) => item.knowledgeId).filter((id): id is string => Boolean(id)))];
      return { id: `REC-${String(index + 1).padStart(3, "0")}`, title: matching.length ? `Apply corporate guidance for ${requirement.title}` : `Review architecture option for ${requirement.title}`, rationale: matching.length ? `Recommendation is based on matching corporate evidence: ${matching.map((item) => item.excerpt).join(" ")}` : "No sufficient corporate evidence matched this requirement; human review is required before approval.", evidenceIds: matching.map((item) => item.id), sourceRequirementIds: [requirement.id], sourceKnowledgeIds, status: "DRAFT", classification: "RECOMMENDATION" };
    });
    blank.decisions = review.decisions ?? [];
    const artifacts: ArchitectureArtifact[] = blank.decisions.map((decision) => ({ id: `ART-${decision.id}`, path: "03-solution-architecture.md", kind: "MARKDOWN", title: decision.title, sourceDecisionIds: [decision.id], sourceRequirementIds: decision.sourceRequirementIds }));
    blank.artifacts = artifacts;
    for (const requirement of requirements) { const driver = blank.drivers.find((candidate) => candidate.sourceRequirementIds.includes(requirement.id)); const recommendation = blank.recommendations.find((candidate) => candidate.sourceRequirementIds.includes(requirement.id)); const decision = blank.decisions.find((candidate) => candidate.sourceRequirementIds.includes(requirement.id)); const evidenceItem = recommendation?.evidenceIds.map((id) => evidence.find((item) => item.id === id)).find((item): item is RetrievedEvidence => Boolean(item)); const artifact = decision ? artifacts.find((candidate) => candidate.sourceDecisionIds.includes(decision.id)) : undefined; if (driver) blank.links.push({ id: `LINK-${requirement.id}-DRIVER`, fromId: requirement.id, fromType: "REQUIREMENT", toId: driver.id, toType: "ARCHITECTURE_DRIVER", kind: "DERIVES" }); if (driver && evidenceItem) blank.links.push({ id: `LINK-${driver.id}-EVIDENCE`, fromId: driver.id, fromType: "ARCHITECTURE_DRIVER", toId: evidenceItem.id, toType: "EVIDENCE", kind: "SUPPORTS" }); if (recommendation) { for (const knowledgeId of recommendation.sourceKnowledgeIds) blank.links.push({ id: `LINK-${knowledgeId}-${recommendation.id}`, fromId: knowledgeId, fromType: "KNOWLEDGE_ITEM", toId: recommendation.id, toType: "RECOMMENDATION", kind: "INFORMS" }); if (decision) blank.links.push({ id: `LINK-${recommendation.id}-${decision.id}`, fromId: recommendation.id, fromType: "RECOMMENDATION", toId: decision.id, toType: "DECISION", kind: "RECOMMENDS" }); } if (evidenceItem && decision) blank.links.push({ id: `LINK-${evidenceItem.id}-DECISION`, fromId: evidenceItem.id, fromType: "EVIDENCE", toId: decision.id, toType: "DECISION", kind: "RECOMMENDS" }); if (decision && artifact) blank.links.push({ id: `LINK-${decision.id}-ARTIFACT`, fromId: decision.id, fromType: "DECISION", toId: artifact.id, toType: "ARTIFACT", kind: "REPRESENTS" }); }
    await this.model.complete({ system: "You are an evidence-constrained architecture assistant.", prompt: request.requirements, evidence });
    blank.status = { value: "DRAFT", requiredDecisionIds: blank.decisions.filter((decision) => decision.significant).map((decision) => decision.id), approvedDecisionIds: [] };
    const trace = new TraceabilityStore(blank.requirements, blank.drivers, blank.evidence, blank.decisions, blank.artifacts, blank.links, blank.revision, blank.recommendations);
    try { trace.requireCompleteChain(); } catch (error) { blank.status.value = "INCOMPLETE"; blank.status.diagnostics = [error instanceof Error ? error.message : "Traceability validation failed"]; }
    return { context: blank, findings: outputs.flatMap((output) => output.findings), risks: outputs.flatMap((output) => output.risks ?? []), artifacts, packageStatus: blank.status };
  }
}
