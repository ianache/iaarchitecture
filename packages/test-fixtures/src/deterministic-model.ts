import type { ArchitectureModel, ModelRequest, ModelResponse } from "@architecture-ai/domain";
export class DeterministicModel implements ArchitectureModel { async complete(input: ModelRequest): Promise<ModelResponse> { return { output: `Evidence-constrained response for: ${input.prompt}`, suggestions: input.evidence.length ? [] : ["Insufficient corporate evidence; human review required."] }; } }
export const deterministicEmbedding = async (text: string): Promise<number[]> => [text.length % 101, text.split(/\s+/).length % 101, 42];
