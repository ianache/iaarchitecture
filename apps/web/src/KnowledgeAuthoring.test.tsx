/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KnowledgeAuthoring } from "./pages/KnowledgeAuthoring.js";
import type { ApiClient } from "./api/client.js";

describe("KnowledgeAuthoring", () => {
  afterEach(() => cleanup());

  it("creates a new draft and reviews it", async () => {
    const client = {
      listKnowledgeItems: vi.fn().mockResolvedValue({ items: [] }),
      listKcrs: vi.fn().mockResolvedValue([]),
      createKcr: vi.fn().mockResolvedValue({ id: "KCR-1", status: "DRAFT" }),
      getKcr: vi.fn().mockResolvedValue({ id: "KCR-1", status: "DRAFT", category: "standards", author: "test", baseRevision: "abc", document: { title: "Test" } }),
      reviewKcr: vi.fn().mockResolvedValue({}),
      approveKcr: vi.fn().mockResolvedValue({}),
      getKcrAudit: vi.fn().mockResolvedValue({ events: [{ timestamp: new Date().toISOString(), actor: "test", action: "CREATED" }] }),
    } as unknown as ApiClient;

    render(<KnowledgeAuthoring client={client} onBack={vi.fn()} />);

    // Click "New knowledge proposal"
    fireEvent.click(await screen.findByRole("button", { name: "New knowledge proposal" }));

    // Check target path suggestion
    const categoryInput = screen.getByLabelText(/Category/i);
    const keyInput = screen.getByLabelText(/Key/i);
    const targetPathInput = screen.getByLabelText(/Target Path/i);

    fireEvent.change(categoryInput, { target: { value: "guides" } });
    fireEvent.change(keyInput, { target: { value: "my-guide" } });

    expect(targetPathInput).toHaveValue("knowledge/guides/my-guide.md");

    // Click "Create draft"
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));

    // Check detail view for reviewer action fields
    await waitFor(() => expect(screen.getByRole("button", { name: "Submit Review" })).toBeInTheDocument());

    const reviewerInput = screen.getByLabelText(/Reviewer Name/i);
    const actionSelect = screen.getByLabelText(/Action/i);
    const commentArea = screen.getByLabelText(/Comment/i);

    fireEvent.change(reviewerInput, { target: { value: "alice" } });
    fireEvent.change(actionSelect, { target: { value: "COMMENT" } });
    fireEvent.change(commentArea, { target: { value: "Looks good" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit Review" }));

    await waitFor(() => {
      expect(client.reviewKcr).toHaveBeenCalledWith("KCR-1", "alice", "Looks good");
    });
    
    // Check timeline list
    expect(screen.getByText(/CREATED/i)).toBeInTheDocument();
  });
});
