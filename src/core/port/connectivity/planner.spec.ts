/**
 * @file Tests for connectable port planner - validates port connection planning logic
 */
import type { Connection, ConnectionDisconnectState, ConnectionDragState, Node, Port } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import {
  computeConnectablePortIds,
  resolveConnectableSourcePort,
} from "../connectivity/planner";
import type { ConnectablePortDescriptor } from "../connectivity/connectableTypes";
import { ConnectionSwitchBehavior } from "../connectivity/connectionPlanning";
import { createPortKey } from "../identity/key";

const makePort = (nodeId: string, id: string, type: "input" | "output"): Port => ({
  id,
  nodeId,
  type,
  label: `${nodeId}-${id}`,
  position: type === "output" ? "right" : "left",
});

const makeNode = (id: string, type: string): Node => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: {},
});

const makeDefinitions = (): Record<string, NodeDefinition> => ({
  producer: {
    type: "producer",
    displayName: "producer",
    ports: [{ id: "out", type: "output", label: "out", position: "right" }],
  },
  consumer: {
    type: "consumer",
    displayName: "consumer",
    ports: [{ id: "in", type: "input", label: "in", position: "left" }],
  },
});

const nodes = {
  source: makeNode("source", "producer"),
  other: makeNode("other", "producer"),
  target: makeNode("target", "consumer"),
};

const portsByNode: Record<string, Port[]> = {
  source: [makePort("source", "out", "output")],
  other: [makePort("other", "out", "output")],
  target: [makePort("target", "in", "input")],
};

const definitions = makeDefinitions();

const getNodePorts = (nodeId: string): Port[] => portsByNode[nodeId] ?? [];
const getNodeDefinition = (type: string): NodeDefinition | undefined => definitions[type];

const makeConnections = (...entries: Connection[]): Record<string, Connection> =>
  Object.fromEntries(entries.map((entry) => [entry.id, entry]));

describe("connectablePortPlanner", () => {
  it("prefers dragState source when present and returns connectable ports", () => {
    const dragState: ConnectionDragState = {
      fromPort: portsByNode.source[0],
      toPosition: { x: 0, y: 0 },
      validTarget: null,
      candidatePort: null,
    };

    const fallbackPort = portsByNode.other[0];

    // No existing connections - port has capacity
    const connectable = computeConnectablePortIds({
      dragState,
      disconnectState: null,
      fallbackPort,
      nodes,
      connections: {},
      getNodePorts,
      getNodeDefinition,
    });

    expect(connectable.ids.has(createPortKey("target", "in"))).toBe(true);
    expect(connectable.ids.has(createPortKey("other", "out"))).toBe(false);
    const descriptor = connectable.descriptors.get(createPortKey("target", "in")) as ConnectablePortDescriptor;
    expect(descriptor.portType).toBe("input");
    expect(descriptor.source.portType).toBe("output");
    expect(descriptor.behavior).toBe(ConnectionSwitchBehavior.Append);
  });

  it("returns empty connectable ports when source port is at capacity", () => {
    const dragState: ConnectionDragState = {
      fromPort: portsByNode.source[0],
      toPosition: { x: 0, y: 0 },
      validTarget: null,
      candidatePort: null,
    };

    const connections = makeConnections({
      id: "c-existing",
      fromNodeId: "source",
      fromPortId: "out",
      toNodeId: "target",
      toPortId: "in",
    });

    const connectable = computeConnectablePortIds({
      dragState,
      disconnectState: null,
      fallbackPort: null,
      nodes,
      connections,
      getNodePorts,
      getNodeDefinition,
    });

    // Port is at capacity (maxConnections=1), so no connectable ports
    expect(connectable.ids.size).toBe(0);
  });

  it("falls back to disconnect fixed port when drag state is absent", () => {
    // No existing connections - port has capacity
    const disconnectState: ConnectionDisconnectState = {
      connectionId: "c1",
      fixedPort: portsByNode.other[0],
      draggingEnd: "from",
      draggingPosition: { x: 0, y: 0 },
      originalConnection: {
        id: "c1",
        fromNodeId: "other",
        fromPortId: "out",
        toNodeId: "target",
        toPortId: "in",
      },
      disconnectedEnd: "from",
      candidatePort: null,
    };

    const connectable = computeConnectablePortIds({
      dragState: null,
      disconnectState,
      fallbackPort: null,
      nodes,
      connections: {},
      getNodePorts,
      getNodeDefinition,
    });

    expect(connectable.ids.size).toBeGreaterThan(0);
    expect(connectable.ids.has(createPortKey("target", "in"))).toBe(true);
    const descriptor = connectable.descriptors.get(createPortKey("target", "in")) as ConnectablePortDescriptor;
    expect(descriptor.behavior).toBe(ConnectionSwitchBehavior.Append);
  });

  it("returns empty set when no source can be resolved", () => {
    const connectable = computeConnectablePortIds({
      dragState: null,
      disconnectState: null,
      fallbackPort: null,
      nodes,
      connections: {},
      getNodePorts,
      getNodeDefinition,
    });

    expect(connectable.ids.size).toBe(0);
  });

  it("resolves source port consistently", () => {
    const fallbackPort = portsByNode.other[0];
    const dragState: ConnectionDragState = {
      fromPort: portsByNode.source[0],
      toPosition: { x: 0, y: 0 },
      validTarget: null,
      candidatePort: null,
    };

    const resolved = resolveConnectableSourcePort({ dragState, disconnectState: null, fallbackPort });
    expect(resolved).toBe(portsByNode.source[0]);

    const resolvedFallback = resolveConnectableSourcePort({ dragState: null, disconnectState: null, fallbackPort });
    expect(resolvedFallback).toBe(fallbackPort);
  });
});
