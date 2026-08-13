/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AnalysisResult, ArchitectureDecision } from "@architecture-ai/domain";
import { DecisionReview } from "./pages/DecisionReview.js";
import { AnalysisDetail } from "./pages/AnalysisDetail.js";
import { App } from "./App.js";

const decision = (status: ArchitectureDecision["status"]): ArchitectureDecision => ({ id: "DEC-1", title: "Use TOTP", context: "Login", decision: "Use TOTP", rationale: "Risk reduction", evidenceIds: ["E-1"], sourceRequirementIds: ["REQ-1"], significant: true, status, classification: "DECISION" });
const result = (status: AnalysisResult["packageStatus"]["value"]): AnalysisResult => ({ context: { revision: "abc", requirements: [], drivers: [], evidence: [], recommendations: [], decisions: [decision("DRAFT")], artifacts: [], links: [], status: { value: status, requiredDecisionIds: ["DEC-1"], approvedDecisionIds: [] } }, findings: [], risks: [], artifacts: [], packageStatus: { value: status, requiredDecisionIds: ["DEC-1"], approvedDecisionIds: [] } });
const response = (body: unknown, statusCode = 200) => new Response(JSON.stringify(body), { status: statusCode, headers: { "content-type": "application/json" } });

describe("Web DOM review flow", () => {
  afterEach(() => cleanup());
  it("shows Review for DRAFT and sends the review action", () => {
    const onAction = vi.fn();
    render(<DecisionReview decisions={[decision("DRAFT")]} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(onAction).toHaveBeenCalledWith("DEC-1", "review");
    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });

  it("shows Approve for REVIEWED and hides publication before approval", () => {
    const onAction = vi.fn();
    render(<DecisionReview decisions={[decision("REVIEWED")]} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(onAction).toHaveBeenCalledWith("DEC-1", "approve");
    const onPublish = vi.fn();
    render(<AnalysisDetail id="ANALYSIS-1" result={result("IN_REVIEW")} decisions={[decision("REVIEWED")]} links={[]} audit={[]} onBack={vi.fn()} onGenerate={vi.fn()} onPublish={onPublish} onReview={onAction} />);
    expect(screen.getByRole("button", { name: "Publish reviewed package" })).toBeDisabled();
    expect(onPublish).not.toHaveBeenCalled();
  });

  it("enables publication only after the package is APPROVED", () => {
    const onPublish = vi.fn();
    render(<AnalysisDetail id="ANALYSIS-1" result={result("APPROVED")} decisions={[decision("APPROVED")]} links={[]} audit={[]} onBack={vi.fn()} onGenerate={vi.fn()} onPublish={onPublish} onReview={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Publish reviewed package" }));
    expect(onPublish).toHaveBeenCalledOnce();
  });

  it("offers regeneration only when governance requires it", () => {
    const onRegenerate = vi.fn();
    const blocked = { ...result("DRAFT"), packageStatus: { ...result("DRAFT").packageStatus, diagnostics: ["Regeneration required: REQUEST_CHANGES on decision DEC-1"] } };
    render(<AnalysisDetail id="ANALYSIS-1" result={blocked} decisions={[decision("DRAFT")]} links={[]} audit={[]} onBack={vi.fn()} onGenerate={vi.fn()} onRegenerate={onRegenerate} onPublish={vi.fn()} onReview={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Regenerate architecture" }));
    expect(onRegenerate).toHaveBeenCalledOnce();
  });

  it("runs the App flow from history through review, approval, publication, and back", async () => {
    let status: ArchitectureDecision["status"] = "DRAFT";
    const requests: string[] = [];
    const originalFetch = globalThis.fetch;
    const response = (body: unknown, statusCode = 200) => new Response(JSON.stringify(body), { status: statusCode, headers: { "content-type": "application/json" } });
    globalThis.fetch = async (input, init) => {
      const url = String(input); requests.push(`${init?.method ?? "GET"} ${url}`);
      if (url.endsWith("/analyses") && !init?.method) return response({ analyses: status === "APPROVED" ? [{ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc", status: "APPROVED", createdAt: "now", updatedAt: "now", hasResult: true }] : [] });
      if (url.endsWith("/analyses") && init?.method === "POST") return response({ id: "ANALYSIS-1" }, 201);
      if (url.includes("/packages/ANALYSIS-1/generate")) return response({ analysisId: "ANALYSIS-1", directory: "packages/ANALYSIS-1", files: [], context: result(status === "APPROVED" ? "APPROVED" : "IN_REVIEW").context }, 201);
      if (url.endsWith("/packages/ANALYSIS-1")) return response(result(status === "APPROVED" ? "APPROVED" : status === "REVIEWED" ? "IN_REVIEW" : "DRAFT"));
      if (url.endsWith("/decisions")) return response({ decisions: [decision(status)] });
      if (url.endsWith("/traceability")) return response({ links: [] });
      if (url.includes("/audit")) return response({ events: [] });
      if (url.includes("/decisions/DEC-1/review")) { status = "REVIEWED"; return response({ decision: decision(status) }); }
      if (url.includes("/decisions/DEC-1/approve")) { status = "APPROVED"; return response({ decision: decision(status) }); }
      if (url.endsWith("/publish")) return response({ analysisId: "ANALYSIS-1", branch: "architecture/analysis-1", commit: "abc123", directory: "packages/ANALYSIS-1", files: [] }, 201);
      return response({}, 404);
    };
    try {
      render(<App />);
      await waitFor(() => expect(screen.getByText("No analyses yet.")).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "New analysis" }));
      fireEvent.change(screen.getByLabelText("PRD or user stories"), { target: { value: "Login with 2FA" } });
      fireEvent.click(screen.getByRole("button", { name: "Generate architecture package" }));
      await waitFor(() => expect(screen.getByRole("heading", { name: "Architecture Package: ANALYSIS-1" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Review" }));
      await waitFor(() => expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Approve" }));
      await waitFor(() => expect(screen.getByRole("button", { name: "Publish reviewed package" })).toBeEnabled());
      fireEvent.click(screen.getByRole("button", { name: "Publish reviewed package" }));
      await waitFor(() => expect(screen.getByText(/Package published on architecture\/analysis-1/)).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Back" }));
      await waitFor(() => expect(screen.getByText("Analysis history")).toBeInTheDocument());
      expect(requests).toEqual(expect.arrayContaining(["POST http://127.0.0.1:3000/analyses", "POST http://127.0.0.1:3000/decisions/DEC-1/review", "POST http://127.0.0.1:3000/decisions/DEC-1/approve", "POST http://127.0.0.1:3000/packages/ANALYSIS-1/publish"]));
    } finally { globalThis.fetch = originalFetch; }
  });

  it("keeps the detail visible when publication returns INVALID_PACKAGE_STATUS", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/analyses")) return response({ analyses: [{ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc", status: "APPROVED", createdAt: "now", updatedAt: "now", hasResult: true }] });
      if (url.endsWith("/packages/ANALYSIS-1")) return response(result("APPROVED"));
      if (url.endsWith("/decisions")) return response({ decisions: [decision("APPROVED")] });
      if (url.endsWith("/traceability")) return response({ links: [] });
      if (url.includes("/audit")) return response({ events: [] });
      if (url.endsWith("/publish")) return response({ code: "INVALID_PACKAGE_STATUS", message: "Package must be APPROVED" }, 409);
      return response({}, 404);
    };
    try {
      render(<App />);
      await waitFor(() => expect(screen.getByRole("button", { name: "Select" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Select" }));
      await waitFor(() => expect(screen.getByRole("heading", { name: "Architecture Package: ANALYSIS-1" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Publish reviewed package" }));
      await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("INVALID_PACKAGE_STATUS: Package must be APPROVED"));
      expect(screen.getByRole("heading", { name: "Architecture Package: ANALYSIS-1" })).toBeInTheDocument();
    } finally { globalThis.fetch = originalFetch; }
  });

  it("keeps the detail visible after a network failure", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/analyses")) return response({ analyses: [{ id: "ANALYSIS-1", requirements: "Login", knowledgeRevision: "abc", status: "APPROVED", createdAt: "now", updatedAt: "now", hasResult: true }] });
      if (url.endsWith("/packages/ANALYSIS-1")) return response(result("APPROVED"));
      if (url.endsWith("/decisions")) return response({ decisions: [decision("APPROVED")] });
      if (url.endsWith("/traceability")) return response({ links: [] });
      if (url.includes("/audit")) return response({ events: [] });
      if (url.endsWith("/publish")) throw new TypeError("Failed to fetch");
      return response({}, 404);
    };
    try {
      render(<App />);
      await waitFor(() => expect(screen.getByRole("button", { name: "Select" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Select" }));
      await waitFor(() => expect(screen.getByRole("heading", { name: "Architecture Package: ANALYSIS-1" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Publish reviewed package" }));
      await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Failed to fetch"));
      expect(screen.getByRole("heading", { name: "Architecture Package: ANALYSIS-1" })).toBeInTheDocument();
    } finally { globalThis.fetch = originalFetch; }
  });
});

describe("Knowledge Authoring Workspace", () => {
  afterEach(() => cleanup());

  it("runs the App flow from creating KCR through review, approval, and publication", async () => {
    let kcrStatus = "DRAFT";
    const requests: string[] = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = String(input); requests.push(`${init?.method ?? "GET"} ${url}`);
      if (url.endsWith("/knowledge-change-requests") && !init?.method) return response(kcrStatus === "PUBLISHED" ? [] : [{ id: "KCR-1", category: "standards", author: "web-user", baseRevision: "abc", document: { key: "STD-1", title: "Standard 1", summary: "Summary", content: "Content", type: "STANDARD", status: "DRAFT", tags: [] }, status: kcrStatus }]);
      if (url.includes("/knowledge-change-requests/KCR-1") && (!init || !init.method || init.method === "GET")) return response({ id: "KCR-1", category: "standards", author: "web-user", baseRevision: "abc", document: { key: "STD-1", title: "Standard 1", summary: "Summary", content: "Content", type: "STANDARD", status: "DRAFT", tags: [] }, status: kcrStatus });
      if (url.endsWith("/knowledge-change-requests") && init?.method === "POST") return response({ id: "KCR-1" }, 201);
      if (url.includes("/knowledge-change-requests/KCR-1/review")) {
        kcrStatus = "REVIEWED";
        return response({});
      }
      if (url.includes("/knowledge-change-requests/KCR-1/approve")) {
        kcrStatus = "APPROVED";
        return response({});
      }
      if (url.includes("/knowledge-change-requests/KCR-1/publish")) {
        if (kcrStatus !== "APPROVED") return response({ code: "INVALID_STATUS", message: "KCR must be APPROVED" }, 409);
        kcrStatus = "PUBLISHED";
        return response({ branch: "knowledge/kcr-1" }, 201);
      }
      // default analysis endpoints for App load
      if (url.endsWith("/analyses")) return response({ analyses: [] });
      return response({}, 404);
    };
    try {
      render(<App />);
      // Navigate to KCR workspace
      await waitFor(() => expect(screen.getByRole("button", { name: "Knowledge Authoring" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Knowledge Authoring" }));

      // Create new
      await waitFor(() => expect(screen.getByRole("button", { name: "New knowledge proposal" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "New knowledge proposal" }));
      
      // Submit draft
      await waitFor(() => expect(screen.getByRole("button", { name: "Create draft" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Create draft" }));

      // Review
      await waitFor(() => expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Review" }));

      // Approve
      await waitFor(() => expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Approve" }));

      // Publish
      await waitFor(() => expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Publish" }));

      await waitFor(() => expect(screen.getByText(/KCR published on knowledge\/kcr-1/)).toBeInTheDocument());

      expect(requests).toEqual(expect.arrayContaining([
        "POST http://127.0.0.1:3000/knowledge-change-requests",
        "POST http://127.0.0.1:3000/knowledge-change-requests/KCR-1/review", // review
        "POST http://127.0.0.1:3000/knowledge-change-requests/KCR-1/approve", // approve
        "POST http://127.0.0.1:3000/knowledge-change-requests/KCR-1/publish"
      ]));
    } finally { globalThis.fetch = originalFetch; }
  });

  it("handles 409 on publish and invalid draft feedback", async () => {
    let kcrStatus = "DRAFT";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (url.endsWith("/knowledge-change-requests") && !init?.method) return response([{ id: "KCR-1", category: "standards", author: "web-user", baseRevision: "abc", document: { key: "STD-1", title: "Standard 1", summary: "Summary", content: "Content", type: "STANDARD", status: "DRAFT", tags: [] }, status: kcrStatus }]);
      if (url.includes("/knowledge-change-requests/KCR-1") && (!init || !init.method || init.method === "GET")) return response({ id: "KCR-1", category: "standards", author: "web-user", baseRevision: "abc", document: { key: "STD-1", title: "Standard 1", summary: "Summary", content: "Content", type: "STANDARD", status: "DRAFT", tags: [] }, status: kcrStatus });
      if (url.endsWith("/knowledge-change-requests") && init?.method === "POST") return response({ code: "VALIDATION_ERROR", message: "Invalid draft" }, 400);
      if (url.includes("/knowledge-change-requests/KCR-1/publish")) return response({ code: "INVALID_STATUS", message: "KCR must be APPROVED" }, 409);
      if (url.endsWith("/analyses")) return response({ analyses: [] });
      return response({}, 404);
    };
    try {
      render(<App />);
      await waitFor(() => expect(screen.getByRole("button", { name: "Knowledge Authoring" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Knowledge Authoring" }));

      // Test Create Draft Failure
      fireEvent.click(screen.getByRole("button", { name: "New knowledge proposal" }));
      fireEvent.click(screen.getByRole("button", { name: "Create draft" }));
      await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("VALIDATION_ERROR: Invalid draft"));

      // Set to APPROVED so we can see the Publish button, but mock publish to fail
      kcrStatus = "APPROVED";

      // Go back
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      
      // Test Publish Failure
      await waitFor(() => expect(screen.getByRole("button", { name: "View" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "View" }));
      await waitFor(() => expect(screen.getByText("Status: APPROVED")).toBeInTheDocument());
      await waitFor(() => expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: "Publish" }));
      await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("INVALID_STATUS: KCR must be APPROVED"));

    } finally { globalThis.fetch = originalFetch; }
  });
});
