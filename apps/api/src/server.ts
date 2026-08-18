import { createDefaultApp } from "./app.js";
import type { ArchitectureModel, EvidenceRetriever, KnowledgeItem } from "@architecture-ai/domain";
export async function startServer(retriever: EvidenceRetriever, model: ArchitectureModel, port = 3000, knowledgeRevision?: string, knowledgeItems?: KnowledgeItem[]): Promise<void> { await createDefaultApp(retriever, model, knowledgeRevision, knowledgeItems).listen({ port, host: "127.0.0.1" }); }
