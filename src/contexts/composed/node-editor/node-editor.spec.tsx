/**
 * @file Tests for NodeEditor context - validates node and connection CRUD operations
 */
import { render, screen, act } from "@testing-library/react";
import {
  useEffect,
  useRef,
  useState,
  memo,
  type Dispatch,
  type FC,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { NodeEditorProvider } from "./provider";
import { useNodeEditor } from "./context";
import { nodeEditorActions } from "./actions";
import { nodeEditorReducer } from "./reducer";
import type { NodeEditorData } from "../../../types/core";
import { NodeDefinitionProvider } from "../../node-definitions/provider";
import { asNodeDefinition, type NodeDefinition } from "../../../types/NodeDefinition";
import { StandardNodeDefinition } from "../../../node-definitions/standard";

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

const testNodeDefinitions: NodeDefinition[] = [asNodeDefinition(StandardNodeDefinition)];

const withNodeDefinitions = (children: React.ReactNode): React.ReactElement => (
  <NodeDefinitionProvider nodeDefinitions={testNodeDefinitions}>{children}</NodeDefinitionProvider>
);

const UncontrolledHarness: FC = () => {
  const { state, actions } = useNodeEditor();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!hasRunRef.current) {
      hasRunRef.current = true;
      actions.updateNode("n1", { position: { x: 10, y: 20 } });
    }
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
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!hasRunRef.current) {
      hasRunRef.current = true;
      actions.updateNode("n1", { position: { x: 99, y: 77 } });
    }
  }, [actions]);

  return (
    <div>
      <div data-testid="pos-x">{state.nodes.n1?.position.x}</div>
      <div data-testid="pos-y">{state.nodes.n1?.position.y}</div>
    </div>
  );
};

type ControlledStabilityHarnessProps = {
  onReady: (controls: ControlledStabilityControls) => void;
};

type ControlledStabilityControls = {
  setData: Dispatch<SetStateAction<NodeEditorData>>;
  getRenderCount: () => number;
  getStateRef: () => NodeEditorData | null;
};

const ControlledStabilityConsumer: FC<{
  renderCountRef: MutableRefObject<number>;
  stateRef: MutableRefObject<NodeEditorData | null>;
}> = memo(({ renderCountRef, stateRef }) => {
  const { state } = useNodeEditor();
  renderCountRef.current += 1;
  stateRef.current = state;
  return null;
});

const ControlledStabilityHarness: FC<ControlledStabilityHarnessProps> = ({ onReady }) => {
  const [data, setData] = useState<NodeEditorData>(makeBasicData());
  const renderCountRef = useRef(0);
  const stateRef = useRef<NodeEditorData | null>(null);

  useEffect(() => {
    onReady({
      setData,
      getRenderCount: () => renderCountRef.current,
      getStateRef: () => stateRef.current,
    });
  }, [onReady, setData]);

  return withNodeDefinitions(
    <NodeEditorProvider controlledData={data} onDataChange={() => {}}>
      <ControlledStabilityConsumer renderCountRef={renderCountRef} stateRef={stateRef} />
    </NodeEditorProvider>,
  );
};

const ControlledSequentialUpdateHarness: FC = () => {
  const [data, setData] = useState<NodeEditorData>(makeBasicData());
  const [callCount, setCallCount] = useState(0);

  return withNodeDefinitions(
    <NodeEditorProvider
      controlledData={data}
      onDataChange={(next) => {
        setCallCount((count) => count + 1);
        setData(next);
      }}
    >
      <ControlledSequentialUpdater />
      <div data-testid="call-count">{String(callCount)}</div>
      <div data-testid="temp-exists">{String(Boolean(data.nodes.temp))}</div>
      <div data-testid="temp-pos">
        {data.nodes.temp ? `${data.nodes.temp.position.x},${data.nodes.temp.position.y}` : "none"}
      </div>
    </NodeEditorProvider>,
  );
};

const ControlledSequentialUpdater: FC = () => {
  const { actions } = useNodeEditor();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;
    actions.addNodeWithId({
      id: "temp",
      type: "standard",
      position: { x: 0, y: 0 },
      data: { title: "Temp" },
    });
    actions.moveNode("temp", { x: 5, y: 7 });
  }, [actions]);

  return null;
};

const ControlledPreferenceProbe: FC<{ label: string }> = ({ label }) => {
  const { state } = useNodeEditor();
  return (
    <div data-testid={`controlled-probe-${label}`}>
      {Object.values(state.nodes)
        .map((node) => node.data.title || node.id)
        .join(",")}
    </div>
  );
};

