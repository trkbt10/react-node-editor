/**
 * @file Tests for port connectability utilities
 */
import type { Port, Node, Connection } from "../../../types/core";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import {
  getConnectablePortIds,
  getConnectableNodeTypes,
  findConnectablePortDefinition,
} from "../connectivity/connectability";
import { isPortConnectable } from "../connectivity/connectableTypes";
import { createPortKey, type PortKey } from "../identity/key";

const createPort = (overrides: Partial<Port> = {}): Port => ({
  id: "port-1",
  type: "output",
  label: "Output",
  nodeId: "node-1",
  position: "right",
  ...overrides,
});

const createNode = (overrides: Partial<Node> = {}): Node => ({
  id: "node-1",
  type: "test-node",
  position: { x: 0, y: 0 },
  data: {},
  ...overrides,
});

const createNodeDefinition = (overrides: Partial<NodeDefinition> = {}): NodeDefinition => ({
  type: "test-node",
  displayName: "Test Node",
  ports: [
    { id: "input", type: "input", label: "Input", position: "left" },
    { id: "output", type: "output", label: "Output", position: "right" },
  ],
  ...overrides,
});

describe("getConnectablePortIds", () => {
  it("returns empty set when no compatible ports exist", () => {
    const fromPort = createPort({ type: "output" });
    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1" }),
    };
    const getNodePorts = () => [fromPort];
    const connections: Record<string, Connection> = {};
    const getNodeDefinition = () => createNodeDefinition();

    const result = getConnectablePortIds(fromPort, nodes, getNodePorts, connections, getNodeDefinition);

    expect(result.size).toBe(0);
  });

  it("finds input ports on other nodes for an output port", () => {
    const fromPort = createPort({ id: "out", type: "output", nodeId: "node-1" });
    const targetPort = createPort({ id: "in", type: "input", nodeId: "node-2", position: "left" });

    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1", type: "source" }),
      "node-2": createNode({ id: "node-2", type: "target" }),
    };

    const getNodePorts = (nodeId: string) => {
      if (nodeId === "node-1") {
        return [fromPort];
      }
      if (nodeId === "node-2") {
        return [targetPort];
      }
      return [];
    };

    const connections: Record<string, Connection> = {};
    const getNodeDefinition = () => createNodeDefinition();

    const result = getConnectablePortIds(fromPort, nodes, getNodePorts, connections, getNodeDefinition);

    expect(result.has(createPortKey("node-2", "in"))).toBe(true);
  });

  it("excludes ports on the same node", () => {
    const outputPort = createPort({ id: "out", type: "output", nodeId: "node-1" });
    const inputPort = createPort({ id: "in", type: "input", nodeId: "node-1", position: "left" });

    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1" }),
    };

    const getNodePorts = () => [outputPort, inputPort];
    const connections: Record<string, Connection> = {};
    const getNodeDefinition = () => createNodeDefinition();

    const result = getConnectablePortIds(outputPort, nodes, getNodePorts, connections, getNodeDefinition);

    expect(result.has(createPortKey("node-1", "in"))).toBe(false);
  });
});

describe("isPortConnectable", () => {
  it("returns false when connectablePorts is undefined", () => {
    const port = createPort();
    expect(isPortConnectable(port, undefined)).toBe(false);
  });

  it("returns false when port is not in connectable set", () => {
    const port = createPort({ id: "port-1", nodeId: "node-1" });
    const connectablePorts = { ids: new Set<PortKey>() };

    expect(isPortConnectable(port, connectablePorts)).toBe(false);
  });

  it("returns true when port is in connectable set", () => {
    const port = createPort({ id: "port-1", nodeId: "node-1" });
    const connectablePorts = { ids: new Set<PortKey>([createPortKey("node-1", "port-1")]) };

    expect(isPortConnectable(port, connectablePorts)).toBe(true);
  });
});

