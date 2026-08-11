import type { NfrValidation, SkillInput, SkillOutput } from "@architecture-ai/domain";
import { evidenceForRequirement } from "./evidence-matching.js";

function number(value: string | undefined): number | undefined { return value === undefined ? undefined : Number(value); }
function minutes(value: string, unit: string): { target: number; unit: string } { return { target: unit.toLowerCase().startsWith("h") ? Number(value) * 60 : Number(value), unit: "minutes" }; }
export function validateNfr(input: SkillInput): SkillOutput {
  const validations: NfrValidation[] = [];
  for (const requirement of input.context.requirements) {
    const text = `${requirement.title} ${requirement.description}`.toLowerCase();
    const evidenceIds = evidenceForRequirement(requirement, input.evidence).map((item) => item.id);
    const add = (metric: string, target: string | number, unit: string, specified: boolean) => validations.push({ id: `NFR-${requirement.id}-${metric.toUpperCase()}`, name: `${metric} target`, metric, target, unit, sourceRequirementIds: [requirement.id], evidenceIds, status: specified && evidenceIds.length ? "VALIDATED" : "PENDING_REVIEW", rationale: specified ? (evidenceIds.length ? "Target is explicit and supported by retrieved evidence." : "Target is explicit but lacks matching corporate evidence.") : "A measurable target is required before approval." });
    if (/availability|highly available/.test(text)) add("availability", number(text.match(/(\d+(?:\.\d+)?)\s*%/)?.[1]) ?? "Not specified", "%", Boolean(text.match(/\d+(?:\.\d+)?\s*%/)));
    if (/latency|p95/.test(text)) { const match = text.match(/(?:below|under|less than|<=|at most)\s*(\d+(?:\.\d+)?)\s*(ms|s|seconds?)/); add("latency", number(match?.[1]) ?? "Not specified", match?.[2]?.startsWith("s") ? "seconds" : "ms", Boolean(match)); }
    for (const metric of ["rto", "rpo"] as const) { if (!text.includes(metric)) continue; const match = text.match(new RegExp(`${metric}[^0-9]*(\\d+(?:\\.\\d+)?)\\s*(minutes?|mins?|hours?|h|m)`)); const normalized = match ? minutes(match[1], match[2]) : undefined; add(metric, normalized?.target ?? "Not specified", normalized?.unit ?? "minutes", Boolean(match)); }
  }
  return { findings: [`NFR validation evaluated ${validations.length} measurable target(s) across ${input.context.requirements.length} requirement(s).`], nfrValidations: validations, risks: validations.filter((item) => item.status !== "VALIDATED").map((item) => `${item.id} requires human review before approval.`) };
}
