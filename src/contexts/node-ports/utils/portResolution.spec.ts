/**
 * @file Unit tests for port resolution with default port inference
 */
import type { Node } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import { inferDefaultPortDefinitions, getNodePorts, normalizePlacement } from "./portResolution";

describe("normalizePlacement", () => {
  it("should return default placement when position is undefined", () => {
    const result = normalizePlacement(undefined);
    expect(result).toEqual({ side: "right" });
  });

  it("should convert string position to PortPlacement", () => {
    expect(normalizePlacement("left")).toEqual({ side: "left" });
    expect(normalizePlacement("right")).toEqual({ side: "right" });
    expect(normalizePlacement("top")).toEqual({ side: "top" });
    expect(normalizePlacement("bottom")).toEqual({ side: "bottom" });
  });

  it("should preserve PortPlacement object properties", () => {
    const placement = {
      side: "right" as const,
      segment: "main",
      segmentOrder: 1,
      segmentSpan: 2,
      align: "center" as const,
    };
    const result = normalizePlacement(placement);
    expect(result).toEqual({
      side: "right",
      segment: "main",
      segmentOrder: 1,
      segmentSpan: 2,
      align: "center",
    });
  });

  it("should handle partial PortPlacement object", () => {
    const placement = { side: "left" as const, segment: "secondary" };
    const result = normalizePlacement(placement);
    expect(result).toEqual({
      side: "left",
      segment: "secondary",
      segmentOrder: undefined,
      segmentSpan: undefined,
      align: undefined,
    });
  });
});

describe("inferDefaultPortDefinitions", () => {
  it("should create default input (left) and output (right) ports when node has no _ports", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      data: {},
    };

    const ports = inferDefaultPortDefinitions(node);

    expect(ports).toHaveLength(2);
    expect(ports[0]).toEqual({
      id: "input",
      type: "input",
      label: "Input",
      position: "left",
    });
    expect(ports[1]).toEqual({
      id: "output",
      type: "output",
      label: "Output",
      position: "right",
    });
  });

  it("should use legacy _ports when available", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      data: {},
      _ports: [
        {
          id: "custom-input",
          type: "input",
          label: "Custom Input",
          nodeId: "node-1",
          position: "top",
          dataType: "string",
        },
        {
          id: "custom-output",
          type: "output",
          label: "Custom Output",
          nodeId: "node-1",
          position: "bottom",
          maxConnections: "unlimited",
        },
      ],
    };

    const ports = inferDefaultPortDefinitions(node);

    expect(ports).toHaveLength(2);
    expect(ports[0]).toEqual({
      id: "custom-input",
      type: "input",
      label: "Custom Input",
      position: "top",
      dataType: "string",
      maxConnections: undefined,
    });
    expect(ports[1]).toEqual({
      id: "custom-output",
      type: "output",
      label: "Custom Output",
      position: "bottom",
      dataType: undefined,
      maxConnections: "unlimited",
    });
  });

  it("should return empty array when node has empty _ports array", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      data: {},
      _ports: [],
    };

    const ports = inferDefaultPortDefinitions(node);

    expect(ports).toHaveLength(0);
  });
});

