/**
 * @file Unit tests for connection validation utilities.
 */
import { canConnectPorts } from "./connectionValidation";
import type { Connection, Port } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import type { NodeDefinitionRegistry } from "../../../types/NodeDefinitionRegistry";
import { createNodeDefinitionRegistry } from "../../../types/NodeDefinitionRegistry";

describe("canConnectPorts - maxConnections default/unlimited", () => {
  const mkRegistry = (defs: NodeDefinition[]): NodeDefinitionRegistry => {
    const reg = createNodeDefinitionRegistry();
    defs.forEach((d) => reg.register(d));
    return reg;
  };

  const baseNodeDef = (type: string, ports?: NodeDefinition["ports"]): NodeDefinition => ({
    type,
    displayName: type,
    ports,
  });

  it("defaults to 1 for both sides when unspecified", () => {
    const defA = baseNodeDef("A", [{ id: "out", type: "output", label: "out", position: "right" }]);
    const defB = baseNodeDef("B", [{ id: "in", type: "input", label: "in", position: "left" }]);
    const reg = mkRegistry([defA, defB]);

    const aOut: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right" };
    const bIn: Port = { id: "in", nodeId: "b", type: "input", label: "in", position: "left" };

    const conns: Record<string, Connection> = {};
    // First connection allowed
    expect(canConnectPorts(aOut, bIn, reg.get("A"), reg.get("B"), conns)).toBe(true);
    // Simulate that connection now exists
    conns["c1"] = { id: "c1", fromNodeId: "a", fromPortId: "out", toNodeId: "b", toPortId: "in" };
    // Second connection from same output to a different input should be blocked by fromMax=1
    const b2In: Port = { id: "in", nodeId: "b2", type: "input", label: "in", position: "left" };
    expect(canConnectPorts(aOut, b2In, reg.get("A"), reg.get("B"), conns)).toBe(false);
  });

  it("respects 'unlimited' on output side", () => {
    const defA = baseNodeDef("A", [
      { id: "out", type: "output", label: "out", position: "right", maxConnections: "unlimited" },
    ]);
    const defB = baseNodeDef("B", [{ id: "in", type: "input", label: "in", position: "left" }]);
    const reg = mkRegistry([defA, defB]);

    const aOut: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right" };
    const bIn1: Port = { id: "in", nodeId: "b1", type: "input", label: "in", position: "left" };
    const bIn2: Port = { id: "in", nodeId: "b2", type: "input", label: "in", position: "left" };

    const conns: Record<string, Connection> = {
      c1: { id: "c1", fromNodeId: "a", fromPortId: "out", toNodeId: "b1", toPortId: "in" },
    };
    // Allow connecting same output to another input because output is unlimited
    expect(canConnectPorts(aOut, bIn2, reg.get("A"), reg.get("B"), conns)).toBe(true);
    // But connecting to same input again should be blocked by input default=1
    expect(canConnectPorts(aOut, bIn1, reg.get("A"), reg.get("B"), conns)).toBe(false);
  });

  it("respects 'unlimited' on input side", () => {
    const defA = baseNodeDef("A", [{ id: "out", type: "output", label: "out", position: "right" }]);
    const defB = baseNodeDef("B", [
      { id: "in", type: "input", label: "in", position: "left", maxConnections: "unlimited" },
    ]);
    const reg = mkRegistry([defA, defB]);

    const a1Out: Port = { id: "out", nodeId: "a1", type: "output", label: "out", position: "right" };
    const a2Out: Port = { id: "out", nodeId: "a2", type: "output", label: "out", position: "right" };
    const bIn: Port = { id: "in", nodeId: "b", type: "input", label: "in", position: "left" };

    const conns: Record<string, Connection> = {
      c1: { id: "c1", fromNodeId: "a1", fromPortId: "out", toNodeId: "b", toPortId: "in" },
    };
    // a2Out can also connect to the same input because input is unlimited
    expect(canConnectPorts(a2Out, bIn, reg.get("A"), reg.get("B"), conns)).toBe(true);
    // a1Out cannot make a second connection due to output default=1
    expect(canConnectPorts(a1Out, bIn, reg.get("A"), reg.get("B"), conns)).toBe(false);
  });

  it("allows identical port ids between different nodes", () => {
    const defA = baseNodeDef("ColorSource", [
      { id: "color", type: "output", label: "Color", position: "right", dataType: "color" },
    ]);
    const defB = baseNodeDef("ColorTarget", [
      { id: "color", type: "input", label: "Color", position: "left", dataType: "color" },
    ]);
    const reg = mkRegistry([defA, defB]);

    const sourcePort: Port = { id: "color", nodeId: "source-node", type: "output", label: "Color", position: "right" };
    const targetPort: Port = { id: "color", nodeId: "target-node", type: "input", label: "Color", position: "left" };
    expect(canConnectPorts(sourcePort, targetPort, reg.get("ColorSource"), reg.get("ColorTarget"), {})).toBe(true);
  });
});
