/**
 * @file Unit tests for port definition normalization
 */
import type { Node } from "../../../types/core";
import type { PortDefinition } from "../../../types/NodeDefinition";
import {
  normalizePortDefinition,
  normalizePortDefinitions,
  isDynamicPortDefinition,
  getPortInstanceCount,
} from "./normalizePortDefinition";

describe("normalizePortDefinition", () => {
  const baseNode: Node = {
    id: "node-1",
    type: "test",
    position: { x: 0, y: 0 },
    data: {},
  };

  describe("instances normalization", () => {
    it("should normalize undefined instances to return 1", () => {
      const definition: PortDefinition = {
        id: "port",
        type: "input",
        label: "Port",
        position: "left",
      };

      const normalized = normalizePortDefinition(definition);
      expect(normalized.instances({ node: baseNode })).toBe(1);
    });

    it("should normalize numeric instances to a function", () => {
      const definition: PortDefinition = {
        id: "port",
        type: "input",
        label: "Port",
        position: "left",
        instances: 3,
      };

      const normalized = normalizePortDefinition(definition);
      expect(normalized.instances({ node: baseNode })).toBe(3);
    });

    it("should preserve function instances", () => {
      const definition: PortDefinition = {
        id: "port",
        type: "input",
        label: "Port",
        position: "left",
        instances: ({ node }) => (node.data.count as number) ?? 2,
      };

      const normalized = normalizePortDefinition(definition);
      expect(normalized.instances({ node: baseNode })).toBe(2);
      expect(normalized.instances({ node: { ...baseNode, data: { count: 5 } } })).toBe(5);
    });
  });

  describe("createPortId normalization", () => {
    it("should provide default createPortId for single instance", () => {
      const definition: PortDefinition = {
        id: "input",
        type: "input",
        label: "Input",
        position: "left",
      };

      const normalized = normalizePortDefinition(definition);
      const id = normalized.createPortId({
        node: baseNode,
        definition,
        index: 0,
        total: 1,
      });
      expect(id).toBe("input");
    });

    it("should provide default createPortId for multiple instances", () => {
      const definition: PortDefinition = {
        id: "input",
        type: "input",
        label: "Input",
        position: "left",
        instances: 3,
      };

      const normalized = normalizePortDefinition(definition);

      expect(normalized.createPortId({ node: baseNode, definition, index: 0, total: 3 })).toBe("input-1");
      expect(normalized.createPortId({ node: baseNode, definition, index: 1, total: 3 })).toBe("input-2");
      expect(normalized.createPortId({ node: baseNode, definition, index: 2, total: 3 })).toBe("input-3");
    });

    it("should preserve custom createPortId", () => {
      const definition: PortDefinition = {
        id: "item",
        type: "output",
        label: "Item",
        position: "right",
        instances: 2,
        createPortId: ({ index }) => `custom-${index}`,
      };

      const normalized = normalizePortDefinition(definition);
      expect(normalized.createPortId({ node: baseNode, definition, index: 0, total: 2 })).toBe("custom-0");
      expect(normalized.createPortId({ node: baseNode, definition, index: 1, total: 2 })).toBe("custom-1");
    });
  });

  describe("createPortLabel normalization", () => {
    it("should provide default createPortLabel for single instance", () => {
      const definition: PortDefinition = {
        id: "input",
        type: "input",
        label: "Input",
        position: "left",
      };

      const normalized = normalizePortDefinition(definition);
      const label = normalized.createPortLabel({
        node: baseNode,
        definition,
        index: 0,
        total: 1,
      });
      expect(label).toBe("Input");
    });

    it("should provide default createPortLabel for multiple instances", () => {
      const definition: PortDefinition = {
        id: "output",
        type: "output",
        label: "Output",
        position: "right",
        instances: 2,
      };

      const normalized = normalizePortDefinition(definition);

      expect(normalized.createPortLabel({ node: baseNode, definition, index: 0, total: 2 })).toBe("Output 1");
      expect(normalized.createPortLabel({ node: baseNode, definition, index: 1, total: 2 })).toBe("Output 2");
    });

    it("should preserve custom createPortLabel", () => {
      const definition: PortDefinition = {
        id: "channel",
        type: "output",
        label: "Channel",
        position: "right",
        instances: 2,
        createPortLabel: ({ index }) => `CH ${String.fromCharCode(65 + index)}`,
      };

      const normalized = normalizePortDefinition(definition);
      expect(normalized.createPortLabel({ node: baseNode, definition, index: 0, total: 2 })).toBe("CH A");
      expect(normalized.createPortLabel({ node: baseNode, definition, index: 1, total: 2 })).toBe("CH B");
    });
  });

  it("should preserve other definition properties", () => {
    const definition: PortDefinition = {
      id: "typed-port",
      type: "input",
      label: "Typed Port",
      position: { side: "left", segment: "main", segmentOrder: 0 },
      dataType: "string",
      dataTypes: ["text", "html"],
      required: true,
      maxConnections: 3,
    };

    const normalized = normalizePortDefinition(definition);

    expect(normalized.id).toBe("typed-port");
    expect(normalized.type).toBe("input");
    expect(normalized.label).toBe("Typed Port");
    expect(normalized.position).toEqual({ side: "left", segment: "main", segmentOrder: 0 });
    expect(normalized.dataType).toBe("string");
    expect(normalized.dataTypes).toEqual(["text", "html"]);
    expect(normalized.required).toBe(true);
    expect(normalized.maxConnections).toBe(3);
  });
});

