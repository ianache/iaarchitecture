import type { ArchitectureContext } from "@architecture-ai/domain";
export function renderContextJson(context: ArchitectureContext): string { return `${JSON.stringify(context, null, 2)}\n`; }
