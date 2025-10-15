/**
 * @file Tests for NodeEditor context - validates node and connection CRUD operations
 */
import { render, screen, act } from "@testing-library/react";
import { useEffect, useRef, useState, type FC } from "react";
import { NodeEditorProvider } from "./provider";
import { useNodeEditor } from "./context";
import { nodeEditorActions } from "./actions";
import { nodeEditorReducer } from "./reducer";
import type { NodeEditorData } from "../../types/core";
import { NodeDefinitionProvider } from "../node-definitions/provider";
import type { NodeDefinition } from "../../types/NodeDefinition";
import { StandardNodeDefinition } from "../../node-definitions/standard";

const makeBasicData = (): NodeEditorData => ({
  nodes: {
    n1: {
      id: "n1",
      type: "standard",
      position: { x: 0, y: 0 },
      data: { title: "Node 1", content: "c1" },
    },
  },
  connections: {},
});

const testNodeDefinitions: NodeDefinition[] = [StandardNodeDefinition as unknown as NodeDefinition];

const withNodeDefinitions = (children: React.ReactNode): React.ReactElement => (
  <NodeDefinitionProvider nodeDefinitions={testNodeDefinitions}>{children}</NodeDefinitionProvider>
);

const UncontrolledHarness: FC = () => {
  const { state, actions } = useNodeEditor();

  useEffect(() => {
    actions.updateNode("n1", { position: { x: 10, y: 20 } });
  }, [actions]);

  return (
    <div>
      <div data-testid="pos-x">{state.nodes.n1?.position.x}</div>
      <div data-testid="pos-y">{state.nodes.n1?.position.y}</div>
    </div>
  );
};

const ControlledHarness: FC = () => {
  const { actions, state } = useNodeEditor();
  useEffect(() => {
    actions.updateNode("n1", { position: { x: 99, y: 77 } });
  }, [actions]);
  return (
    <div>
      <div data-testid="pos-x">{state.nodes.n1?.position.x}</div>
      <div data-testid="pos-y">{state.nodes.n1?.position.y}</div>
    </div>
  );
};

describe("NodeEditorContext reducer - updates", () => {
  it("UPDATE_NODE merges shallowly and preserves other fields", () => {
    const initial = makeBasicData();
    const next = nodeEditorReducer(initial, nodeEditorActions.updateNode("n1", { position: { x: 5, y: 6 } }));
    expect(next.nodes.n1.position).toEqual({ x: 5, y: 6 });
    expect(next.nodes.n1.data).toEqual(initial.nodes.n1.data);
    const next2 = nodeEditorReducer(next, nodeEditorActions.updateNode("n1", { data: { title: "Changed" } }));
    expect(next2.nodes.n1.data).toEqual({ title: "Changed" });
  });

  it("MOVE_NODES updates multiple positions", () => {
    const initial: NodeEditorData = {
      nodes: {
        a: { id: "a", type: "standard", position: { x: 0, y: 0 }, data: {} },
        b: { id: "b", type: "standard", position: { x: 1, y: 2 }, data: {} },
      },
      connections: {},
    };
    const updated = nodeEditorReducer(
      initial,
      nodeEditorActions.moveNodes({ a: { x: 10, y: 11 }, b: { x: 20, y: 21 } }),
    );
    expect(updated.nodes.a.position).toEqual({ x: 10, y: 11 });
    expect(updated.nodes.b.position).toEqual({ x: 20, y: 21 });
  });

  it("DELETE_NODE removes related connections", () => {
    const initial: NodeEditorData = {
      nodes: {
        a: { id: "a", type: "standard", position: { x: 0, y: 0 }, data: {} },
        b: { id: "b", type: "standard", position: { x: 0, y: 0 }, data: {} },
      },
      connections: {
        c1: { id: "c1", fromNodeId: "a", fromPortId: "o", toNodeId: "b", toPortId: "i" },
        c2: { id: "c2", fromNodeId: "b", fromPortId: "o", toNodeId: "a", toPortId: "i" },
      },
    };
    const updated = nodeEditorReducer(initial, nodeEditorActions.deleteNode("a"));
    expect(updated.nodes.a).toBeUndefined();
    expect(updated.connections.c1).toBeUndefined();
    expect(updated.connections.c2).toBeUndefined();
  });

  it("ADD_CONNECTION does not enforce connection limits (validation is upstream)", () => {
    const initial: NodeEditorData = {
      nodes: {
        a: { id: "a", type: "t", position: { x: 0, y: 0 }, data: {} },
        b: { id: "b", type: "t", position: { x: 0, y: 0 }, data: {} },
        c: { id: "c", type: "t", position: { x: 0, y: 0 }, data: {} },
      },
      connections: {},
    };
    const s1 = nodeEditorReducer(
      initial,
      nodeEditorActions.addConnection({ fromNodeId: "a", fromPortId: "out", toNodeId: "c", toPortId: "in" }),
    );
    const s2 = nodeEditorReducer(
      s1,
      nodeEditorActions.addConnection({ fromNodeId: "b", fromPortId: "out", toNodeId: "c", toPortId: "in" }),
    );
    const conns = Object.values(s2.connections);
    expect(conns.length).toBe(2);
  });

  it("DUPLICATE_NODES creates offset copy with 'Copy' title and tracks lastDuplicatedNodeIds", () => {
    const initial: NodeEditorData = {
      nodes: { n1: { id: "n1", type: "t", position: { x: 10, y: 20 }, data: { title: "Original" } } },
      connections: {},
    };
    const next = nodeEditorReducer(initial, nodeEditorActions.duplicateNodes(["n1"]));
    const added = Object.values(next.nodes).filter((n) => n.id !== "n1");
    expect(added.length).toBe(1);
    const dup = added[0];
    expect(dup.position).toEqual({ x: 60, y: 70 });
    expect(String(dup.data.title)).toMatch(/Copy$/);
    expect(next.lastDuplicatedNodeIds?.[0]).toBe(dup.id);
  });

  it("GROUP_NODES adds a group node bounding children and listing them", () => {
    const initial: NodeEditorData = {
      nodes: {
        a: { id: "a", type: "t", position: { x: 100, y: 100 }, size: { width: 100, height: 50 }, data: {} },
        b: { id: "b", type: "t", position: { x: 250, y: 180 }, size: { width: 120, height: 60 }, data: {} },
      },
      connections: {},
    };
    const next = nodeEditorReducer(initial, nodeEditorActions.groupNodes(["a", "b"]));
    const groups = Object.values(next.nodes).filter((n) => n.type === "group");
    expect(groups.length).toBe(1);
    const g = groups[0];
    expect(g.children).toEqual(["a", "b"]);
    expect(g.size?.width).toBeGreaterThan(0);
    expect(g.size?.height).toBeGreaterThan(0);
  });
});

