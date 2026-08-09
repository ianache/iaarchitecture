import type { SkillInput, SkillOutput } from "@architecture-ai/domain";
export function designApplication(input: SkillInput): SkillOutput { return { findings: ["Application architecture uses bounded capabilities and explicit API ownership."], artifactFragments: { application: `Application design for ${input.context.requirements.length} requirement(s).` } }; }
