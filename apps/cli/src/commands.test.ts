import { describe, expect, it } from "vitest";
import { createCli } from "../src/main.js";
describe("CLI", () => { it("declares shared analysis, package, review, and audit commands", () => { const names = createCli().commands.map((command) => command.name()); expect(names).toEqual(["analyze", "package", "review", "audit"]); }); });
