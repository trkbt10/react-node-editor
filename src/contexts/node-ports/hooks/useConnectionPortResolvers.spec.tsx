/**
 * @file Tests for useConnectionPortResolvers - validates resilience to unregistered node types
 */
import { render } from "@testing-library/react";
import { type FC, useEffect, useState } from "react";
import { NodeEditorProvider } from "../../composed/node-editor/provider";
import { NodeDefinitionProvider } from "../../node-definitions/provider";
import { NodeCanvasProvider } from "../../composed/canvas/viewport/provider";
import { CanvasInteractionProvider } from "../../composed/canvas/interaction/provider";
import { EditorActionStateProvider } from "../../composed/EditorActionStateContext";
import { PortPositionProvider } from "../provider";
import { useConnectionPortResolvers } from "./useConnectionPortResolvers";
import { asNodeDefinition, type NodeDefinition } from "../../../types/NodeDefinition";
import { StandardNodeDefinition } from "../../../node-definitions/standard";
import type { NodeEditorData } from "../../../types/core";
import { createPortKey } from "../../../core/port/identity/key";
import { createEmptyConnectablePorts } from "../../../core/port/connectivity/connectableTypes";

const testNodeDefinitions: NodeDefinition[] = [asNodeDefinition(StandardNodeDefinition)];

const makeData = (): NodeEditorData => ({
  nodes: {
    n1: {
      id: "n1",
      type: "standard",
      position: { x: 0, y: 0 },
      data: { title: "Known" },
    },
    n2: {
      id: "n2",
      type: "unknown-type",
      position: { x: 100, y: 0 },
      data: { title: "Unknown" },
    },
  },
  connections: {},
});

const Harness: FC = () => {
  const { resolveCandidatePort } = useConnectionPortResolvers();
  const [result, setResult] = useState("pending");

  useEffect(() => {
    try {
      const resolved = resolveCandidatePort({ x: 0, y: 0 });
      setResult(resolved ? "port" : "null");
    } catch {
      setResult("threw");
    }
  }, [resolveCandidatePort]);

  return <div data-testid="result">{result}</div>;
};

describe("useConnectionPortResolvers", () => {
  it("does not throw when connectablePorts include a port on an unregistered node type", () => {
    const connectablePorts = createEmptyConnectablePorts();
    connectablePorts.ids.add(createPortKey("n2", "p2"));

    const { getByTestId } = render(
      <NodeDefinitionProvider nodeDefinitions={testNodeDefinitions}>
        <NodeEditorProvider initialState={makeData()}>
          <NodeCanvasProvider>
            <CanvasInteractionProvider
              initialState={{
                connectionDragState: {
                  fromPort: { id: "p1", type: "output", label: "P1", nodeId: "n1", position: "right" },
                  toPosition: { x: 0, y: 0 },
                  validTarget: null,
                  candidatePort: null,
                },
              }}
            >
              <EditorActionStateProvider initialState={{ connectablePorts }}>
                <PortPositionProvider>
                  <Harness />
                </PortPositionProvider>
              </EditorActionStateProvider>
            </CanvasInteractionProvider>
          </NodeCanvasProvider>
        </NodeEditorProvider>
      </NodeDefinitionProvider>,
    );

    expect(getByTestId("result").textContent).toBe("null");
  });
});

