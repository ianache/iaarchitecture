import type { SkillInput, SkillOutput } from "@architecture-ai/domain";
export function validateNfr(input: SkillInput): SkillOutput { return { findings: [`NFR validation requires measurable availability and recovery targets for ${input.context.requirements.length} requirement(s).`] }; }
