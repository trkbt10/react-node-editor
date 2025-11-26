/**
 * @file Unit tests for port definition resolution utilities
 */
import { getPortDefinition, createPortDefinitionResolver } from "./definition";
import type { Port } from "../../types/core";
import type { NodeDefinition, PortDefinition } from "../../types/NodeDefinition";

const createPort = (overrides: Partial<Port> = {}): Port => ({
  id: "test-port",
  nodeId: "test-node",
  type: "input",
  label: "Test",
  position: "left",
  ...overrides,
});

const createPortDefinition = (overrides: Partial<PortDefinition> = {}): PortDefinition => ({
  id: "test-port",
  type: "input",
  label: "Test",
  position: "left",
  ...overrides,
});

const createNodeDefinition = (ports: PortDefinition[]): NodeDefinition => ({
  type: "test-node",
  displayName: "Test Node",
  ports,
});

describe("getPortDefinition", () => {
  describe("returns undefined", () => {
    it("when nodeDefinition is undefined", () => {
      const port = createPort();
      expect(getPortDefinition(port, undefined)).toBeUndefined();
    });

    it("when nodeDefinition has no ports", () => {
      const port = createPort();
      const nodeDef: NodeDefinition = { type: "test", displayName: "Test" };
      expect(getPortDefinition(port, nodeDef)).toBeUndefined();
    });

    it("when nodeDefinition.ports is empty", () => {
      const port = createPort();
      const nodeDef = createNodeDefinition([]);
      expect(getPortDefinition(port, nodeDef)).toBeUndefined();
    });

    it("when no matching port definition found", () => {
      const port = createPort({ id: "unknown-port" });
      const nodeDef = createNodeDefinition([createPortDefinition({ id: "other-port" })]);
      expect(getPortDefinition(port, nodeDef)).toBeUndefined();
    });
  });

  describe("resolution by definitionId", () => {
    it("resolves by definitionId when present", () => {
      const portDef = createPortDefinition({ id: "base-input" });
      const port = createPort({ id: "base-input-1", definitionId: "base-input" });
      const nodeDef = createNodeDefinition([portDef]);

      expect(getPortDefinition(port, nodeDef)).toBe(portDef);
    });

    it("prioritizes definitionId over port.id", () => {
      const targetDef = createPortDefinition({ id: "target" });
      const otherDef = createPortDefinition({ id: "other" });
      const port = createPort({ id: "other", definitionId: "target" });
      const nodeDef = createNodeDefinition([targetDef, otherDef]);

      expect(getPortDefinition(port, nodeDef)).toBe(targetDef);
    });
  });

  describe("resolution by port.id", () => {
    it("resolves by exact port.id match", () => {
      const portDef = createPortDefinition({ id: "exact-match" });
      const port = createPort({ id: "exact-match" });
      const nodeDef = createNodeDefinition([portDef]);

      expect(getPortDefinition(port, nodeDef)).toBe(portDef);
    });
  });

  describe("resolution by numeric suffix stripping", () => {
    it("resolves by stripping numeric suffix (input-1 → input)", () => {
      const portDef = createPortDefinition({ id: "input" });
      const port = createPort({ id: "input-1" });
      const nodeDef = createNodeDefinition([portDef]);

      expect(getPortDefinition(port, nodeDef)).toBe(portDef);
    });

    it("resolves by stripping multi-digit suffix (input-123 → input)", () => {
      const portDef = createPortDefinition({ id: "input" });
      const port = createPort({ id: "input-123" });
      const nodeDef = createNodeDefinition([portDef]);

      expect(getPortDefinition(port, nodeDef)).toBe(portDef);
    });

    it("does not strip non-numeric suffix", () => {
      const portDef = createPortDefinition({ id: "input" });
      const port = createPort({ id: "input-abc" });
      const nodeDef = createNodeDefinition([portDef]);

      expect(getPortDefinition(port, nodeDef)).toBeUndefined();
    });

    it("prioritizes exact match over suffix stripping", () => {
      const exactDef = createPortDefinition({ id: "input-1" });
      const baseDef = createPortDefinition({ id: "input" });
      const port = createPort({ id: "input-1" });
      const nodeDef = createNodeDefinition([exactDef, baseDef]);

      expect(getPortDefinition(port, nodeDef)).toBe(exactDef);
    });
  });
});

describe("createPortDefinitionResolver", () => {
  it("creates a resolver that combines registry lookup and port resolution", () => {
    const portDef = createPortDefinition({ id: "output" });
    const nodeDef = createNodeDefinition([portDef]);
    const registry = new Map<string, NodeDefinition>([["test-node", nodeDef]]);

    const resolver = createPortDefinitionResolver((nodeType) => registry.get(nodeType));
    const port = createPort({ id: "output" });

    expect(resolver(port, "test-node")).toBe(portDef);
  });

  it("returns undefined for unknown node type", () => {
    const resolver = createPortDefinitionResolver(() => undefined);
    const port = createPort();

    expect(resolver(port, "unknown")).toBeUndefined();
  });

  it("returns undefined when port not found in definition", () => {
    const nodeDef = createNodeDefinition([createPortDefinition({ id: "other" })]);
    const registry = new Map<string, NodeDefinition>([["test-node", nodeDef]]);

    const resolver = createPortDefinitionResolver((nodeType) => registry.get(nodeType));
    const port = createPort({ id: "unknown-port" });

    expect(resolver(port, "test-node")).toBeUndefined();
  });
});
