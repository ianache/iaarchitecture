import type { ArchitectureContext, ArchitectureDecision, ArchitectureDriver, ArchitectureArtifact, Evidence, Requirement, TraceLink } from "@architecture-ai/domain";
export class TraceabilityError extends Error { constructor(message: string) { super(message); this.name = "TraceabilityError"; } }
export class TraceabilityStore {
  constructor(private readonly requirements: Requirement[] = [], private readonly drivers: ArchitectureDriver[] = [], private readonly evidence: Evidence[] = [], private readonly decisions: ArchitectureDecision[] = [], private readonly artifacts: ArchitectureArtifact[] = [], private readonly links: TraceLink[] = [], private readonly revision = "") {}
  addLink(link: TraceLink): void { this.links.push(link); }
  requireCompleteChain(): void {
    const needed = ["DERIVES", "SUPPORTS", "RECOMMENDS", "REPRESENTS"];
    for (const requirement of this.requirements) {
      let current = requirement.id;
      for (const kind of needed) { const link = this.links.find((candidate) => candidate.fromId === current && candidate.kind === kind); if (!link) throw new TraceabilityError(`Missing ${kind} trace link from ${current}`); current = link.toId; }
    }
  }
  toContextJson(): ArchitectureContext { return { revision: this.revision, requirements: this.requirements, drivers: this.drivers, evidence: this.evidence, decisions: this.decisions, artifacts: this.artifacts, links: this.links, status: { value: "DRAFT", requiredDecisionIds: this.decisions.filter((d) => d.significant).map((d) => d.id), approvedDecisionIds: this.decisions.filter((d) => d.status === "APPROVED").map((d) => d.id) } }; }
}
