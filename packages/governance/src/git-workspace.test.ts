import { describe, expect, it } from "vitest";
import { LocalGitWorkspace } from "./git-workspace.js";
describe("LocalGitWorkspace", () => { it("requires an isolated branch before review preparation", async () => { const workspace = new LocalGitWorkspace(process.cwd()); await expect(workspace.prepareReview("should fail")).rejects.toThrow("branch"); }); });
