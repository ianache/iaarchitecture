import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnalysisHistory } from "./pages/AnalysisHistory.js";

type ButtonElement = ReactElement<{ children?: ReactNode; onClick?: () => void }>;

function buttons(node: ReactNode): ButtonElement[] {
  if (!isValidElement(node)) return [];
  const element = node as ButtonElement;
  return [
    ...(element.type === "button" ? [element] : []),
    ...Children.toArray(element.props.children).flatMap(buttons)
  ];
}

describe("AnalysisHistory", () => {
  it("renders each analysis summary and selects the requested analysis", () => {
    const selected: string[] = [];
    const view = AnalysisHistory({
      analyses: [{ id: "ANALYSIS-7", requirements: "Submit an order", knowledgeRevision: "abc123", status: "DRAFT", createdAt: "2026-08-10T10:00:00.000Z", updatedAt: "2026-08-10T12:30:00.000Z", hasResult: true }],
      onSelect: (id) => selected.push(id),
      onNewAnalysis: () => undefined
    });

    expect(renderToStaticMarkup(view)).toContain("ANALYSIS-7");
    expect(renderToStaticMarkup(view)).toContain("abc123");
    expect(renderToStaticMarkup(view)).toContain("2026-08-10T12:30:00.000Z");
    buttons(view).find((button) => button.props.children === "Select")?.props.onClick?.();

    expect(selected).toEqual(["ANALYSIS-7"]);
  });

  it("offers an action to start a new analysis", () => {
    let starts = 0;
    const view = AnalysisHistory({ analyses: [], onSelect: () => undefined, onNewAnalysis: () => { starts += 1; } });

    buttons(view).find((button) => button.props.children === "New analysis")?.props.onClick?.();

    expect(starts).toBe(1);
  });
});
