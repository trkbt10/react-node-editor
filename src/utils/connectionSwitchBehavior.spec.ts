import type { Connection, Node, Port } from "../types/core";
import type { NodeDefinition } from "../types/NodeDefinition";
import { planConnectionChange, ConnectionSwitchBehavior } from "./connectionSwitchBehavior";

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
  it("replaces existing connection when maxConnections is 1", () => {
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

    expect(plan.behavior).toBe(ConnectionSwitchBehavior.Replace);
    expect(plan.connection).not.toBeNull();
    expect(plan?.connection?.toNodeId).toBe("targetB");
    expect(plan.connectionIdsToReplace).toEqual(["c1"]);
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

  it("keeps existing connection when reconnecting to same target", () => {
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

    expect(plan.behavior).toBe(ConnectionSwitchBehavior.Replace);
    expect(plan.connection).toBeNull();
    expect(plan.connectionIdsToReplace).toEqual([]);
  });
});
