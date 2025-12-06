/**
 * @file Tests for EditorActionStateContext - validates action state management and dispatch
 */
import { render } from "@testing-library/react";
import { useEffect, type FC } from "react";
import { EditorActionStateProvider, useEditorActionState } from "./EditorActionStateContext";
import { NodeEditorProvider } from "./node-editor/provider";
import { NodeDefinitionProvider } from "../node-definitions/provider";
import { NodeCanvasProvider } from "./canvas/viewport/provider";
import { asNodeDefinition, type NodeDefinition } from "../../types/NodeDefinition";
import { StandardNodeDefinition } from "../../node-definitions/standard";

const testNodeDefinitions: NodeDefinition[] = [asNodeDefinition(StandardNodeDefinition)];

const TestProviders: FC<{ children: React.ReactNode }> = ({ children }) => (
  <NodeDefinitionProvider nodeDefinitions={testNodeDefinitions}>
    <NodeEditorProvider>
      <NodeCanvasProvider>
        {children}
      </NodeCanvasProvider>
    </NodeEditorProvider>
  </NodeDefinitionProvider>
);

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
      <TestProviders>
        <EditorActionStateProvider>
          <Harness />
        </EditorActionStateProvider>
      </TestProviders>,
    );
    // After clearSelection should be 0
    expect(getByTestId("selected-count").textContent).toBe("0");
  });
});
