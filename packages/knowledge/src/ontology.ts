import type { ArchitectureOntology } from "@architecture-ai/domain";

export function loadOntology(yaml: string): ArchitectureOntology {
  const entityKinds: string[] = [];
  const relationshipKinds: string[] = [];
  let section: "entities" | "relationships" | undefined;
  for (const line of yaml.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "entityKinds:") { section = "entities"; continue; }
    if (trimmed === "relationshipKinds:") { section = "relationships"; continue; }
    if (trimmed.startsWith("- ") && section) (section === "entities" ? entityKinds : relationshipKinds).push(trimmed.slice(2).trim());
  }
  if (!entityKinds.length || !relationshipKinds.length) throw new Error("Ontology must define entityKinds and relationshipKinds");
  return { entityKinds, relationshipKinds };
}
