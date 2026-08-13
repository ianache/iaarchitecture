import type { GitWorkspace, KnowledgeChangeRequestRepository, KnowledgeChangeRequest, KnowledgeChangeRequestInput } from "@architecture-ai/domain";
import { ApplicationError } from "./errors.js";
import { parseKnowledgeDocument } from "@architecture-ai/knowledge";

// Mock OKF parser function for now, replace with actual OKF renderer if available
function renderKnowledgeMarkdown(document: any): string {
  let content = `---\n`;
  content += `title: ${document.title}\n`;
  content += `summary: ${document.summary}\n`;
  content += `type: ${document.type}\n`;
  content += `status: ${document.status}\n`;
  content += `key: ${document.key}\n`;
  content += `id: ${document.id}\n`;
  content += `---\n\n`;
  if (document.content) content += document.content;
  return content;
}

export class KnowledgeChangeRequestService {
  constructor(
    private readonly repository: KnowledgeChangeRequestRepository,
    private readonly workspace: GitWorkspace
  ) {}

  async create(input: KnowledgeChangeRequestInput): Promise<KnowledgeChangeRequest> {
    const id = this.repository.nextId();
    return this.repository.create({
      ...input,
    });
  }

  async list(): Promise<KnowledgeChangeRequest[]> {
    return this.repository.list();
  }

  async get(id: string): Promise<KnowledgeChangeRequest> {
    const request = await this.repository.get(id);
    if (!request) throw new ApplicationError("NOT_FOUND", `Knowledge change request ${id} not found`);
    return request;
  }

  private validateDocument(request: KnowledgeChangeRequest): string {
    if (!/^[a-z0-9-_]+$/i.test(request.category) || !/^[a-z0-9-_]+$/i.test(request.document.key)) {
      throw new ApplicationError("INVALID_OKF_METADATA", "Unsafe category or key values");
    }

    const markdown = renderKnowledgeMarkdown(request.document);
    parseKnowledgeDocument(markdown, request.targetPath);
    return markdown;
  }

  async review(id: string, reviewer: string, comment?: string): Promise<KnowledgeChangeRequest> {
    const request = await this.get(id);
    if (request.status !== "DRAFT" && request.status !== "REVIEWED") {
      throw new ApplicationError("INVALID_KNOWLEDGE_CHANGE_TRANSITION", `Cannot transition to REVIEWED from ${request.status}`);
    }
    
    this.validateDocument(request);

    await this.repository.recordReview({
      id: crypto.randomUUID(),
      requestId: request.id,
      reviewer,
      action: "COMMENT",
      comment,
      createdAt: new Date().toISOString()
    });

    request.status = "REVIEWED";
    request.updatedAt = new Date().toISOString();
    await this.repository.update(request);
    return request;
  }

  async approve(id: string, reviewer: string, comment?: string): Promise<KnowledgeChangeRequest> {
    const request = await this.get(id);
    if (request.status !== "DRAFT" && request.status !== "REVIEWED") {
      throw new ApplicationError("INVALID_KNOWLEDGE_CHANGE_TRANSITION", `Cannot approve from ${request.status}`);
    }

    await this.repository.recordReview({
      id: crypto.randomUUID(),
      requestId: request.id,
      reviewer,
      action: "APPROVE",
      comment,
      createdAt: new Date().toISOString()
    });

    request.status = "APPROVED";
    request.updatedAt = new Date().toISOString();
    await this.repository.update(request);
    return request;
  }

  async publish(id: string, branch?: string): Promise<KnowledgeChangeRequest> {
    const request = await this.get(id);
    if (request.status !== "APPROVED") {
      throw new ApplicationError("INVALID_KNOWLEDGE_CHANGE_TRANSITION", "Knowledge change request must be APPROVED before publication");
    }

    const markdown = this.validateDocument(request);

    try {
      await this.workspace.createBranch(branch ?? `knowledge/${request.id.toLowerCase()}`, request.baseRevision);
      await this.workspace.writeKnowledgeDocument(request.targetPath, markdown);
      const publication = await this.workspace.prepareKnowledgeReview(request.targetPath, `docs: publish ${request.id}`);

      request.publication = publication;
      request.status = "PUBLISHED";
      request.updatedAt = new Date().toISOString();
      await this.repository.update(request);
      return request;
    } catch (error) {
      throw new ApplicationError("KNOWLEDGE_PUBLICATION_FAILED", `Failed to publish knowledge change request: ${error instanceof Error ? error.message : "Unknown error"}`, { cause: error });
    }
  }
}