describe("normalizePortDefinitions", () => {
  it("should normalize an array of port definitions", () => {
    const definitions: PortDefinition[] = [
      { id: "in", type: "input", label: "In", position: "left" },
      { id: "out", type: "output", label: "Out", position: "right", instances: 2 },
    ];

    const normalized = normalizePortDefinitions(definitions);

    expect(normalized).toHaveLength(2);
    expect(typeof normalized[0].instances).toBe("function");
    expect(typeof normalized[1].instances).toBe("function");
  });
});

describe("isDynamicPortDefinition", () => {
  it("should return false for undefined instances", () => {
    const definition: PortDefinition = {
      id: "port",
      type: "input",
      label: "Port",
      position: "left",
    };
    expect(isDynamicPortDefinition(definition)).toBe(false);
  });

  it("should return false for numeric instances", () => {
    const definition: PortDefinition = {
      id: "port",
      type: "input",
      label: "Port",
      position: "left",
      instances: 2,
    };
    expect(isDynamicPortDefinition(definition)).toBe(false);
  });

  it("should return true for function instances", () => {
    const definition: PortDefinition = {
      id: "port",
      type: "input",
      label: "Port",
      position: "left",
      instances: ({ node }) => (node.data.count as number) ?? 1,
    };
    expect(isDynamicPortDefinition(definition)).toBe(true);
  });
});

describe("getPortInstanceCount", () => {
  const baseNode: Node = {
    id: "node-1",
    type: "test",
    position: { x: 0, y: 0 },
    data: {},
  };

  it("should return 1 for undefined instances", () => {
    const definition: PortDefinition = {
      id: "port",
      type: "input",
      label: "Port",
      position: "left",
    };
    expect(getPortInstanceCount(definition, baseNode)).toBe(1);
  });

  it("should return the specified count for numeric instances", () => {
    const definition: PortDefinition = {
      id: "port",
      type: "input",
      label: "Port",
      position: "left",
      instances: 4,
    };
    expect(getPortInstanceCount(definition, baseNode)).toBe(4);
  });

  it("should evaluate function instances with node data", () => {
    const definition: PortDefinition = {
      id: "port",
      type: "input",
      label: "Port",
      position: "left",
      instances: ({ node }) => (node.data.portCount as number) ?? 0,
    };

    expect(getPortInstanceCount(definition, baseNode)).toBe(0);
    expect(getPortInstanceCount(definition, { ...baseNode, data: { portCount: 3 } })).toBe(3);
  });

  it("should handle negative values by returning 0", () => {
    const definition: PortDefinition = {
      id: "port",
      type: "input",
      label: "Port",
      position: "left",
      instances: () => -5,
    };
    expect(getPortInstanceCount(definition, baseNode)).toBe(0);
  });

  it("should floor decimal values", () => {
    const definition: PortDefinition = {
      id: "port",
      type: "input",
      label: "Port",
      position: "left",
      instances: () => 2.9,
    };
    expect(getPortInstanceCount(definition, baseNode)).toBe(2);
  });

  it("should handle NaN by returning 0", () => {
    const definition: PortDefinition = {
      id: "port",
      type: "input",
      label: "Port",
      position: "left",
      instances: () => NaN,
    };
    expect(getPortInstanceCount(definition, baseNode)).toBe(0);
  });
});