describe("NodeEditorProvider - uncontrolled vs controlled updates", () => {
  it("uncontrolled: dispatch mutates internal state", async () => {
    await act(async () => {
      render(
        withNodeDefinitions(
          <NodeEditorProvider initialState={makeBasicData()}>
            <UncontrolledHarness />
          </NodeEditorProvider>,
        ),
      );
    });
    expect(screen.getByTestId("pos-x").textContent).toBe("10");
    expect(screen.getByTestId("pos-y").textContent).toBe("20");
  });

  it("controlled: dispatch calls onDataChange with new state and does not mutate context state directly", async () => {
    const onChangeCalls: NodeEditorData[] = [];
    const onChange = (value: NodeEditorData): void => {
      onChangeCalls.push(value);
    };
    const data = makeBasicData();
    await act(async () => {
      render(
        withNodeDefinitions(
          <NodeEditorProvider controlledData={data} onDataChange={onChange}>
            <ControlledHarness />
          </NodeEditorProvider>,
        ),
      );
    });
    expect(screen.getByTestId("pos-x").textContent).toBe("0");
    expect(screen.getByTestId("pos-y").textContent).toBe("0");
    expect(onChangeCalls.length).toBeGreaterThan(0);
    const lastCallArg = onChangeCalls.at(-1);
    if (!lastCallArg) {
      throw new Error("Expected onDataChange to be called at least once");
    }
    expect(lastCallArg.nodes.n1.position).toEqual({ x: 99, y: 77 });
  });
});

describe("onDataChange loop prevention", () => {
  it("uncontrolled: parent setState in onDataChange does not cause infinite loops", async () => {
    const initial = makeBasicData();
    const Parent: FC = () => {
      const [mirror, setMirror] = useState<NodeEditorData | null>(null);
      const callsRef = useRef(0);
      return withNodeDefinitions(
        <NodeEditorProvider
          initialState={initial}
          onDataChange={(d) => {
            callsRef.current += 1;
            setMirror(d);
          }}
        >
          <UncontrolledHarness />
          <div data-testid="calls">{String(callsRef.current)}</div>
          <div data-testid="mirror-null">{String(mirror === null)}</div>
        </NodeEditorProvider>,
      );
    };
    await act(async () => {
      render(<Parent />);
    });
    const calls = Number(screen.getByTestId("calls").textContent);
    expect(calls).toBeGreaterThanOrEqual(1);
    expect(calls).toBeLessThan(5);
    expect(screen.getByTestId("mirror-null").textContent).toBe("false");
  });

  it("controlled: onDataChange updates parent and does not re-trigger without new dispatch", async () => {
    const initial = makeBasicData();
    const Parent: FC = () => {
      const [data, setData] = useState<NodeEditorData>(initial);
      const callsRef = useRef(0);
      return withNodeDefinitions(
        <NodeEditorProvider
          controlledData={data}
          onDataChange={(d) => {
            callsRef.current += 1;
            setData(d);
          }}
        >
          <ControlledHarness />
          <div data-testid="calls">{String(callsRef.current)}</div>
        </NodeEditorProvider>,
      );
    };
    await act(async () => {
      render(<Parent />);
    });
    const calls = Number(screen.getByTestId("calls").textContent);
    expect(calls).toBe(1);
  });
});
