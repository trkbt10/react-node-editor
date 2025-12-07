/**
 * @file Unit tests for connection validation utilities.
 */
import { canConnectPorts } from "./validation";
import type { Connection, Port } from "../../types/core";
import type { NodeDefinition } from "../../types/NodeDefinition";
import type { NodeDefinitionRegistry } from "../../types/NodeDefinitionRegistry";
import { createNodeDefinitionRegistry } from "../../types/NodeDefinitionRegistry";
import { getPlacementSegment } from "../port/spatiality/placement";

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

describe("canConnectPorts - basic rules", () => {
  it("rejects same port type (output to output)", () => {
    const port1: Port = { id: "out1", nodeId: "a", type: "output", label: "out1", position: "right" };
    const port2: Port = { id: "out2", nodeId: "b", type: "output", label: "out2", position: "right" };
    expect(canConnectPorts(port1, port2)).toBe(false);
  });

  it("rejects same port type (input to input)", () => {
    const port1: Port = { id: "in1", nodeId: "a", type: "input", label: "in1", position: "left" };
    const port2: Port = { id: "in2", nodeId: "b", type: "input", label: "in2", position: "left" };
    expect(canConnectPorts(port1, port2)).toBe(false);
  });

  it("rejects same node connection", () => {
    const outPort: Port = { id: "out", nodeId: "same-node", type: "output", label: "out", position: "right" };
    const inPort: Port = { id: "in", nodeId: "same-node", type: "input", label: "in", position: "left" };
    expect(canConnectPorts(outPort, inPort)).toBe(false);
  });

  it("allows output to input connection", () => {
    const outPort: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right" };
    const inPort: Port = { id: "in", nodeId: "b", type: "input", label: "in", position: "left" };
    expect(canConnectPorts(outPort, inPort)).toBe(true);
  });

  it("allows input to output connection (reversed)", () => {
    const inPort: Port = { id: "in", nodeId: "a", type: "input", label: "in", position: "left" };
    const outPort: Port = { id: "out", nodeId: "b", type: "output", label: "out", position: "right" };
    expect(canConnectPorts(inPort, outPort)).toBe(true);
  });
});

describe("canConnectPorts - duplicate connection detection", () => {
  it("rejects identical connection (same direction)", () => {
    const outPort: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right" };
    const inPort: Port = { id: "in", nodeId: "b", type: "input", label: "in", position: "left" };
    const existing: Record<string, Connection> = {
      c1: { id: "c1", fromNodeId: "a", fromPortId: "out", toNodeId: "b", toPortId: "in" },
    };
    expect(canConnectPorts(outPort, inPort, undefined, undefined, existing)).toBe(false);
  });

  it("rejects identical connection (reversed direction)", () => {
    const inPort: Port = { id: "in", nodeId: "b", type: "input", label: "in", position: "left" };
    const outPort: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right" };
    const existing: Record<string, Connection> = {
      c1: { id: "c1", fromNodeId: "a", fromPortId: "out", toNodeId: "b", toPortId: "in" },
    };
    expect(canConnectPorts(inPort, outPort, undefined, undefined, existing)).toBe(false);
  });

  it("allows connection to different port on same node", () => {
    const outPort: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right" };
    const _inPort1: Port = { id: "in1", nodeId: "b", type: "input", label: "in1", position: "left" };
    const inPort2: Port = { id: "in2", nodeId: "b", type: "input", label: "in2", position: "left" };
    const existing: Record<string, Connection> = {
      c1: { id: "c1", fromNodeId: "a", fromPortId: "out", toNodeId: "b", toPortId: "in1" },
    };
    const defA = baseNodeDef("A", [
      { id: "out", type: "output", label: "out", position: "right", maxConnections: "unlimited" },
    ]);
    const defB = baseNodeDef("B", [
      { id: "in1", type: "input", label: "in1", position: "left" },
      { id: "in2", type: "input", label: "in2", position: "left" },
    ]);
    expect(canConnectPorts(outPort, inPort2, defA, defB, existing)).toBe(true);
  });
});

