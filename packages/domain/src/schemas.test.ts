import { describe, expect, it } from "vitest";

import {
  domainAnalysisSchema,
  knowledgeItemSchema,
  nfrValidationSchema,
  requirementSchema,
  traceLinkSchema,
  knowledgeChangeRequestSchema,
} from "./schemas.js";

describe("domain schemas", () => {
  it("rejects invalid knowledge change requests", () => {
    expect(knowledgeChangeRequestSchema.safeParse({ key: "mfa-standard", category: "standards", type: "STANDARD" }).success).toBe(false);
  });

  it("accepts traceable domain controls and measurable NFR validations", () => {
    const analysis = domainAnalysisSchema.parse({
      domain: "SECURITY",
      controls: [{ id: "SEC-001", title: "Require MFA", description: "Use MFA for privileged access", sourceRequirementIds: ["REQ-LOGIN"], evidenceIds: ["E-KI-MFA"], status: "VALIDATED" }],
      gaps: [],
      assumptions: [],
    });
    const validation = nfrValidationSchema.parse({ id: "NFR-001", name: "Availability", metric: "availability", target: 99.9, unit: "%", sourceRequirementIds: ["REQ-LOGIN"], evidenceIds: ["E-KI-SLA"], status: "VALIDATED", rationale: "Supported by the approved SLA standard." });
    expect(analysis.controls[0].evidenceIds).toEqual(["E-KI-MFA"]);
    expect(validation.target).toBe(99.9);
  });
  it("accepts a requirement with a stable id", () => {
    const requirement = requirementSchema.parse({
      id: "REQ-ORDER-SUBMIT",
      title: "Submit order",
      description: "The platform lets a customer submit an order.",
      source: "PRD-001",
      priority: "HIGH",
      tags: ["ordering", "checkout"],
    });

    expect(requirement.id).toBe("REQ-ORDER-SUBMIT");
  });

  it("accepts supported knowledge item types and lifecycle states", () => {
    const standard = knowledgeItemSchema.parse({
      id: "KI-API-CONTRACTS",
      key: "ST-001",
      title: "API contracts must be versioned",
      summary: "All external contracts must be explicit and versioned.",
      type: "STANDARD",
      status: "APPROVED",
      revision: "8341609",
      sourcePath: "knowledge/standards/ST-001-api-contracts.md",
      tags: ["integration"],
    });

    const exception = knowledgeItemSchema.parse({
      id: "KI-TRANSITION-EXCEPTION",
      key: "EX-001",
      title: "Temporary exception for migration",
      summary: "A short-lived exception to a standard.",
      type: "EXCEPTION",
      status: "REVIEWED",
      revision: "8341609",
      sourcePath: "knowledge/exceptions/EX-001-migration.md",
      tags: ["migration"],
    });

    expect(standard.type).toBe("STANDARD");
    expect(exception.status).toBe("REVIEWED");
  });

  it("accepts trace links with stable endpoint ids", () => {
    const traceLink = traceLinkSchema.parse({
      id: "TRACE-REQ-ORDER-SUBMIT-DRIVER-AVAILABILITY",
      fromId: "REQ-ORDER-SUBMIT",
      fromType: "REQUIREMENT",
      toId: "DRV-AVAILABILITY",
      toType: "ARCHITECTURE_DRIVER",
      kind: "DERIVES",
    });

    expect(traceLink.kind).toBe("DERIVES");
  });

  it("rejects records that omit stable ids", () => {
    expect(() =>
      requirementSchema.parse({
        title: "Missing stable id",
        description: "Requirements must include a stable identifier.",
      }),
    ).toThrow();

    expect(() =>
      knowledgeItemSchema.parse({
        key: "ST-999",
        title: "Missing stable id",
        summary: "Knowledge items also require a stable identifier.",
        type: "FACT",
        status: "DRAFT",
        revision: "8341609",
        sourcePath: "knowledge/facts/ST-999.md",
        tags: [],
      }),
    ).toThrow();
  });
});
