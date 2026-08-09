import { describe, expect, it } from "vitest";
import { parseKnowledgeDocument } from "./frontmatter.js";

describe("knowledge frontmatter", () => {
  it("parses metadata and preserves revision/content", () => {
    const item = parseKnowledgeDocument(`---\nid: KI-1\nkey: ST-1\ntitle: API contracts\nsummary: Contracts are versioned\ntype: STANDARD\nstatus: APPROVED\ntags: [integration, api]\n---\nUse explicit versioning.`, "knowledge/standards/ST-1.md", "abc123");
    expect(item.revision).toBe("abc123");
    expect(item.content).toContain("explicit versioning");
    expect(item.tags).toEqual(["integration", "api"]);
  });
  it("rejects invalid metadata", () => {
    expect(() => parseKnowledgeDocument("---\nid: KI-1\ntitle: Missing\n---\n", "bad.md")).toThrow();
  });
});
