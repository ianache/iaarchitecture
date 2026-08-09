import type { SkillInput, SkillOutput } from "@architecture-ai/domain";
export function designSecurity(_input: SkillInput): SkillOutput { return { findings: ["Security design gap: authentication, authorization, secrets handling, and threat model require human review."], risks: ["Security controls are not fully designed in this MVP slice."] }; }
