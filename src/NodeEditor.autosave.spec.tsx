/**
 * @file NodeEditor autosave spec
 */
import { render, screen } from "@testing-library/react";
import { NodeEditor } from "./NodeEditor";

describe("NodeEditor autoSave override", () => {
  it("hides Auto-save status when autoSaveEnabled is false", () => {
    render(<NodeEditor autoSaveEnabled={false} initialData={{ nodes: {}, connections: {} }} />);
    // StatusBar is rendered by default (showStatusBar default true)
    const statusBar = screen.getByTestId("status-bar");
    expect(statusBar).toBeTruthy();
    // Auto-save section should not appear
    expect(screen.queryByText("Auto-save")).toBeNull();
  });
});