describe("getConnectableNodeTypes", () => {
  const createDefinitionWithPorts = (
    type: string,
    ports: NodeDefinition["ports"],
  ): NodeDefinition => ({
    type,
    displayName: type,
    ports,
  });

  it("returns node types that have compatible ports", () => {
    const fromPort = createPort({ id: "out", type: "output", nodeId: "node-1", dataType: "text" });

    const sourceDefinition = createDefinitionWithPorts("source", [
      { id: "output", type: "output", label: "Output", position: "right", dataType: "text" },
    ]);

    const targetDefinition = createDefinitionWithPorts("target", [
      { id: "input", type: "input", label: "Input", position: "left", dataType: "text" },
    ]);

    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1", type: "source" }),
    };

    const connections: Record<string, Connection> = {};

    const allDefinitions = [sourceDefinition, targetDefinition];
    const getNodeDefinition = (type: string) => allDefinitions.find((d) => d.type === type);
    const getAllNodeDefinitions = () => allDefinitions;

    const result = getConnectableNodeTypes({
      fromPort,
      nodes,
      connections,
      getNodeDefinition,
      getAllNodeDefinitions,
    });

    expect(result).toContain("target");
    expect(result).not.toContain("source");
  });

  it("excludes node types with only same-type ports", () => {
    const fromPort = createPort({ id: "out", type: "output", nodeId: "node-1" });

    const outputOnlyDef = createDefinitionWithPorts("output-only", [
      { id: "output", type: "output", label: "Output", position: "right" },
    ]);

    const inputOnlyDef = createDefinitionWithPorts("input-only", [
      { id: "input", type: "input", label: "Input", position: "left" },
    ]);

    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1", type: "output-only" }),
    };

    const connections: Record<string, Connection> = {};

    const allDefinitions = [outputOnlyDef, inputOnlyDef];
    const getNodeDefinition = (type: string) => allDefinitions.find((d) => d.type === type);
    const getAllNodeDefinitions = () => allDefinitions;

    const result = getConnectableNodeTypes({
      fromPort,
      nodes,
      connections,
      getNodeDefinition,
      getAllNodeDefinitions,
    });

    expect(result).toContain("input-only");
    expect(result).not.toContain("output-only");
  });

  it("respects dataType compatibility", () => {
    const fromPort = createPort({ id: "out", type: "output", nodeId: "node-1", dataType: "text" });

    const sourceDef = createDefinitionWithPorts("source", [
      { id: "output", type: "output", label: "Output", position: "right", dataType: "text" },
    ]);

    const compatibleDef = createDefinitionWithPorts("compatible", [
      { id: "input", type: "input", label: "Input", position: "left", dataType: "text" },
    ]);

    const incompatibleDef = createDefinitionWithPorts("incompatible", [
      { id: "input", type: "input", label: "Input", position: "left", dataType: "image" },
    ]);

    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1", type: "source" }),
    };

    const connections: Record<string, Connection> = {};

    const allDefinitions = [sourceDef, compatibleDef, incompatibleDef];
    const getNodeDefinition = (type: string) => allDefinitions.find((d) => d.type === type);
    const getAllNodeDefinitions = () => allDefinitions;

    const result = getConnectableNodeTypes({
      fromPort,
      nodes,
      connections,
      getNodeDefinition,
      getAllNodeDefinitions,
    });

    expect(result).toContain("compatible");
    expect(result).not.toContain("incompatible");
  });

  it("handles input port as source", () => {
    const fromPort = createPort({ id: "in", type: "input", nodeId: "node-1", position: "left" });

    const sourceDef = createDefinitionWithPorts("source", [
      { id: "input", type: "input", label: "Input", position: "left" },
    ]);

    const targetDef = createDefinitionWithPorts("target", [
      { id: "output", type: "output", label: "Output", position: "right" },
    ]);

    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1", type: "source" }),
    };

    const connections: Record<string, Connection> = {};

    const allDefinitions = [sourceDef, targetDef];
    const getNodeDefinition = (type: string) => allDefinitions.find((d) => d.type === type);
    const getAllNodeDefinitions = () => allDefinitions;

    const result = getConnectableNodeTypes({
      fromPort,
      nodes,
      connections,
      getNodeDefinition,
      getAllNodeDefinitions,
    });

    expect(result).toContain("target");
    expect(result).not.toContain("source");
  });

  it("returns empty array when no compatible node types exist", () => {
    const fromPort = createPort({ id: "out", type: "output", nodeId: "node-1", dataType: "special" });

    const onlyOutputDef = createDefinitionWithPorts("only-output", [
      { id: "output", type: "output", label: "Output", position: "right" },
    ]);

    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1", type: "only-output" }),
    };

    const connections: Record<string, Connection> = {};

    const allDefinitions = [onlyOutputDef];
    const getNodeDefinition = (type: string) => allDefinitions.find((d) => d.type === type);
    const getAllNodeDefinitions = () => allDefinitions;

    const result = getConnectableNodeTypes({
      fromPort,
      nodes,
      connections,
      getNodeDefinition,
      getAllNodeDefinitions,
    });

    expect(result).toEqual([]);
  });
});

