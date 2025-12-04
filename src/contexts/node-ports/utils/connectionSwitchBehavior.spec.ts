/**
 * @file Tests for connection switch behavior logic based on port capacity constraints
 */
import type { Connection, Node, Port } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import { planConnectionChange, ConnectionSwitchBehavior } from "./connectionSwitchBehavior";
import { getNodePorts } from "./portResolution";

const makeNode = (id: string, type: string): Node => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: {},
});

const makePort = (overrides: Partial<Port> & Pick<Port, "id" | "type" | "label" | "position" | "nodeId">): Port => ({
  dataType: undefined,
  maxConnections: undefined,
  allowedNodeTypes: undefined,
  allowedPortTypes: undefined,
  ...overrides,
});

const makeDefinitions = (maxConnections: number | "unlimited" | undefined): Record<string, NodeDefinition> => ({
  source: {
    type: "source",
    displayName: "source",
    ports: [
      {
        id: "out",
        type: "output",
        label: "out",
        position: "right",
        maxConnections,
      },
    ],
  },
  target: {
    type: "target",
    displayName: "target",
    ports: [
      {
        id: "in",
        type: "input",
        label: "in",
        position: "left",
      },
    ],
  },
});

const makeConnection = (id: string, toNodeId: string): Connection => ({
  id,
  fromNodeId: "source",
  fromPortId: "out",
  toNodeId,
  toPortId: "in",
});

describe("planConnectionChange", () => {
  it("ignores new connection when maxConnections is 1 and already full", () => {
    const definitions = makeDefinitions(1);
    const nodes = {
      source: makeNode("source", "source"),
      targetA: makeNode("targetA", "target"),
      targetB: makeNode("targetB", "target"),
    };
    const connections = {
      c1: makeConnection("c1", "targetA"),
    };
    const fromPort = makePort({ id: "out", nodeId: "source", type: "output", label: "out", position: "right" });
    const toPort = makePort({ id: "in", nodeId: "targetB", type: "input", label: "in", position: "left" });

    const plan = planConnectionChange({
      fromPort,
      toPort,
      nodes,
      connections,
      getNodeDefinition: (type) => definitions[type],
    });

    expect(plan.behavior).toBe(ConnectionSwitchBehavior.Ignore);
    expect(plan.connection).toBeNull();
    expect(plan.connectionIdsToReplace).toEqual([]);
  });

  it("ignores new connection when maxConnections is greater than 1 and already full", () => {
    const definitions = makeDefinitions(2);
    const nodes = {
      source: makeNode("source", "source"),
      targetA: makeNode("targetA", "target"),
      targetB: makeNode("targetB", "target"),
      targetC: makeNode("targetC", "target"),
    };
    const connections = {
      c1: makeConnection("c1", "targetA"),
      c2: makeConnection("c2", "targetB"),
    };
    const fromPort = makePort({ id: "out", nodeId: "source", type: "output", label: "out", position: "right" });
    const toPort = makePort({ id: "in", nodeId: "targetC", type: "input", label: "in", position: "left" });

    const plan = planConnectionChange({
      fromPort,
      toPort,
      nodes,
      connections,
      getNodeDefinition: (type) => definitions[type],
    });

    expect(plan.behavior).toBe(ConnectionSwitchBehavior.Ignore);
    expect(plan.connection).toBeNull();
    expect(plan.connectionIdsToReplace).toEqual([]);
  });

  it("appends connection when below capacity", () => {
    const definitions = makeDefinitions(3);
    const nodes = {
      source: makeNode("source", "source"),
      targetA: makeNode("targetA", "target"),
      targetB: makeNode("targetB", "target"),
    };
    const connections = {
      c1: makeConnection("c1", "targetA"),
    };
    const fromPort = makePort({ id: "out", nodeId: "source", type: "output", label: "out", position: "right" });
    const toPort = makePort({ id: "in", nodeId: "targetB", type: "input", label: "in", position: "left" });

    const plan = planConnectionChange({
      fromPort,
      toPort,
      nodes,
      connections,
      getNodeDefinition: (type) => definitions[type],
    });

    expect(plan.behavior).toBe(ConnectionSwitchBehavior.Append);
    expect(plan.connection).not.toBeNull();
    expect(plan.connectionIdsToReplace).toEqual([]);
  });

  it("ignores reconnection to same target when at capacity", () => {
    const definitions = makeDefinitions(1);
    const nodes = {
      source: makeNode("source", "source"),
      targetA: makeNode("targetA", "target"),
    };
    const connections = {
      c1: makeConnection("c1", "targetA"),
    };
    const fromPort = makePort({ id: "out", nodeId: "source", type: "output", label: "out", position: "right" });
    const toPort = makePort({ id: "in", nodeId: "targetA", type: "input", label: "in", position: "left" });

    const plan = planConnectionChange({
      fromPort,
      toPort,
      nodes,
      connections,
      getNodeDefinition: (type) => definitions[type],
    });

    expect(plan.behavior).toBe(ConnectionSwitchBehavior.Ignore);
    expect(plan.connection).toBeNull();
    expect(plan.connectionIdsToReplace).toEqual([]);
  });

  it("creates a connection for segmented multi-type dynamic ports", () => {
    const nodes: Record<string, Node> = {
      source: makeNode("source", "dynamic-source"),
      target: makeNode("target", "dynamic-target"),
    };

    const definitions: Record<string, NodeDefinition> = {
      "dynamic-source": {
        type: "dynamic-source",
        displayName: "Dynamic Source",
        ports: [
          {
            id: "out",
            type: "output",
            label: "Out",
            position: { side: "right", segment: "main" },
            dataTypes: ["text", "html"],
            instances: () => 2,
          },
        ],
      },
      "dynamic-target": {
        type: "dynamic-target",
        displayName: "Dynamic Target",
        ports: [
          {
            id: "in",
            type: "input",
            label: "In",
            position: { side: "left", segment: "main" },
            dataTypes: ["text", "markdown"],
            instances: () => 2,
          },
        ],
      },
    };

    const getDefinition = (type: string) => definitions[type];
    const sourcePorts = getNodePorts(nodes.source, definitions["dynamic-source"]);
    const targetPorts = getNodePorts(nodes.target, definitions["dynamic-target"]);
    const fromPort = sourcePorts[0];
    const toPort = targetPorts[1];

    const plan = planConnectionChange({
      fromPort,
      toPort,
      nodes,
      connections: {},
      getNodeDefinition: getDefinition,
    });

    expect(plan.behavior).toBe(ConnectionSwitchBehavior.Append);
    expect(plan.connection).not.toBeNull();
  });
});
