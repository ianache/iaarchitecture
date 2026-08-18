import type { Requirement, RetrievedEvidence } from "@architecture-ai/domain";

export function evidenceForRequirement(
  requirement: Requirement,
  evidence: RetrievedEvidence[]
): RetrievedEvidence[] {
  const requirementText = `${requirement.title} ${requirement.description}`.toLowerCase();
  const terms = requirementText
    .split(/[^a-z0-9]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2 && !["the", "with", "from", "must", "this", "that", "into", "for", "and", "not", "use"].includes(term));

  if (terms.length === 0) {
    return evidence.filter((item) => `${item.excerpt} ${item.sourcePath ?? ""}`.toLowerCase().includes(requirementText));
  }

  return [...evidence]
    .filter((item) => {
      const haystack = `${item.excerpt} ${item.sourcePath ?? ""}`.toLowerCase();
      const matches = terms.filter((term) => haystack.includes(term)).length;
      return matches >= 2 || haystack.includes(requirementText);
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}
