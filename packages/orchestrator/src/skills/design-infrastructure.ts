import type { SkillInput, SkillOutput } from "@architecture-ai/domain";
export function designInfrastructure(_input: SkillInput): SkillOutput { return { findings: ["Infrastructure design gap: deployment topology, observability, scaling, and recovery targets require human review."], risks: ["Infrastructure controls are not fully designed in this MVP slice."] }; }
