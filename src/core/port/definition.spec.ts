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

  describe("resolution with multiple dynamic port definitions", () => {
    it("resolves correct definition using definitionId for multiple port groups", () => {
      const mainOutputDef = createPortDefinition({ id: "main-output", dataType: "text" });
      const optionalOutputDef = createPortDefinition({ id: "optional-output", dataType: "image" });
      const nodeDef = createNodeDefinition([mainOutputDef, optionalOutputDef]);

      const mainPort1 = createPort({ id: "main-output-1", definitionId: "main-output" });
      const mainPort2 = createPort({ id: "main-output-2", definitionId: "main-output" });
      const optPort1 = createPort({ id: "optional-output-1", definitionId: "optional-output" });
      const optPort2 = createPort({ id: "optional-output-2", definitionId: "optional-output" });

      expect(getPortDefinition(mainPort1, nodeDef)).toBe(mainOutputDef);
      expect(getPortDefinition(mainPort2, nodeDef)).toBe(mainOutputDef);
      expect(getPortDefinition(optPort1, nodeDef)).toBe(optionalOutputDef);
      expect(getPortDefinition(optPort2, nodeDef)).toBe(optionalOutputDef);
    });

    it("falls back to suffix stripping when definitionId is missing", () => {
      const mainOutputDef = createPortDefinition({ id: "main-output", dataType: "text" });
      const optionalOutputDef = createPortDefinition({ id: "optional-output", dataType: "image" });
      const nodeDef = createNodeDefinition([mainOutputDef, optionalOutputDef]);

      const mainPort = createPort({ id: "main-output-1" });
      const optPort = createPort({ id: "optional-output-1" });

      expect(getPortDefinition(mainPort, nodeDef)).toBe(mainOutputDef);
      expect(getPortDefinition(optPort, nodeDef)).toBe(optionalOutputDef);
    });

    it("definitionId takes priority over numeric suffix pattern", () => {
      const mainOutputDef = createPortDefinition({ id: "main-output", dataType: "text" });
      const optionalOutputDef = createPortDefinition({ id: "optional-output", dataType: "image" });
      const nodeDef = createNodeDefinition([mainOutputDef, optionalOutputDef]);

      // Port ID looks like it belongs to main-output, but definitionId says optional-output
      const port = createPort({ id: "main-output-1", definitionId: "optional-output" });

      expect(getPortDefinition(port, nodeDef)).toBe(optionalOutputDef);
    });

    it("resolves definitions with dataType correctly", () => {
      const mainDef = createPortDefinition({ id: "main-input", dataType: ["text", "html"] });
      const auxDef = createPortDefinition({ id: "aux-input", dataType: ["image", "audio"] });
      const nodeDef = createNodeDefinition([mainDef, auxDef]);

      const mainPort = createPort({ id: "main-input-1", definitionId: "main-input" });
      const auxPort = createPort({ id: "aux-input-1", definitionId: "aux-input" });

      const resolvedMain = getPortDefinition(mainPort, nodeDef);
      const resolvedAux = getPortDefinition(auxPort, nodeDef);

      expect(resolvedMain).toBe(mainDef);
      expect(resolvedMain?.dataType).toEqual(["text", "html"]);
      expect(resolvedAux).toBe(auxDef);
      expect(resolvedAux?.dataType).toEqual(["image", "audio"]);
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
