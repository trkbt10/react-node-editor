/**
 * @file Three.js node definition connection compatibility tests.
 */
import type { Connection, Node } from "../../../types/core";
import { createNodeDefinitionRegistry } from "../../../types/NodeDefinitionRegistry";
import { getNodePorts } from "./portResolution";
import { computeConnectablePortIds } from "./connectablePortPlanner";
import { planConnectionChange, ConnectionSwitchBehavior } from "./connectionSwitchBehavior";
import { createThreeJsNodeDefinitions } from "../../../examples/demos/threejs/createThreeJsNodeDefinitions";
import { canConnectPorts } from "./connectionValidation";

const registerThreeJsDefinitions = () => {
  const registry = createNodeDefinitionRegistry();
  const definitions = createThreeJsNodeDefinitions();
  definitions.forEach((definition) => registry.register(definition));
  return registry;
};

const createThreeJsNodes = (): Record<string, Node> => ({
  "color-node": {
    id: "color-node",
    type: "color-control",
    position: { x: 120, y: 180 },
    size: { width: 220, height: 180 },
    data: { title: "Color", color: "#60a5fa" },
  },
  "scale-node": {
    id: "scale-node",
    type: "scale-control",
    position: { x: 120, y: 420 },
    size: { width: 220, height: 180 },
    data: { title: "Scale", value: 1 },
  },
  "three-node": {
    id: "three-node",
    type: "three-preview",
    position: { x: 440, y: 260 },
    size: { width: 360, height: 380 },
    data: { title: "Three Preview", background: "space" },
  },
});

describe("connectablePortPlanner - threejs definitions", () => {
  it("only exposes data-compatible ports", () => {
    const registry = registerThreeJsDefinitions();
    const nodes = createThreeJsNodes();
    const connections: Record<string, Connection> = {};

    const getDefinition = (type: string) => registry.get(type);
    const getPorts = (nodeId: string) => {
      const node = nodes[nodeId];
      if (!node) {
        return [];
      }
      const definition = getDefinition(node.type);
      if (!definition) {
        return [];
      }
      return getNodePorts(node, definition);
    };

    const colorOutput = getPorts("color-node").find((port) => port.id === "color");
    expect(colorOutput).toBeDefined();
    if (!colorOutput) {
      throw new Error("expected color output port");
    }

    const connectable = computeConnectablePortIds({
      fallbackPort: colorOutput,
      nodes,
      connections,
      getNodePorts: getPorts,
      getNodeDefinition: getDefinition,
    });

    const connectableIds = Array.from(connectable.ids);
    const threeInputs = getPorts("three-node");
    const colorInput = threeInputs.find((port) => port.id === "color");
    expect(colorInput).toBeDefined();
    if (!colorInput) {
      throw new Error("expected color input port");
    }
    expect(colorOutput.type).toBe("output");
    expect(colorInput.type).toBe("input");
    expect(colorOutput.nodeId).toBe("color-node");
    expect(colorInput.nodeId).toBe("three-node");

    const colorDefinition = getDefinition("color-control");
    const previewDefinition = getDefinition("three-preview");
    expect(colorDefinition?.ports?.map((port) => port.id)).toContain("color");
    expect(previewDefinition?.ports?.map((port) => port.id)).toContain("color");
    const fromPortDef = colorDefinition?.ports?.find((port) => port.id === colorOutput.id);
    const toPortDef = previewDefinition?.ports?.find((port) => port.id === colorInput.id);
    expect(fromPortDef?.dataType).toBe("color");
    expect(toPortDef?.dataType).toBe("color");

    expect(canConnectPorts(colorOutput, colorInput, colorDefinition, previewDefinition, connections)).toBe(true);

    expect(connectableIds).toContain("three-node:color");
    expect(connectableIds).not.toContain("three-node:scale");

    const plan = planConnectionChange({
      fromPort: colorOutput,
      toPort: colorInput,
      nodes,
      connections,
      getNodeDefinition: getDefinition,
    });

    expect(plan.behavior).toBe(ConnectionSwitchBehavior.Append);
    expect(plan.connection).not.toBeNull();
    expect(plan.connection?.fromPortId).toBe("color");
    expect(plan.connection?.toPortId).toBe("color");
  });
});

// Reference note: Reviewed createThreeJsNodeDefinitions.tsx to align expectations for dataType compatibility.
