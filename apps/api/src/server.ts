import { createDefaultApp } from "./app.js";
import type { ArchitectureModel, EvidenceRetriever } from "@architecture-ai/domain";
export async function startServer(retriever: EvidenceRetriever, model: ArchitectureModel, port = 3000, knowledgeRevision?: string): Promise<void> { await createDefaultApp(retriever, model, knowledgeRevision).listen({ port, host: "127.0.0.1" }); }
