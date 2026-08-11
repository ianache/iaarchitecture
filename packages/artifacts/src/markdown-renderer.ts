import type { AnalysisResult } from "@architecture-ai/domain";
function renderDomainAnalysis(result: AnalysisResult, domain: "security" | "infrastructure"): string {
  const analysis = result.context[domain];
  if (!analysis) return "No structured analysis was produced; human review is required.\n";
  const controls = analysis.controls.map((control) => `| ${control.id} | ${control.title} | ${control.status} | ${control.sourceRequirementIds.join(", ")} | ${control.evidenceIds.join(", ") || "none"} |`).join("\n");
  return `| ID | Control | Status | Requirements | Evidence |\n| --- | --- | --- | --- | --- |\n${controls || "| - | No controls | PENDING_REVIEW | - | - |"}\n\n## Gaps\n${analysis.gaps.map((gap) => `- ${gap}`).join("\n") || "- None identified."}\n\n## Assumptions\n${analysis.assumptions.map((assumption) => `- ${assumption}`).join("\n") || "- None."}\n`;
}
function renderNfr(result: AnalysisResult): string {
  const validations = result.context.nfrValidations ?? [];
  const rows = validations.map((item) => `| ${item.id} | ${item.metric} | ${item.target} | ${item.unit} | ${item.status} | ${item.sourceRequirementIds.join(", ")} | ${item.evidenceIds.join(", ") || "none"} |`).join("\n");
  return `| ID | Metric | Target | Unit | Status | Requirements | Evidence |\n| --- | --- | --- | --- | --- | --- | --- |\n${rows || "| - | No measurable NFRs | - | - | PENDING_REVIEW | - | - |"}`;
}
export function renderMarkdown(result: AnalysisResult): Record<string, string> {
  const ctx = result.context;
  const evidence = ctx.evidence.map((item) => `- ${item.id}: ${item.sourcePath ?? "model suggestion"} @ ${item.revision ?? "unversioned"} (${item.classification})`).join("\n");
  const links = ctx.links.map((link) => `| ${link.fromId} | ${link.kind} | ${link.toId} |`).join("\n");
  return {
    "01-architecture-analysis.md": `# Architecture Analysis\n\nStatus: ${ctx.status.value}\n${ctx.status.diagnostics?.length ? `\n## Diagnostics\n${ctx.status.diagnostics.map((diagnostic) => `- ${diagnostic}`).join("\n")}\n` : ""}\n## Findings\n${result.findings.map((finding) => `- ${finding}`).join("\n")}\n\n## Recommendations\n${ctx.recommendations.map((recommendation) => `- ${recommendation.id}: ${recommendation.title} — ${recommendation.rationale}`).join("\n")}\n\n## Evidence\n${evidence}\n`,
    "02-architecture-drivers.md": `# Architecture Drivers\n\n${ctx.drivers.map((driver) => `## ${driver.id}: ${driver.title}\n${driver.description}\n\nRequirements: ${driver.sourceRequirementIds.join(", ")}`).join("\n\n")}\n`,
    "03-solution-architecture.md": `# Solution Architecture\n\nApplication and integration capabilities are designed from the retrieved evidence.\n\nTraceability references: ${ctx.decisions.map((decision) => decision.id).join(", ")}\n`,
    "04-data-architecture.md": `# Data Architecture\n\nData ownership is explicit and shared mutable tables are avoided.\n`,
    "05-security-architecture.md": `# Security Architecture\n\n${renderDomainAnalysis(result, "security")}`,
    "06-infrastructure-architecture.md": `# Infrastructure Architecture\n\n${renderDomainAnalysis(result, "infrastructure")}`,
    "07-compliance-report.md": `# Compliance Report\n\nEvidence revision: ${ctx.revision}\n\n## NFR Validation\n${renderNfr(result)}\n\n## Retrieved evidence\n${evidence}\n`,
    "08-risks-tradeoffs.md": `# Risks and Tradeoffs\n\n${result.risks.map((risk) => `- ${risk}`).join("\n")}\n`,
    "traceability.md": `# Traceability\n\n| From | Relationship | To |\n| --- | --- | --- |\n${links}\n`,
  };
}
