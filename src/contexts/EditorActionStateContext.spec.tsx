/**
 * @file Tests for EditorActionStateContext - validates action state management and dispatch
 */
import { render } from "@testing-library/react";
import { useEffect, type FC } from "react";
import { EditorActionStateProvider, useEditorActionState } from "./EditorActionStateContext";

const Harness: FC = () => {
  const { state, actions } = useEditorActionState();
  useEffect(() => {
    actions.selectInteractionNode("n1", false);
    actions.selectEditingNode("n1", false);
    // Note: setSelectionBox has moved to CanvasInteractionContext
    actions.clearSelection();
  }, [actions]);
  return <div data-testid="selected-count">{String(state.selectedNodeIds.length)}</div>;
};

describe("EditorActionStateContext", () => {
  it("provides state and actions; selection updates as expected", () => {
    const { getByTestId } = render(
      <EditorActionStateProvider>
        <Harness />
      </EditorActionStateProvider>,
    );
    // After clearSelection should be 0
    expect(getByTestId("selected-count").textContent).toBe("0");
  });
});
