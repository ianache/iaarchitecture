import type { AnalysisResult } from "@architecture-ai/domain";
export function renderMarkdown(result: AnalysisResult): Record<string, string> {
  const ctx = result.context;
  const evidence = ctx.evidence.map((item) => `- ${item.id}: ${item.sourcePath ?? "model suggestion"} @ ${item.revision ?? "unversioned"} (${item.classification})`).join("\n");
  const links = ctx.links.map((link) => `| ${link.fromId} | ${link.kind} | ${link.toId} |`).join("\n");
  return {
    "01-architecture-analysis.md": `# Architecture Analysis\n\nStatus: ${ctx.status.value}\n\n## Findings\n${result.findings.map((finding) => `- ${finding}`).join("\n")}\n\n## Evidence\n${evidence}\n`,
    "02-architecture-drivers.md": `# Architecture Drivers\n\n${ctx.drivers.map((driver) => `## ${driver.id}: ${driver.title}\n${driver.description}\n\nRequirements: ${driver.sourceRequirementIds.join(", ")}`).join("\n\n")}\n`,
    "03-solution-architecture.md": `# Solution Architecture\n\nApplication and integration capabilities are designed from the retrieved evidence.\n\nTraceability references: ${ctx.decisions.map((decision) => decision.id).join(", ")}\n`,
    "04-data-architecture.md": `# Data Architecture\n\nData ownership is explicit and shared mutable tables are avoided.\n`,
    "05-security-architecture.md": `# Security Architecture\n\nSecurity remains an explicit review gap in this MVP slice.\n`,
    "06-infrastructure-architecture.md": `# Infrastructure Architecture\n\nInfrastructure remains an explicit review gap in this MVP slice.\n`,
    "07-compliance-report.md": `# Compliance Report\n\nEvidence revision: ${ctx.revision}\n\nRetrieved evidence:\n${evidence}\n`,
    "08-risks-tradeoffs.md": `# Risks and Tradeoffs\n\n${result.risks.map((risk) => `- ${risk}`).join("\n")}\n`,
    "traceability.md": `# Traceability\n\n| From | Relationship | To |\n| --- | --- | --- |\n${links}\n`,
  };
}