describe("child to parent group scope-in connection with canConnect", () => {
  it("allows child node output to connect to parent group scope-in port when canConnect returns true", () => {
    // Parent group node definition with scope-in port that uses canConnect
    const parentDefinition: NodeDefinition = {
      type: "artifact-io",
      displayName: "Artifact IO",
      behaviors: ["node", { type: "group", autoGroup: true }],
      ports: [
        { id: "in", type: "input", label: "data", position: "left", dataType: "any" },
        { id: "out", type: "output", label: "data", position: "right", dataType: "any" },
        { id: "scope-out", type: "output", label: "→child", position: "top", dataType: "any" },
        // scope-in uses canConnect to accept any type
        { id: "scope-in", type: "input", label: "←result", position: "bottom", canConnect: () => true },
      ],
    };

    // Child node definition
    const childDefinition: NodeDefinition = {
      type: "text-template",
      displayName: "Text Template",
      ports: [
        { id: "input", type: "input", label: "Input", position: "left", dataType: "any" },
        { id: "out", type: "output", label: "Output", position: "right", dataType: "string" },
      ],
    };

    // Parent group node
    const parentNode: Node = {
      id: "parent-group",
      type: "artifact-io",
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      data: {},
    };

    // Child node inside the parent group
    const childNode: Node = {
      id: "child-node",
      type: "text-template",
      position: { x: 50, y: 50 },
      data: {},
      parentId: "parent-group",
    };

    const nodes: Record<string, Node> = {
      "parent-group": parentNode,
      "child-node": childNode,
    };

    // Ports for child node
    const childOutputPort: Port = {
      id: "out",
      type: "output",
      label: "Output",
      nodeId: "child-node",
      position: "right",
      dataType: "string",
    };

    // Ports for parent node
    const parentScopeInPort: Port = {
      id: "scope-in",
      type: "input",
      label: "←result",
      nodeId: "parent-group",
      position: "bottom",
    };

    const getNodePorts = (nodeId: string): Port[] => {
      if (nodeId === "child-node") {
        return [
          { id: "input", type: "input", label: "Input", nodeId: "child-node", position: "left", dataType: "any" },
          childOutputPort,
        ];
      }
      if (nodeId === "parent-group") {
        return [
          { id: "in", type: "input", label: "data", nodeId: "parent-group", position: "left", dataType: "any" },
          { id: "out", type: "output", label: "data", nodeId: "parent-group", position: "right", dataType: "any" },
          { id: "scope-out", type: "output", label: "→child", nodeId: "parent-group", position: "top", dataType: "any" },
          parentScopeInPort,
        ];
      }
      return [];
    };

    const getNodeDefinition = (type: string) => {
      if (type === "artifact-io") {return parentDefinition;}
      if (type === "text-template") {return childDefinition;}
      return undefined;
    };

    const connections: Record<string, Connection> = {};

    // When dragging from child's output port
    const result = getConnectablePortIds(
      childOutputPort,
      nodes,
      getNodePorts,
      connections,
      getNodeDefinition,
    );

    // Should include the parent's scope-in port as a valid connection candidate
    const parentScopeInKey = createPortKey("parent-group", "scope-in");
    expect(result.has(parentScopeInKey)).toBe(true);
  });

  it("allows connection when port has no dataType specified (untyped port)", () => {
    // Port without dataType should accept any connection
    const childOutputPort: Port = {
      id: "out",
      type: "output",
      label: "Output",
      nodeId: "child-node",
      position: "right",
      dataType: "string",
    };

    const parentScopeInPort: Port = {
      id: "scope-in",
      type: "input",
      label: "←result",
      nodeId: "parent-group",
      position: "bottom",
      // No dataType - should be compatible with any type
    };

    const nodes: Record<string, Node> = {
      "child-node": {
        id: "child-node",
        type: "text-template",
        position: { x: 50, y: 50 },
        data: {},
        parentId: "parent-group",
      },
      "parent-group": {
        id: "parent-group",
        type: "artifact-io",
        position: { x: 0, y: 0 },
        data: {},
      },
    };

    const getNodePorts = (nodeId: string): Port[] => {
      if (nodeId === "child-node") {return [childOutputPort];}
      if (nodeId === "parent-group") {return [parentScopeInPort];}
      return [];
    };

    const getNodeDefinition = () => createNodeDefinition();
    const connections: Record<string, Connection> = {};

    const result = getConnectablePortIds(
      childOutputPort,
      nodes,
      getNodePorts,
      connections,
      getNodeDefinition,
    );

    expect(result.has(createPortKey("parent-group", "scope-in"))).toBe(true);
  });

  it("rejects connection when dataTypes do not match and no canConnect is defined", () => {
    const childOutputPort: Port = {
      id: "out",
      type: "output",
      label: "Output",
      nodeId: "child-node",
      position: "right",
      dataType: "string",
    };

    const parentScopeInPort: Port = {
      id: "scope-in",
      type: "input",
      label: "←result",
      nodeId: "parent-group",
      position: "bottom",
      dataType: "number", // Different type, should not match "string"
    };

    const nodes: Record<string, Node> = {
      "child-node": {
        id: "child-node",
        type: "text-template",
        position: { x: 50, y: 50 },
        data: {},
      },
      "parent-group": {
        id: "parent-group",
        type: "other-node",
        position: { x: 0, y: 0 },
        data: {},
      },
    };

    const getNodePorts = (nodeId: string): Port[] => {
      if (nodeId === "child-node") {return [childOutputPort];}
      if (nodeId === "parent-group") {return [parentScopeInPort];}
      return [];
    };

    const getNodeDefinition = () => createNodeDefinition();
    const connections: Record<string, Connection> = {};

    const result = getConnectablePortIds(
      childOutputPort,
      nodes,
      getNodePorts,
      connections,
      getNodeDefinition,
    );

    // Should NOT include the port because dataTypes don't match
    expect(result.has(createPortKey("parent-group", "scope-in"))).toBe(false);
  });
});