describe("canConnectPorts - validateConnection callback", () => {
  it("rejects when fromNodeDef validateConnection returns false", () => {
    const defA = baseNodeDef("A", [{ id: "out", type: "output", label: "out", position: "right" }]);
    defA.validateConnection = () => false;
    const defB = baseNodeDef("B", [{ id: "in", type: "input", label: "in", position: "left" }]);

    const outPort: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right" };
    const inPort: Port = { id: "in", nodeId: "b", type: "input", label: "in", position: "left" };
    expect(canConnectPorts(outPort, inPort, defA, defB)).toBe(false);
  });

  it("rejects when toNodeDef validateConnection returns false", () => {
    const defA = baseNodeDef("A", [{ id: "out", type: "output", label: "out", position: "right" }]);
    const defB = baseNodeDef("B", [{ id: "in", type: "input", label: "in", position: "left" }]);
    defB.validateConnection = () => false;

    const outPort: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right" };
    const inPort: Port = { id: "in", nodeId: "b", type: "input", label: "in", position: "left" };
    expect(canConnectPorts(outPort, inPort, defA, defB)).toBe(false);
  });

  it("allows when both validateConnection return true", () => {
    const defA = baseNodeDef("A", [{ id: "out", type: "output", label: "out", position: "right" }]);
    defA.validateConnection = () => true;
    const defB = baseNodeDef("B", [{ id: "in", type: "input", label: "in", position: "left" }]);
    defB.validateConnection = () => true;

    const outPort: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right" };
    const inPort: Port = { id: "in", nodeId: "b", type: "input", label: "in", position: "left" };
    expect(canConnectPorts(outPort, inPort, defA, defB)).toBe(true);
  });
});

describe("canConnectPorts - port order normalization", () => {
  it("passes output port as fromPort when dragging output→input", () => {
    let receivedFromType: string | undefined;
    let receivedToType: string | undefined;

    const defA = baseNodeDef("A", [{ id: "out", type: "output", label: "out", position: "right" }]);
    defA.validateConnection = (from, to) => {
      receivedFromType = from.type;
      receivedToType = to.type;
      return true;
    };
    const defB = baseNodeDef("B", [{ id: "in", type: "input", label: "in", position: "left" }]);

    const outPort: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right" };
    const inPort: Port = { id: "in", nodeId: "b", type: "input", label: "in", position: "left" };

    canConnectPorts(outPort, inPort, defA, defB);

    expect(receivedFromType).toBe("output");
    expect(receivedToType).toBe("input");
  });

  it("passes output port as fromPort when dragging input→output (reverse)", () => {
    let receivedFromType: string | undefined;
    let receivedToType: string | undefined;

    const defA = baseNodeDef("A", [{ id: "in", type: "input", label: "in", position: "left" }]);
    defA.validateConnection = (from, to) => {
      receivedFromType = from.type;
      receivedToType = to.type;
      return true;
    };
    const defB = baseNodeDef("B", [{ id: "out", type: "output", label: "out", position: "right" }]);

    const inPort: Port = { id: "in", nodeId: "a", type: "input", label: "in", position: "left" };
    const outPort: Port = { id: "out", nodeId: "b", type: "output", label: "out", position: "right" };

    // Dragging from input to output (reverse direction)
    canConnectPorts(inPort, outPort, defA, defB);

    // validateConnection should still receive output as fromPort
    expect(receivedFromType).toBe("output");
    expect(receivedToType).toBe("input");
  });

  it("provides normalized ports in PortConnectionContext for canConnect", () => {
    let receivedFromType: string | undefined;
    let receivedToType: string | undefined;

    const defA = baseNodeDef("A", [{
      id: "in",
      type: "input",
      label: "in",
      position: "left",
      canConnect: (ctx) => {
        receivedFromType = ctx.fromPort.type;
        receivedToType = ctx.toPort.type;
        return true;
      },
    }]);
    const defB = baseNodeDef("B", [{ id: "out", type: "output", label: "out", position: "right" }]);

    const inPort: Port = { id: "in", nodeId: "a", type: "input", label: "in", position: "left" };
    const outPort: Port = { id: "out", nodeId: "b", type: "output", label: "out", position: "right" };

    // Dragging from input to output (reverse direction)
    canConnectPorts(inPort, outPort, defA, defB);

    // PortConnectionContext should have normalized ports
    expect(receivedFromType).toBe("output");
    expect(receivedToType).toBe("input");
  });

  it("correctly associates node definitions after normalization", () => {
    let receivedFromNodeId: string | undefined;
    let receivedToNodeId: string | undefined;

    const defA = baseNodeDef("InputNode", [{ id: "in", type: "input", label: "in", position: "left" }]);
    defA.validateConnection = (from, to) => {
      receivedFromNodeId = from.nodeId;
      receivedToNodeId = to.nodeId;
      return true;
    };
    const defB = baseNodeDef("OutputNode", [{ id: "out", type: "output", label: "out", position: "right" }]);

    const inPort: Port = { id: "in", nodeId: "input-node", type: "input", label: "in", position: "left" };
    const outPort: Port = { id: "out", nodeId: "output-node", type: "output", label: "out", position: "right" };

    // Dragging from input to output - definitions should be swapped correctly
    canConnectPorts(inPort, outPort, defA, defB);

    // After normalization, fromPort should be the output port
    expect(receivedFromNodeId).toBe("output-node");
    expect(receivedToNodeId).toBe("input-node");
  });
});