describe("getNodePorts", () => {
  it("should use ports from definition when available", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      data: {},
    };

    const definition: NodeDefinition = {
      type: "test",
      displayName: "Test Node",
      ports: [
        {
          id: "in1",
          type: "input",
          label: "Input 1",
          position: "left",
        },
        {
          id: "out1",
          type: "output",
          label: "Output 1",
          position: "right",
        },
      ],
    };

    const ports = getNodePorts(node, definition);

    expect(ports).toHaveLength(2);
    expect(ports[0].id).toBe("in1");
    expect(ports[0].nodeId).toBe("node-1");
    expect(ports[1].id).toBe("out1");
    expect(ports[1].nodeId).toBe("node-1");
  });

  it("should infer default ports when definition has no ports", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      data: {},
    };

    const definition: NodeDefinition = {
      type: "test",
      displayName: "Test Node",
    };

    const ports = getNodePorts(node, definition);

    expect(ports).toHaveLength(2);
    expect(ports[0]).toMatchObject({
      id: "input",
      type: "input",
      label: "Input",
      position: "left",
      nodeId: "node-1",
    });
    expect(ports[1]).toMatchObject({
      id: "output",
      type: "output",
      label: "Output",
      position: "right",
      nodeId: "node-1",
    });
  });

  it("should use legacy _ports for inference when definition has no ports", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      data: {},
      _ports: [
        {
          id: "legacy-port",
          type: "input",
          label: "Legacy Port",
          nodeId: "node-1",
          position: "top",
        },
      ],
    };

    const definition: NodeDefinition = {
      type: "test",
      displayName: "Test Node",
    };

    const ports = getNodePorts(node, definition);

    expect(ports).toHaveLength(1);
    expect(ports[0]).toMatchObject({
      id: "legacy-port",
      type: "input",
      label: "Legacy Port",
      position: "top",
      nodeId: "node-1",
    });
  });

  it("should apply port overrides", () => {
    const node: Node & { portOverrides?: unknown } = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      data: {},
      portOverrides: [
        {
          portId: "input",
          maxConnections: 5,
          allowedNodeTypes: ["type-a", "type-b"],
        },
      ],
    };

    const definition: NodeDefinition = {
      type: "test",
      displayName: "Test Node",
    };

    const ports = getNodePorts(node, definition);

    expect(ports).toHaveLength(2);
    expect(ports[0].maxConnections).toBe(5);
    expect(ports[0].allowedNodeTypes).toEqual(["type-a", "type-b"]);
    expect(ports[1].maxConnections).toBeUndefined();
  });

  it("should filter out disabled ports", () => {
    const node: Node & { portOverrides?: unknown } = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      data: {},
      portOverrides: [
        {
          portId: "output",
          disabled: true,
        },
      ],
    };

    const definition: NodeDefinition = {
      type: "test",
      displayName: "Test Node",
    };

    const ports = getNodePorts(node, definition);

    expect(ports).toHaveLength(1);
    expect(ports[0].id).toBe("input");
  });

  it("should expand multiple instances from a single definition", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      data: {},
    };

    const definition: NodeDefinition = {
      type: "test",
      displayName: "Test Node",
      ports: [
        { id: "input", type: "input", label: "Input", position: "left", instances: 2 },
        { id: "output", type: "output", label: "Output", position: "right" },
      ],
    };

    const ports = getNodePorts(node, definition);

    expect(ports).toHaveLength(3);
    expect(ports.map((port) => port.id)).toEqual(["input-1", "input-2", "output"]);
    expect(ports.filter((port) => port.definitionId === "input")).toHaveLength(2);
    expect(ports[0].instanceIndex).toBe(0);
    expect(ports[0].instanceTotal).toBe(2);
  });

  it("should derive instance count and placement from definition metadata", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      data: { count: 3 },
    };

    const definition: NodeDefinition = {
      type: "test",
      displayName: "Test Node",
      ports: [
        {
          id: "option",
          type: "output",
          label: "Option",
          position: { side: "right", segment: "secondary", segmentOrder: 1, segmentSpan: 2 },
          instances: ({ node: contextNode }) => Number(contextNode.data.count ?? 0),
          createPortId: ({ index }) => `option-${index + 1}`,
          createPortLabel: ({ index }) => `Option ${index + 1}`,
        },
      ],
    };

    const ports = getNodePorts(node, definition);

    expect(ports).toHaveLength(3);
    expect(ports.map((port) => port.id)).toEqual(["option-1", "option-2", "option-3"]);
    expect(ports[0].label).toBe("Option 1");
    expect(ports[0].placement?.segment).toBe("secondary");
    expect(ports[0].placement?.segmentSpan).toBe(2);
    expect(ports[0].position).toBe("right");
  });

  it("should honor overrides that target a definition id for generated ports", () => {
    const node: Node & { portOverrides?: unknown } = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      data: {},
      portOverrides: [{ portId: "input", disabled: true }],
    };

    const definition: NodeDefinition = {
      type: "test",
      displayName: "Test Node",
      ports: [{ id: "input", type: "input", label: "Input", position: "left", instances: 2 }],
    };

    const ports = getNodePorts(node, definition);

    expect(ports).toHaveLength(0);
  });
});