describe("findConnectablePortDefinition", () => {
  const createDefinitionWithPorts = (
    type: string,
    ports: NodeDefinition["ports"],
  ): NodeDefinition => ({
    type,
    displayName: type,
    ports,
  });

  it("finds first compatible port", () => {
    const fromPort = createPort({ id: "out", type: "output", nodeId: "node-1", dataType: "text" });

    const targetDef = createDefinitionWithPorts("target", [
      { id: "input", type: "input", label: "Input", position: "left", dataType: "text" },
    ]);

    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1", type: "source" }),
    };

    const connections: Record<string, Connection> = {};

    const result = findConnectablePortDefinition({
      fromPort,
      fromNodeDefinition: undefined,
      targetNodeDefinition: targetDef,
      targetNodeId: "new-node",
      connections,
      nodes,
    });

    expect(result).not.toBeNull();
    expect(result?.port.id).toBe("input");
    expect(result?.port.nodeId).toBe("new-node");
    expect(result?.port.dataType).toBe("text");
  });

  it("returns null when no compatible port exists", () => {
    const fromPort = createPort({ id: "out", type: "output", nodeId: "node-1", dataType: "text" });

    const targetDef = createDefinitionWithPorts("target", [
      { id: "output", type: "output", label: "Output", position: "right" },
    ]);

    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1", type: "source" }),
    };

    const connections: Record<string, Connection> = {};

    const result = findConnectablePortDefinition({
      fromPort,
      fromNodeDefinition: undefined,
      targetNodeDefinition: targetDef,
      targetNodeId: "new-node",
      connections,
      nodes,
    });

    expect(result).toBeNull();
  });

  it("respects dataType compatibility", () => {
    const fromPort = createPort({ id: "out", type: "output", nodeId: "node-1", dataType: "image" });

    const targetDef = createDefinitionWithPorts("target", [
      { id: "text-input", type: "input", label: "Text Input", position: "left", dataType: "text" },
      { id: "image-input", type: "input", label: "Image Input", position: "left", dataType: "image" },
    ]);

    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1", type: "source" }),
    };

    const connections: Record<string, Connection> = {};

    const result = findConnectablePortDefinition({
      fromPort,
      fromNodeDefinition: undefined,
      targetNodeDefinition: targetDef,
      targetNodeId: "new-node",
      connections,
      nodes,
    });

    expect(result).not.toBeNull();
    expect(result?.port.id).toBe("image-input");
    expect(result?.port.dataType).toBe("image");
  });

  it("returns port with properly merged dataTypes", () => {
    const fromPort = createPort({ id: "out", type: "output", nodeId: "node-1" });

    const targetDef = createDefinitionWithPorts("target", [
      { id: "multi-input", type: "input", label: "Multi Input", position: "left", dataType: "text", dataTypes: ["html", "markdown"] },
    ]);

    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1", type: "source" }),
    };

    const connections: Record<string, Connection> = {};

    const result = findConnectablePortDefinition({
      fromPort,
      fromNodeDefinition: undefined,
      targetNodeDefinition: targetDef,
      targetNodeId: "new-node",
      connections,
      nodes,
    });

    expect(result).not.toBeNull();
    expect(result?.port.dataType).toEqual(["text", "html", "markdown"]);
  });

  it("handles input port as source", () => {
    const fromPort = createPort({ id: "in", type: "input", nodeId: "node-1", position: "left" });

    const targetDef = createDefinitionWithPorts("target", [
      { id: "output", type: "output", label: "Output", position: "right" },
    ]);

    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1", type: "source" }),
    };

    const connections: Record<string, Connection> = {};

    const result = findConnectablePortDefinition({
      fromPort,
      fromNodeDefinition: undefined,
      targetNodeDefinition: targetDef,
      targetNodeId: "new-node",
      connections,
      nodes,
    });

    expect(result).not.toBeNull();
    expect(result?.port.id).toBe("output");
    expect(result?.port.type).toBe("output");
  });

  it("supports dynamic ports via instances function", () => {
    const fromPort = createPort({ id: "out", type: "output", nodeId: "node-1", dataType: "text" });

    const targetDef: NodeDefinition = {
      type: "dynamic-target",
      displayName: "Dynamic Target",
      defaultData: { inputCount: 3 },
      ports: [
        {
          id: "dynamic-input",
          type: "input",
          label: "Dynamic Input",
          position: "left",
          dataType: "text",
          instances: ({ node }) => (node.data as { inputCount?: number }).inputCount ?? 1,
        },
      ],
    };

    const nodes: Record<string, Node> = {
      "node-1": createNode({ id: "node-1", type: "source" }),
    };

    const connections: Record<string, Connection> = {};

    const result = findConnectablePortDefinition({
      fromPort,
      fromNodeDefinition: undefined,
      targetNodeDefinition: targetDef,
      targetNodeId: "new-node",
      connections,
      nodes,
    });

    expect(result).not.toBeNull();
    // Dynamic port should be derived with index suffix
    expect(result?.port.id).toBe("dynamic-input-1");
    expect(result?.port.nodeId).toBe("new-node");
    expect(result?.port.dataType).toBe("text");
  });
});