const ControlledNoParentUpdateHarness: FC = () => {
  const { actions, state } = useNodeEditor();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;
    actions.moveNode("n1", { x: 10, y: 20 });
    actions.updateNode("n1", { size: { width: 300, height: 120 } });
  }, [actions]);

  const node = state.nodes.n1;
  return (
    <div>
      <div data-testid="no-parent-pos">{node ? `${node.position.x},${node.position.y}` : "none"}</div>
      <div data-testid="no-parent-size">{node?.size?.width ?? "none"}</div>
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
    expect(screen.getByTestId("pos-x").textContent).toBe("99");
    expect(screen.getByTestId("pos-y").textContent).toBe("77");
    expect(onChangeCalls.length).toBeGreaterThan(0);
    const lastCallArg = onChangeCalls.at(-1);
    if (!lastCallArg) {
      throw new Error("Expected onDataChange to be called at least once");
    }
    expect(lastCallArg.nodes.n1.position).toEqual({ x: 99, y: 77 });
  });

  it("treats presence of controlledData like React value prop even when initialState is provided", async () => {
    const controlled = makeBasicData();
    const initial: NodeEditorData = {
      nodes: {
        n1: { id: "n1", type: "standard", position: { x: 50, y: 50 }, data: { title: "Initial Should Ignore" } },
      },
      connections: {},
    };

    const { rerender } = render(
      withNodeDefinitions(
        <NodeEditorProvider initialState={initial} controlledData={controlled}>
          <ControlledPreferenceProbe label="first" />
        </NodeEditorProvider>,
      ),
    );

    expect(screen.getByTestId("controlled-probe-first").textContent).toContain("Node 1");
    expect(screen.getByTestId("controlled-probe-first").textContent).not.toContain("Initial Should Ignore");

    const updatedInitial: NodeEditorData = {
      nodes: {
        n1: { id: "n1", type: "standard", position: { x: 75, y: 75 }, data: { title: "Updated Initial" } },
      },
      connections: {},
    };

    rerender(
      withNodeDefinitions(
        <NodeEditorProvider initialState={updatedInitial} controlledData={controlled}>
          <ControlledPreferenceProbe label="second" />
        </NodeEditorProvider>,
      ),
    );

    expect(screen.getByTestId("controlled-probe-second").textContent).toContain("Node 1");
    expect(screen.getByTestId("controlled-probe-second").textContent).not.toContain("Updated Initial");
  });
});

describe("controlled data stability", () => {
  it("reuses previous state reference when controlled data is structurally unchanged", async () => {
    const controlsRef = { current: null as ControlledStabilityControls | null };

    await act(async () => {
      render(<ControlledStabilityHarness onReady={(controls) => (controlsRef.current = controls)} />);
    });

    const controls = controlsRef.current;
    if (!controls) {
      throw new Error("Expected stability harness to provide controls");
    }

    const initialState = controls.getStateRef();
    if (!initialState) {
      throw new Error("Expected initial state to be available");
    }

    expect(controls.getRenderCount()).toBe(1);

    await act(async () => {
      controls.setData((current) => ({
        nodes: { ...current.nodes },
        connections: { ...current.connections },
      }));
    });

    expect(controls.getRenderCount()).toBe(1);
    expect(controls.getStateRef()).toBe(initialState);

    await act(async () => {
      controls.setData({
        nodes: {
          ...initialState.nodes,
          n1: { ...initialState.nodes.n1, position: { x: 42, y: 24 } },
        },
        connections: initialState.connections,
      });
    });

    expect(controls.getRenderCount()).toBe(2);
    const updatedState = controls.getStateRef();
    if (!updatedState) {
      throw new Error("Expected updated state to be available");
    }
    expect(updatedState.nodes.n1.position).toEqual({ x: 42, y: 24 });
  });
});

describe("controlled rapid updates", () => {
  it("does not roll back when multiple controlled actions occur before parent re-renders", async () => {
    await act(async () => {
      render(<ControlledSequentialUpdateHarness />);
    });

    expect(screen.getByTestId("call-count").textContent).toBe("2");
    expect(screen.getByTestId("temp-exists").textContent).toBe("true");
    expect(screen.getByTestId("temp-pos").textContent).toBe("5,7");
  });

  it("keeps latest state even when parent does not immediately reapply controlled data", async () => {
    await act(async () => {
      render(
        withNodeDefinitions(
          <NodeEditorProvider controlledData={makeBasicData()} onDataChange={() => {}}>
            <ControlledNoParentUpdateHarness />
          </NodeEditorProvider>,
        ),
      );
    });

    expect(screen.getByTestId("no-parent-pos").textContent).toBe("10,20");
    expect(screen.getByTestId("no-parent-size").textContent).toBe("300");
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
