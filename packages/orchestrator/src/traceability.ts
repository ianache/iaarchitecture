import type { ArchitectureContext, ArchitectureDecision, ArchitectureDriver, ArchitectureArtifact, Evidence, Requirement, Recommendation, TraceLink } from "@architecture-ai/domain";
export class TraceabilityError extends Error { constructor(message: string) { super(message); this.name = "TraceabilityError"; } }
export class TraceabilityStore {
  constructor(private readonly requirements: Requirement[] = [], private readonly drivers: ArchitectureDriver[] = [], private readonly evidence: Evidence[] = [], private readonly decisions: ArchitectureDecision[] = [], private readonly artifacts: ArchitectureArtifact[] = [], private readonly links: TraceLink[] = [], private readonly revision = "", private readonly recommendations: Recommendation[] = []) {}
  addLink(link: TraceLink): void { this.links.push(link); }
  requireCompleteChain(): void {
    const needed = ["DERIVES", "SUPPORTS", "RECOMMENDS", "REPRESENTS"];
    for (const requirement of this.requirements) {
      let current = requirement.id;
      for (const kind of needed) { const link = this.links.find((candidate) => candidate.fromId === current && candidate.kind === kind); if (!link) throw new TraceabilityError(`Missing ${kind} trace link from ${current}`); current = link.toId; }
    }
    for (const recommendation of this.recommendations) {
      if (!recommendation.sourceRequirementIds.length) throw new TraceabilityError(`Recommendation ${recommendation.id} has no requirement source`);
      if (!recommendation.sourceKnowledgeIds.length) throw new TraceabilityError(`Recommendation ${recommendation.id} has no knowledge source`);
      for (const knowledgeId of recommendation.sourceKnowledgeIds) if (!this.links.some((link) => link.fromId === knowledgeId && link.toId === recommendation.id && link.kind === "INFORMS")) throw new TraceabilityError(`Missing INFORMS trace link from ${knowledgeId} to ${recommendation.id}`);
      const recommendationDecision = this.links.find((link) => link.fromId === recommendation.id && link.kind === "RECOMMENDS");
      if (!recommendationDecision || !this.decisions.some((decision) => decision.id === recommendationDecision.toId)) throw new TraceabilityError(`Missing valid RECOMMENDS decision link from ${recommendation.id}`);
      for (const evidenceId of recommendation.evidenceIds) if (!this.evidence.some((item) => item.id === evidenceId)) throw new TraceabilityError(`Recommendation ${recommendation.id} references unknown evidence ${evidenceId}`);
    }
  }
  toContextJson(): ArchitectureContext { return { revision: this.revision, requirements: this.requirements, drivers: this.drivers, evidence: this.evidence, recommendations: this.recommendations, decisions: this.decisions, artifacts: this.artifacts, links: this.links, status: { value: "DRAFT", requiredDecisionIds: this.decisions.filter((d) => d.significant).map((d) => d.id), approvedDecisionIds: this.decisions.filter((d) => d.status === "APPROVED").map((d) => d.id) } }; }
}
