import type { DomainAnalysis, DomainControl, SkillInput, SkillOutput } from "@architecture-ai/domain";
import { evidenceForRequirement } from "./evidence-matching.js";
export function designSecurity(input: SkillInput): SkillOutput {
  const controls: DomainControl[] = input.context.requirements.map((requirement) => { const matched = evidenceForRequirement(requirement, input.evidence); return { id: `SEC-${requirement.id}`, title: "Identity, access and data protection", description: `Security controls for ${requirement.title}: authentication, authorization, secrets, data protection and auditability.`, sourceRequirementIds: [requirement.id], evidenceIds: matched.map((item) => item.id), status: matched.length ? "VALIDATED" : "PENDING_REVIEW" }; });
  const analysis: DomainAnalysis = { domain: "SECURITY", controls, gaps: controls.filter((control) => control.status !== "VALIDATED").map((control) => `${control.id} has insufficient corporate evidence and requires human review.`), assumptions: ["Security control selection remains constrained by retrieved corporate evidence."] };
  return { findings: ["Security controls were evaluated for identity, access, secrets, data protection and auditability."], risks: analysis.gaps, domainAnalysis: analysis };
}
