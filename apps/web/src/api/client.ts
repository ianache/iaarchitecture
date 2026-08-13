import type { AnalysisResult, AnalysisSummary, ArchitectureDecision, PackageGenerationResult, PackagePublicationResult, Review, TraceLink } from "@architecture-ai/domain";

export interface ApiClient { 
  createAnalysis(requirements: string, knowledgeRevision: string): Promise<{ id: string; status: unknown }>; 
  regenerateAnalysis(id: string): Promise<{ id: string; status: unknown; generation?: number }>; 
  listAnalyses(): Promise<{ analyses: AnalysisSummary[] }>; 
  generatePackage(id: string, outputDirectory?: string): Promise<PackageGenerationResult>; 
  publishPackage(id: string, branch?: string): Promise<PackagePublicationResult>; 
  getPackage(id: string): Promise<AnalysisResult>; 
  getTraceability(id: string): Promise<{ links: TraceLink[] }>; 
  getDecisions(id: string): Promise<{ decisions: ArchitectureDecision[] }>; 
  reviewDecision(id: string, action: "review" | "approve" | "reject" | "request-changes"): Promise<unknown>; 
  getAudit(id: string): Promise<{ events: Review[] }>; 
  
  createKcr(input: any): Promise<{ id: string; status: string }>;
  listKcrs(): Promise<any[]>;
  getKcr(id: string): Promise<any>;
  reviewKcr(id: string, reviewer: string, comment?: string): Promise<unknown>;
  approveKcr(id: string, reviewer: string, comment?: string): Promise<unknown>;
  publishKcr(id: string, branch?: string): Promise<{ branch: string; commit?: string }>;
  getKcrAudit(id: string): Promise<{ events: any[] }>;
}

export function createApiClient(baseUrl: string): ApiClient {
  const json = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(`${baseUrl}${path}`, { headers: { "content-type": "application/json" }, ...init });
    if (!response.ok) {
      const body = await response.json().catch(() => undefined) as { code?: string; message?: string } | undefined;
      throw new Error(body?.message ? `${body.code ?? response.status}: ${body.message}` : `API request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  };
  return {
    createAnalysis: (requirements, knowledgeRevision) => json<{ id: string; status: unknown }>("/analyses", { method: "POST", body: JSON.stringify({ requirements, knowledgeRevision }) }),
    regenerateAnalysis: (id) => json<{ id: string; status: unknown; generation?: number }>(`/analyses/${id}/regenerate`, { method: "POST" }),
    listAnalyses: () => json<{ analyses: AnalysisSummary[] }>("/analyses"),
    generatePackage: (id, outputDirectory) => json<PackageGenerationResult>(`/packages/${id}/generate`, { method: "POST", body: JSON.stringify({ outputDirectory }) }),
    publishPackage: (id, branch) => json<PackagePublicationResult>(`/packages/${id}/publish`, { method: "POST", body: JSON.stringify({ branch }) }),
    getPackage: (id) => json<AnalysisResult>(`/packages/${id}`),
    getTraceability: (id) => json<{ links: TraceLink[] }>(`/packages/${id}/traceability`),
    getDecisions: (id) => json<{ decisions: ArchitectureDecision[] }>(`/packages/${id}/decisions`),
    reviewDecision: (id, action) => json(`/decisions/${id}/${action}`, { method: "POST", body: JSON.stringify({ reviewer: "web-user" }) }),
    getAudit: (id) => json<{ events: Review[] }>(`/decisions/${id}/audit`),

    createKcr: (input) => json<{ id: string; status: string }>("/knowledge-change-requests", { method: "POST", body: JSON.stringify(input) }),
    listKcrs: () => json<any[]>("/knowledge-change-requests"),
    getKcr: (id) => json<any>(`/knowledge-change-requests/${id}`),
    reviewKcr: (id, reviewer, comment) => json(`/knowledge-change-requests/${id}/review`, { method: "POST", body: JSON.stringify({ reviewer, comment }) }),
    approveKcr: (id, reviewer, comment) => json(`/knowledge-change-requests/${id}/approve`, { method: "POST", body: JSON.stringify({ reviewer, comment }) }),
    publishKcr: (id, branch) => json<{ branch: string; commit?: string }>(`/knowledge-change-requests/${id}/publish`, { method: "POST", body: JSON.stringify({ branch }) }),
    getKcrAudit: (id) => json<{ events: any[] }>(`/knowledge-change-requests/${id}/audit`)
  };
}

