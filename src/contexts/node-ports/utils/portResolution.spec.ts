/**
 * @file Unit tests for port resolution with default port inference
 */
import type { Node } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import { inferDefaultPortDefinitions, getNodePorts } from "./portResolution";

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
});
