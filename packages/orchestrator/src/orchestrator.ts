import type { AnalysisRequest, AnalysisResult, ArchitectureArtifact, ArchitectureContext, ArchitectureDecision, ArchitectureModel, EvidenceRetriever, RetrievedEvidence, SkillInput, SkillOutput } from "@architecture-ai/domain";
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
    const blank: ArchitectureContext = { revision: request.knowledgeRevision, requirements, drivers: [], evidence: [], decisions: [], artifacts: [], links: [], status: { value: "DRAFT", requiredDecisionIds: [], approvedDecisionIds: [] } };
    const input = (context: ArchitectureContext, evidence: RetrievedEvidence[] = []): SkillInput => ({ request, context, evidence, priorDecisions: context.decisions });
    const evidence = await this.retriever.retrieve({ query: request.requirements, revision: request.knowledgeRevision, limit: 10 });
    const driverOutput = identifyDrivers(input(blank, evidence));
    blank.drivers = driverOutput.drivers ?? [];
    const outputs: SkillOutput[] = [analyzeRequirements(input(blank, evidence)), driverOutput, architectureImpactAnalysis(input(blank, evidence)), designApplication(input(blank, evidence)), designData(input(blank, evidence)), designIntegration(input(blank, evidence)), designSecurity(input(blank, evidence)), designInfrastructure(input(blank, evidence)), validateNfr(input(blank, evidence)), validateStandards(input(blank, evidence))];
    const review = prepareArchitectureReview(input(blank, evidence));
    blank.evidence = evidence;
    blank.decisions = review.decisions ?? [];
    const artifacts: ArchitectureArtifact[] = blank.decisions.map((decision) => ({ id: `ART-${decision.id}`, path: "03-solution-architecture.md", kind: "MARKDOWN", title: decision.title, sourceDecisionIds: [decision.id], sourceRequirementIds: decision.sourceRequirementIds }));
    blank.artifacts = artifacts;
    for (const requirement of requirements) { const driver = blank.drivers.find((candidate) => candidate.sourceRequirementIds.includes(requirement.id)); const decision = blank.decisions.find((candidate) => candidate.sourceRequirementIds.includes(requirement.id)); const evidenceItem = evidence[0]; const artifact = decision ? artifacts.find((candidate) => candidate.sourceDecisionIds.includes(decision.id)) : undefined; if (driver) blank.links.push({ id: `LINK-${requirement.id}-DRIVER`, fromId: requirement.id, fromType: "REQUIREMENT", toId: driver.id, toType: "ARCHITECTURE_DRIVER", kind: "DERIVES" }); if (driver && evidenceItem) blank.links.push({ id: `LINK-${driver.id}-EVIDENCE`, fromId: driver.id, fromType: "ARCHITECTURE_DRIVER", toId: evidenceItem.id, toType: "EVIDENCE", kind: "SUPPORTS" }); if (evidenceItem && decision) blank.links.push({ id: `LINK-${evidenceItem.id}-DECISION`, fromId: evidenceItem.id, fromType: "EVIDENCE", toId: decision.id, toType: "DECISION", kind: "RECOMMENDS" }); if (decision && artifact) blank.links.push({ id: `LINK-${decision.id}-ARTIFACT`, fromId: decision.id, fromType: "DECISION", toId: artifact.id, toType: "ARTIFACT", kind: "REPRESENTS" }); }
    await this.model.complete({ system: "You are an evidence-constrained architecture assistant.", prompt: request.requirements, evidence });
    blank.status = { value: "DRAFT", requiredDecisionIds: blank.decisions.filter((decision) => decision.significant).map((decision) => decision.id), approvedDecisionIds: [] };
    const trace = new TraceabilityStore(blank.requirements, blank.drivers, blank.evidence, blank.decisions, blank.artifacts, blank.links, blank.revision);
    try { trace.requireCompleteChain(); } catch { blank.status.value = "INCOMPLETE"; }
    return { context: blank, findings: outputs.flatMap((output) => output.findings), risks: outputs.flatMap((output) => output.risks ?? []), artifacts, packageStatus: blank.status };
  }
}
