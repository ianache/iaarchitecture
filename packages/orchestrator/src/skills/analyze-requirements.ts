import type { SkillInput, SkillOutput } from "@architecture-ai/domain";
import { normalizeRequirements } from "../requirements.js";
export function analyzeRequirements(input: SkillInput): SkillOutput { return { findings: [`Analyzed ${normalizeRequirements(input.request.requirements).length} requirement(s).`] }; }
