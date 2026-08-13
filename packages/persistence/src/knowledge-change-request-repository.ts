import type { KnowledgeChangeRequest, KnowledgeChangeRequestInput, KnowledgeChangeReview, KnowledgeChangeRequestRepository as IKnowledgeChangeRequestRepository } from "@architecture-ai/domain";
import { randomUUID } from "node:crypto";
import type { DatabaseStore } from "./database.js";

export class KnowledgeChangeRequestRepository implements IKnowledgeChangeRequestRepository {
  constructor(private readonly store: DatabaseStore) {}

  nextId(): string {
    return `KCR-${randomUUID()}`;
  }

  async create(input: KnowledgeChangeRequestInput): Promise<KnowledgeChangeRequest> {
    const id = this.nextId();
    const now = new Date().toISOString();
    const request: KnowledgeChangeRequest = {
      ...input,
      id,
      status: "DRAFT",
      createdAt: now,
      updatedAt: now,
    };
    
    this.store.database.prepare(
      "INSERT INTO knowledge_change_requests (id, category, target_path, status, request_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(request.id, request.category, request.targetPath, request.status, JSON.stringify(request), request.createdAt, request.updatedAt);
    
    return request;
  }

  async get(id: string): Promise<KnowledgeChangeRequest | undefined> {
    const row = this.store.database.prepare("SELECT request_json FROM knowledge_change_requests WHERE id = ?").get(id) as { request_json: string } | undefined;
    if (!row) return undefined;
    return JSON.parse(row.request_json) as KnowledgeChangeRequest;
  }

  async list(): Promise<KnowledgeChangeRequest[]> {
    const rows = this.store.database.prepare("SELECT request_json FROM knowledge_change_requests ORDER BY updated_at DESC").all() as { request_json: string }[];
    return rows.map(r => JSON.parse(r.request_json) as KnowledgeChangeRequest);
  }

  async update(request: KnowledgeChangeRequest): Promise<void> {
    request.updatedAt = new Date().toISOString();
    this.store.database.prepare(
      "UPDATE knowledge_change_requests SET category = ?, target_path = ?, status = ?, request_json = ?, updated_at = ? WHERE id = ?"
    ).run(request.category, request.targetPath, request.status, JSON.stringify(request), request.updatedAt, request.id);
  }

  async recordReview(review: KnowledgeChangeReview): Promise<void> {
    this.store.database.prepare(
      "INSERT INTO knowledge_change_request_events (request_id, event_json, created_at) VALUES (?, ?, ?)"
    ).run(review.requestId, JSON.stringify(review), review.createdAt);
  }

  async listAudit(id: string): Promise<KnowledgeChangeReview[]> {
    const rows = this.store.database.prepare("SELECT event_json FROM knowledge_change_request_events WHERE request_id = ? ORDER BY created_at ASC").all() as { event_json: string }[];
    return rows.map(r => JSON.parse(r.event_json) as KnowledgeChangeReview);
  }
}
