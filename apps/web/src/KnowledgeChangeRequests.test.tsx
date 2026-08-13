/** @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KnowledgeChangeRequests } from "./pages/KnowledgeChangeRequests.js";
import type { ApiClient } from "./api/client.js";

describe("KnowledgeChangeRequests", () => {
  afterEach(() => cleanup());

  it("creates a new draft and reviews it", async () => {
    const client = {
      listKcrs: vi.fn().mockResolvedValue([]),
      createKcr: vi.fn().mockResolvedValue({ id: "KCR-1", status: "DRAFT" }),
      getKcr: vi.fn().mockResolvedValue({ id: "KCR-1", status: "DRAFT", category: "standards", author: "test", baseRevision: "abc", document: { title: "Test" } }),
      reviewKcr: vi.fn().mockResolvedValue({}),
      approveKcr: vi.fn().mockResolvedValue({}),
      getKcrAudit: vi.fn().mockResolvedValue({ events: [] }),
    } as unknown as ApiClient;

    render(<KnowledgeChangeRequests client={client} onBack={vi.fn()} />);

    // Click "New knowledge proposal"
    fireEvent.click(await screen.findByRole("button", { name: "New knowledge proposal" }));

    // Click "Create draft"
    fireEvent.click(screen.getByRole("button", { name: "Create draft" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument());
  });
});
