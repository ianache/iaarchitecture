import type { DomainAnalysis, DomainControl, SkillInput, SkillOutput } from "@architecture-ai/domain";
import { evidenceForRequirement } from "./evidence-matching.js";
export function designInfrastructure(input: SkillInput): SkillOutput {
  const controls: DomainControl[] = input.context.requirements.map((requirement) => { const matched = evidenceForRequirement(requirement, input.evidence); return { id: `INF-${requirement.id}`, title: "Deployment, resilience and observability", description: `Infrastructure concerns for ${requirement.title}: topology, availability, scaling, observability, backup and recovery.`, sourceRequirementIds: [requirement.id], evidenceIds: matched.map((item) => item.id), status: matched.length ? "VALIDATED" : "PENDING_REVIEW" }; });
  const analysis: DomainAnalysis = { domain: "INFRASTRUCTURE", controls, gaps: controls.filter((control) => control.status !== "VALIDATED").map((control) => `${control.id} has insufficient corporate evidence and requires human review.`), assumptions: ["Availability, scaling and recovery targets require explicit requirements or approved standards."] };
  return { findings: ["Infrastructure controls were evaluated for topology, resilience, observability, scaling, backup and recovery."], risks: analysis.gaps, domainAnalysis: analysis };
}