describe("canConnectPorts - data type compatibility", () => {
  it("allows when no data types specified", () => {
    const outPort: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right" };
    const inPort: Port = { id: "in", nodeId: "b", type: "input", label: "in", position: "left" };
    expect(canConnectPorts(outPort, inPort)).toBe(true);
  });

  it("allows matching single dataType", () => {
    const defA = baseNodeDef("A", [{ id: "out", type: "output", label: "out", position: "right", dataType: "text" }]);
    const defB = baseNodeDef("B", [{ id: "in", type: "input", label: "in", position: "left", dataType: "text" }]);

    const outPort: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right" };
    const inPort: Port = { id: "in", nodeId: "b", type: "input", label: "in", position: "left" };
    expect(canConnectPorts(outPort, inPort, defA, defB)).toBe(true);
  });

  it("rejects non-matching single dataType", () => {
    const defA = baseNodeDef("A", [{ id: "out", type: "output", label: "out", position: "right", dataType: "text" }]);
    const defB = baseNodeDef("B", [{ id: "in", type: "input", label: "in", position: "left", dataType: "number" }]);

    const outPort: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right" };
    const inPort: Port = { id: "in", nodeId: "b", type: "input", label: "in", position: "left" };
    expect(canConnectPorts(outPort, inPort, defA, defB)).toBe(false);
  });

  it("uses port dataType over definition dataType", () => {
    const defA = baseNodeDef("A", [{ id: "out", type: "output", label: "out", position: "right", dataType: "text" }]);
    const defB = baseNodeDef("B", [{ id: "in", type: "input", label: "in", position: "left", dataType: "text" }]);

    const outPort: Port = { id: "out", nodeId: "a", type: "output", label: "out", position: "right", dataType: "json" };
    const inPort: Port = { id: "in", nodeId: "b", type: "input", label: "in", position: "left", dataType: "json" };
    expect(canConnectPorts(outPort, inPort, defA, defB)).toBe(true);
  });

  it("uses port dataType when multiple definitions share same id (instances pattern)", () => {
    // Simulates a node with multiple PortDefinitions that share the same id
    // but have different dataTypes, selected via `instances` function.
    // Example: artifact-io with scope-out having typed-object, object, string, binary variants
    const defWithMultipleSameIdPorts = baseNodeDef("ArtifactIO", [
      { id: "scope-out", type: "output", label: "Scope (Typed Object)", position: "right", dataType: "typed-object", instances: () => 0 },
      { id: "scope-out", type: "output", label: "Scope (Object)", position: "right", dataType: "object", instances: () => 0 },
      { id: "scope-out", type: "output", label: "Scope (String)", position: "right", dataType: "string", instances: () => 1 }, // Active one
      { id: "scope-out", type: "output", label: "Scope (Binary)", position: "right", dataType: "binary", instances: () => 0 },
    ]);
    const defConsumer = baseNodeDef("Consumer", [
      { id: "in", type: "input", label: "in", position: "left", dataType: "string" },
    ]);

    // The derived Port has dataType: "string" from the active definition
    const derivedPort: Port = {
      id: "scope-out",
      definitionId: "scope-out",
      nodeId: "artifact",
      type: "output",
      label: "Scope (String)",
      position: "right",
      dataType: "string", // Set during port derivation from active PortDefinition
    };
    const consumerPort: Port = {
      id: "in",
      nodeId: "consumer",
      type: "input",
      label: "in",
      position: "left",
      dataType: "string",
    };

    // Should connect because Port.dataType is "string" (not "typed-object" from first matching definition)
    expect(canConnectPorts(derivedPort, consumerPort, defWithMultipleSameIdPorts, defConsumer)).toBe(true);

    // Verify incompatible type is rejected
    const binaryConsumer = baseNodeDef("BinaryConsumer", [
      { id: "in", type: "input", label: "in", position: "left", dataType: "binary" },
    ]);
    const binaryPort: Port = {
      id: "in",
      nodeId: "binary-consumer",
      type: "input",
      label: "in",
      position: "left",
      dataType: "binary",
    };
    // Should NOT connect because string !== binary
    expect(canConnectPorts(derivedPort, binaryPort, defWithMultipleSameIdPorts, binaryConsumer)).toBe(false);
  });
});

