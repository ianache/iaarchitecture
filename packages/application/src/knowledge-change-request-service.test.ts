import { describe, expect, it, vi } from "vitest";
import { KnowledgeChangeRequestService } from "./knowledge-change-request-service.js";
import type { GitWorkspace, KnowledgeChangeRequestRepository, KnowledgeItem } from "@architecture-ai/domain";

describe("KnowledgeChangeRequestService", () => {
  it("rejects publication if request is not APPROVED", async () => {
    const repository: KnowledgeChangeRequestRepository = {
      nextId: () => "KCR-1",
      create: vi.fn(),
      get: vi.fn().mockResolvedValue({
        id: "KCR-1",
        status: "DRAFT",
        author: "dev",
        baseRevision: "HEAD",
        targetPath: "knowledge/standards/mfa-standard.md",
        category: "standards",
        document: {} as KnowledgeItem,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      list: vi.fn(),
      update: vi.fn(),
      recordReview: vi.fn(),
      listAudit: vi.fn(),
    };
    const workspace: GitWorkspace = {
      createBranch: vi.fn(),
      getWorkingDirectory: vi.fn(),
      writePackage: vi.fn(),
      prepareReview: vi.fn(),
      writeKnowledgeDocument: vi.fn(),
      prepareKnowledgeReview: vi.fn(),
    };
    const service = new KnowledgeChangeRequestService(repository, workspace);
    await expect(service.publish("KCR-1")).rejects.toMatchObject({ code: "INVALID_KNOWLEDGE_CHANGE_TRANSITION" });
  });

  it("publishes an approved request successfully", async () => {
    const request = {
      id: "KCR-1",
      status: "APPROVED",
      author: "dev",
      baseRevision: "HEAD",
      targetPath: "knowledge/standards/mfa-standard.md",
      category: "standards",
      document: { title: "MFA", summary: "Multi-factor authentication", type: "STANDARD", status: "DRAFT", revision: "HEAD", sourcePath: "", key: "mfa", id: "k-1", tags: [] } as KnowledgeItem,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const repository: KnowledgeChangeRequestRepository = {
      nextId: () => "KCR-1",
      create: vi.fn(),
      get: vi.fn().mockResolvedValue(request),
      list: vi.fn(),
      update: vi.fn().mockImplementation((req) => {
        Object.assign(request, req);
        return Promise.resolve();
      }),
      recordReview: vi.fn(),
      listAudit: vi.fn(),
    };
    
    const stagedPaths: string[] = [];
    const workspace: GitWorkspace = {
      createBranch: vi.fn().mockResolvedValue("knowledge/kcr-1"),
      getWorkingDirectory: vi.fn(),
      writePackage: vi.fn(),
      prepareReview: vi.fn(),
      writeKnowledgeDocument: vi.fn().mockResolvedValue(undefined),
      prepareKnowledgeReview: vi.fn().mockImplementation((path, msg) => {
        stagedPaths.push(path);
        return Promise.resolve({ branch: "knowledge/kcr-1", commit: "abcdef" });
      }),
    };

    const service = new KnowledgeChangeRequestService(repository, workspace);
    
    await service.review("KCR-1", "architect");
    await service.approve("KCR-1", "architect");
    
    const result = await service.publish("KCR-1");
    expect(result.status).toBe("PUBLISHED");
    expect(stagedPaths).toEqual(["knowledge/standards/mfa-standard.md"]);
  });

  it("maps git failures to KNOWLEDGE_PUBLICATION_FAILED and retains APPROVED status", async () => {
    const request = {
      id: "KCR-1",
      status: "APPROVED",
      author: "dev",
      baseRevision: "HEAD",
      targetPath: "knowledge/standards/mfa-standard.md",
      category: "standards",
      document: { title: "MFA", summary: "Multi-factor authentication", type: "STANDARD", status: "DRAFT", revision: "HEAD", sourcePath: "", key: "mfa", id: "k-1", tags: [] } as KnowledgeItem,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const repository: KnowledgeChangeRequestRepository = {
      nextId: () => "KCR-1",
      create: vi.fn(),
      get: vi.fn().mockResolvedValue(request),
      list: vi.fn(),
      update: vi.fn(),
      recordReview: vi.fn(),
      listAudit: vi.fn(),
    };
    
    const workspace: GitWorkspace = {
      createBranch: vi.fn().mockResolvedValue("knowledge/kcr-1"),
      getWorkingDirectory: vi.fn(),
      writePackage: vi.fn(),
      prepareReview: vi.fn(),
      writeKnowledgeDocument: vi.fn().mockRejectedValue(new Error("Git fatal")),
      prepareKnowledgeReview: vi.fn(),
    };

    const service = new KnowledgeChangeRequestService(repository, workspace);
    await expect(service.publish("KCR-1")).rejects.toMatchObject({ code: "KNOWLEDGE_PUBLICATION_FAILED" });
    expect(request.status).toBe("APPROVED"); // Must retain status for retry
  });
});
