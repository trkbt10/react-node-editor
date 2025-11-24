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

  it("checks compatibility across multiple declared data types", () => {
    const defA = baseNodeDef("Producer", [
      { id: "out", type: "output", label: "out", position: "right", dataTypes: ["text", "html"] },
    ]);
    const defB = baseNodeDef("Consumer", [
      { id: "in", type: "input", label: "in", position: "left", dataTypes: ["markdown", "text"] },
    ]);
    const defC = baseNodeDef("JsonConsumer", [
      { id: "in", type: "input", label: "in", position: "left", dataTypes: ["json"] },
    ]);
    const reg = mkRegistry([defA, defB, defC]);

    const output: Port = { id: "out", nodeId: "producer", type: "output", label: "out", position: "right" };
    const input: Port = { id: "in", nodeId: "consumer", type: "input", label: "in", position: "left" };

    expect(canConnectPorts(output, input, reg.get("Producer"), reg.get("Consumer"), {})).toBe(true);
    expect(canConnectPorts(output, input, reg.get("Producer"), reg.get("JsonConsumer"), {})).toBe(false);
  });

  it("respects port-level canConnect predicates", () => {
    const defA = baseNodeDef("Gate", [
      {
        id: "out",
        type: "output",
        label: "out",
        position: "right",
        canConnect: ({ allConnections }) => Object.keys(allConnections ?? {}).length === 0,
      },
    ]);
    const defB = baseNodeDef("Sink", [{ id: "in", type: "input", label: "in", position: "left" }]);
    const reg = mkRegistry([defA, defB]);

    const outPort: Port = { id: "out", nodeId: "gate", type: "output", label: "out", position: "right" };
    const inPort: Port = { id: "in", nodeId: "sink", type: "input", label: "in", position: "left" };

    const firstAllowed = canConnectPorts(outPort, inPort, reg.get("Gate"), reg.get("Sink"), {});
    expect(firstAllowed).toBe(true);

    const existing: Record<string, Connection> = {
      c1: { id: "c1", fromNodeId: "gate", fromPortId: "out", toNodeId: "sink", toPortId: "in" },
    };
    const blocked = canConnectPorts(outPort, inPort, reg.get("Gate"), reg.get("Sink"), existing);
    expect(blocked).toBe(false);
  });

  it("honors dataTypes arrays and segment-aware canConnect hooks for dynamic ports", () => {
    const dynamicSource: NodeDefinition = {
      type: "dynamic-source",
      displayName: "Dynamic Source",
      ports: [
        {
          id: "main-output",
          type: "output",
          label: "Main",
          position: { side: "right", segment: "main" },
          dataTypes: ["text", "html"],
          instances: () => 1,
          canConnect: ({ fromPort, toPort }) =>
            fromPort.placement?.segment !== undefined && toPort?.placement?.segment === fromPort.placement.segment,
        },
      ],
    };
    const dynamicTarget: NodeDefinition = {
      type: "dynamic-target",
      displayName: "Dynamic Target",
      ports: [
        {
          id: "main-input",
          type: "input",
          label: "Main In",
          position: { side: "left", segment: "main" },
          dataTypes: ["markdown", "text"],
          instances: () => 1,
          canConnect: ({ fromPort, toPort }) =>
            toPort?.placement?.segment !== undefined && fromPort.placement?.segment === toPort.placement.segment,
        },
      ],
    };

    const reg = mkRegistry([dynamicSource, dynamicTarget]);

    const fromPort: Port = {
      id: "main-output-1",
      definitionId: "main-output",
      nodeId: "source",
      type: "output",
      label: "Main",
      position: "right",
      placement: { side: "right", segment: "main" },
      dataType: ["text", "html"],
    };

    const toPort: Port = {
      id: "main-input-1",
      definitionId: "main-input",
      nodeId: "target",
      type: "input",
      label: "Main In",
      position: "left",
      placement: { side: "left", segment: "main" },
      dataType: ["markdown", "text"],
    };

    const nodes = {
      source: { id: "source", type: "dynamic-source", position: { x: 0, y: 0 }, data: {} },
      target: { id: "target", type: "dynamic-target", position: { x: 0, y: 0 }, data: {} },
    };

    expect(canConnectPorts(fromPort, toPort, reg.get("dynamic-source"), reg.get("dynamic-target"), {}, { nodes })).toBe(
      true,
    );

    const incompatibleTarget: NodeDefinition = {
      type: "dynamic-target-json",
      displayName: "Dynamic Target (JSON)",
      ports: [
        {
          id: "main-input",
          type: "input",
          label: "Main In",
          position: { side: "left", segment: "main" },
          dataTypes: ["json"],
          instances: () => 1,
          canConnect: ({ fromPort, toPort }) =>
            toPort?.placement?.segment !== undefined && fromPort.placement?.segment === toPort.placement.segment,
        },
      ],
    };
    const regNoOverlap = mkRegistry([dynamicSource, incompatibleTarget]);

    const blockedByDataTypes = canConnectPorts(
      fromPort,
      { ...toPort, dataType: ["json"] },
      regNoOverlap.get("dynamic-source"),
      regNoOverlap.get("dynamic-target-json"),
      {},
      { nodes },
    );
    expect(blockedByDataTypes).toBe(false);

    const blockedBySegment = canConnectPorts(
      fromPort,
      { ...toPort, placement: { side: "left", segment: "aux" } },
      reg.get("dynamic-source"),
      reg.get("dynamic-target"),
      {},
      { nodes },
    );
    expect(blockedBySegment).toBe(false);
  });
});
