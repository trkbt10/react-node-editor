import { describe, expect, it } from "vitest";
import type { Node, Port, Position } from "../../../types/core";
import { ConnectionSwitchBehavior } from "./connectionSwitchBehavior";
import type { ConnectablePortsResult } from "./connectablePortPlanner";
import { findNearestConnectablePort } from "./connectionCandidate";

const createPort = (id: string, nodeId: string, type: Port["type"], label: string, position: Port["position"]): Port => ({
  id,
  nodeId,
  type,
  label,
  position,
});

const createNode = (id: string, type: string, position: Position): Node => ({
  id,
  type,
  position,
  data: {},
});

describe("findNearestConnectablePort", () => {
  const nodes: Record<string, Node> = {
    source: createNode("source", "source", { x: 0, y: 0 }),
    target: createNode("target", "target", { x: 100, y: 0 }),
    secondary: createNode("secondary", "target", { x: 140, y: 0 }),
  };

  const portsByNode: Record<string, Port[]> = {
    source: [createPort("out", "source", "output", "Out", "right")],
    target: [createPort("in", "target", "input", "In", "left")],
    secondary: [createPort("in", "secondary", "input", "In", "left")],
  };

  const connectionPoints: Record<string, Position> = {
    "target:in": { x: 120, y: 20 },
    "secondary:in": { x: 160, y: 20 },
  };

  const baseConnectable: ConnectablePortsResult = {
    ids: new Set(["target:in", "secondary:in"]),
    descriptors: new Map([
      [
        "target:in",
        {
          key: "target:in",
          nodeId: "target",
          portId: "in",
          portType: "input",
          portIndex: 0,
          source: { nodeId: "source", portId: "out", portType: "output", portIndex: 0 },
          behavior: ConnectionSwitchBehavior.Append,
        },
      ],
      [
        "secondary:in",
        {
          key: "secondary:in",
          nodeId: "secondary",
          portId: "in",
          portType: "input",
          portIndex: 0,
          source: { nodeId: "source", portId: "out", portType: "output", portIndex: 0 },
          behavior: ConnectionSwitchBehavior.Append,
        },
      ],
    ]),
    source: { nodeId: "source", portId: "out", portType: "output", portIndex: 0 },
  };

  const getNodePorts = (nodeId: string): Port[] => portsByNode[nodeId] ?? [];

  const getConnectionPoint = (nodeId: string, portId: string): Position | null => {
    const key = `${nodeId}:${portId}`;
    return connectionPoints[key] ?? null;
  };

  it("returns the nearest port within snap distance", () => {
    const pointer = { x: 121, y: 21 };
    const result = findNearestConnectablePort({
      pointerCanvasPosition: pointer,
      connectablePorts: baseConnectable,
      nodes,
      getNodePorts,
      getConnectionPoint,
    });

    expect(result).toEqual({
      id: "in",
      nodeId: "target",
      type: "input",
      label: "In",
      position: "left",
    });
  });

  it("returns null when no connectable port is within snap distance", () => {
    const pointer = { x: 400, y: 400 };
    const result = findNearestConnectablePort({
      pointerCanvasPosition: pointer,
      connectablePorts: baseConnectable,
      nodes,
      getNodePorts,
      getConnectionPoint,
    });

    expect(result).toBeNull();
  });

  it("ignores excluded ports and selects the next nearest candidate", () => {
    const pointer = { x: 158, y: 22 };
    const result = findNearestConnectablePort({
      pointerCanvasPosition: pointer,
      connectablePorts: baseConnectable,
      nodes,
      getNodePorts,
      getConnectionPoint,
      excludePort: { nodeId: "target", portId: "in" },
    });

    expect(result).toEqual({
      id: "in",
      nodeId: "secondary",
      type: "input",
      label: "In",
      position: "left",
    });
  });
});

// Reference: read connectablePortPlanner.ts to align descriptor expectations for tests.