describe("canConnectPorts - maxConnections default/unlimited", () => {
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
    // When canConnect is defined, it has full control over connection validation.
    // To also enforce data type compatibility, include dataTypeCompatible in the logic.
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
          canConnect: ({ fromPort, toPort, dataTypeCompatible }) =>
            dataTypeCompatible &&
            getPlacementSegment(fromPort.placement) !== undefined &&
            getPlacementSegment(toPort?.placement) === getPlacementSegment(fromPort.placement),
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
          canConnect: ({ fromPort, toPort, dataTypeCompatible }) =>
            dataTypeCompatible &&
            getPlacementSegment(toPort?.placement) !== undefined &&
            getPlacementSegment(fromPort.placement) === getPlacementSegment(toPort?.placement),
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
          canConnect: ({ fromPort, toPort, dataTypeCompatible }) =>
            dataTypeCompatible &&
            getPlacementSegment(toPort?.placement) !== undefined &&
            getPlacementSegment(fromPort.placement) === getPlacementSegment(toPort?.placement),
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

  it("port object maxConnections takes priority over definition maxConnections", () => {
    // Definition allows unlimited connections
    const unlimitedDef = baseNodeDef("Unlimited", [
      { id: "in", type: "input", label: "in", position: "left", maxConnections: "unlimited" },
      { id: "out", type: "output", label: "out", position: "right", maxConnections: "unlimited" },
    ]);
    const reg = mkRegistry([unlimitedDef]);

    // Port object overrides with maxConnections: 1
    const inputWithLimit: Port = {
      id: "in",
      nodeId: "target",
      type: "input",
      label: "in",
      position: "left",
      maxConnections: 1,
    };
    const output: Port = { id: "out", nodeId: "source", type: "output", label: "out", position: "right" };

    const existingConnection: Record<string, Connection> = {
      c1: { id: "c1", fromNodeId: "other", fromPortId: "out", toNodeId: "target", toPortId: "in" },
    };

    // Should be blocked because port object has maxConnections: 1 (despite definition having unlimited)
    const blocked = canConnectPorts(
      output,
      inputWithLimit,
      reg.get("Unlimited"),
      reg.get("Unlimited"),
      existingConnection,
    );
    expect(blocked).toBe(false);

    // Without port-level override, definition's unlimited should allow connection
    const inputWithoutLimit: Port = {
      id: "in",
      nodeId: "target",
      type: "input",
      label: "in",
      position: "left",
    };
    const allowed = canConnectPorts(
      output,
      inputWithoutLimit,
      reg.get("Unlimited"),
      reg.get("Unlimited"),
      existingConnection,
    );
    expect(allowed).toBe(true);
  });
});
