/**
 * @file Tests for port factory functions
 * Ensures all port properties are correctly copied and no properties are missed.
 */
import type { Port, PortPlacement } from "../../types/core";
import type { PortDefinition } from "../../types/NodeDefinition";
import {
  createPort,
  clonePortForNode,
  createActionPort,
  createPortFromDefinition,
  createPortInstance,
  validatePortCompleteness,
  PORT_PROPERTY_KEYS,
} from "./factory";

const createFullPort = (overrides: Partial<Port> = {}): Port => ({
  id: "test-port",
  definitionId: "test-definition",
  type: "input",
  label: "Test Port",
  nodeId: "test-node",
  position: "left",
  placement: { side: "left", segment: "main", segmentOrder: 1, segmentSpan: 2, align: 0.5 },
  dataType: ["text", "html"],
  maxConnections: 3,
  allowedNodeTypes: ["type-a", "type-b"],
  allowedPortTypes: ["output"],
  instanceIndex: 0,
  instanceTotal: 2,
  ...overrides,
});

describe("createPort", () => {
  it("creates a port with required fields only", () => {
    const port = createPort({
      id: "port-1",
      type: "input",
      label: "Input",
      nodeId: "node-1",
      position: "left",
    });

    expect(port.id).toBe("port-1");
    expect(port.type).toBe("input");
    expect(port.label).toBe("Input");
    expect(port.nodeId).toBe("node-1");
    expect(port.position).toBe("left");
  });

  it("creates a port with all optional fields", () => {
    const placement: PortPlacement = { side: "left", segment: "main" };
    const port = createPort(
      {
        id: "port-1",
        type: "output",
        label: "Output",
        nodeId: "node-1",
        position: "right",
      },
      {
        definitionId: "def-1",
        placement,
        dataType: ["text", "html"],
        maxConnections: 5,
        allowedNodeTypes: ["type-a"],
        allowedPortTypes: ["input"],
        instanceIndex: 1,
        instanceTotal: 3,
      },
    );

    expect(port.definitionId).toBe("def-1");
    expect(port.placement).toEqual(placement);
    expect(port.dataType).toEqual(["text", "html"]);
    expect(port.maxConnections).toBe(5);
    expect(port.allowedNodeTypes).toEqual(["type-a"]);
    expect(port.allowedPortTypes).toEqual(["input"]);
    expect(port.instanceIndex).toBe(1);
    expect(port.instanceTotal).toBe(3);
  });
});

describe("clonePortForNode", () => {
  it("copies all properties except nodeId", () => {
    const source = createFullPort();
    const cloned = clonePortForNode(source, "new-node");

    expect(cloned.nodeId).toBe("new-node");
    expect(cloned.id).toBe(source.id);
    expect(cloned.type).toBe(source.type);
    expect(cloned.label).toBe(source.label);
    expect(cloned.position).toBe(source.position);
    expect(cloned.definitionId).toBe(source.definitionId);
    expect(cloned.placement).toEqual(source.placement);
    expect(cloned.dataType).toEqual(source.dataType);
    expect(cloned.maxConnections).toBe(source.maxConnections);
    expect(cloned.allowedNodeTypes).toEqual(source.allowedNodeTypes);
    expect(cloned.allowedPortTypes).toEqual(source.allowedPortTypes);
    expect(cloned.instanceIndex).toBe(source.instanceIndex);
    expect(cloned.instanceTotal).toBe(source.instanceTotal);
  });

  it("preserves undefined optional properties", () => {
    const source: Port = {
      id: "minimal",
      type: "input",
      label: "Minimal",
      nodeId: "node-1",
      position: "left",
    };
    const cloned = clonePortForNode(source, "new-node");

    expect(cloned.definitionId).toBeUndefined();
    expect(cloned.dataType).toBeUndefined();
    expect(cloned.maxConnections).toBeUndefined();
  });
});

describe("createActionPort", () => {
  it("creates an exact copy of the source port", () => {
    const source = createFullPort();
    const actionPort = createActionPort(source);

    // Verify all properties are copied
    for (const key of PORT_PROPERTY_KEYS) {
      expect(actionPort[key]).toEqual(source[key]);
    }
  });

  it("copies dataType correctly for connection validation", () => {
    const source = createFullPort({ dataType: ["image", "audio"] });
    const actionPort = createActionPort(source);

    expect(actionPort.dataType).toEqual(["image", "audio"]);
  });

  it("copies maxConnections correctly", () => {
    const source = createFullPort({ maxConnections: "unlimited" });
    const actionPort = createActionPort(source);

    expect(actionPort.maxConnections).toBe("unlimited");
  });
});

describe("createPortFromDefinition", () => {
  it("creates a port from a simple definition", () => {
    const definition: PortDefinition = {
      id: "input-def",
      type: "input",
      label: "Input Port",
      position: "left",
      dataType: "text",
    };
    const placement: PortPlacement = { side: "left" };

    const port = createPortFromDefinition(definition, "node-1", placement);

    expect(port.id).toBe("input-def");
    expect(port.definitionId).toBe("input-def");
    expect(port.type).toBe("input");
    expect(port.label).toBe("Input Port");
    expect(port.nodeId).toBe("node-1");
    expect(port.position).toBe("left");
    expect(port.placement).toEqual(placement);
    expect(port.dataType).toBe("text");
  });

  it("merges dataType and dataTypes from definition", () => {
    const definition: PortDefinition = {
      id: "multi-type",
      type: "output",
      label: "Multi Type",
      position: "right",
      dataType: "text",
      dataTypes: ["html", "markdown"],
    };
    const placement: PortPlacement = { side: "right" };

    const port = createPortFromDefinition(definition, "node-1", placement);

    expect(port.dataType).toEqual(["text", "html", "markdown"]);
  });

  it("handles array dataType in definition", () => {
    const definition: PortDefinition = {
      id: "array-type",
      type: "input",
      label: "Array Type",
      position: "left",
      dataType: ["image", "video"],
    };
    const placement: PortPlacement = { side: "left" };

    const port = createPortFromDefinition(definition, "node-1", placement);

    expect(port.dataType).toEqual(["image", "video"]);
  });

  it("copies maxConnections from definition", () => {
    const definition: PortDefinition = {
      id: "limited",
      type: "input",
      label: "Limited",
      position: "left",
      maxConnections: 2,
    };
    const placement: PortPlacement = { side: "left" };

    const port = createPortFromDefinition(definition, "node-1", placement);

    expect(port.maxConnections).toBe(2);
  });
});

describe("createPortInstance", () => {
  it("creates a port instance with all properties from definition and context", () => {
    const definition: PortDefinition = {
      id: "input-def",
      type: "input",
      label: "Input Port",
      position: "left",
      maxConnections: 3,
    };
    const placement: PortPlacement = { side: "left", segment: "main" };

    const port = createPortInstance(
      definition,
      {
        id: "input-def-1",
        label: "Input Port 1",
        nodeId: "node-1",
        placement,
        instanceIndex: 0,
        instanceTotal: 3,
      },
      "text",
    );

    expect(port.id).toBe("input-def-1");
    expect(port.definitionId).toBe("input-def");
    expect(port.type).toBe("input");
    expect(port.label).toBe("Input Port 1");
    expect(port.nodeId).toBe("node-1");
    expect(port.position).toBe("left");
    expect(port.placement).toEqual(placement);
    expect(port.dataType).toBe("text");
    expect(port.maxConnections).toBe(3);
    expect(port.instanceIndex).toBe(0);
    expect(port.instanceTotal).toBe(3);
  });

  it("creates multiple instances with correct indices", () => {
    const definition: PortDefinition = {
      id: "output",
      type: "output",
      label: "Output",
      position: "right",
      dataType: ["text", "html"],
    };
    const placement: PortPlacement = { side: "right" };
    const resolvedDataType = ["text", "html"];

    const instances = [0, 1, 2].map((index) =>
      createPortInstance(
        definition,
        {
          id: `output-${index + 1}`,
          label: `Output ${index + 1}`,
          nodeId: "node-1",
          placement,
          instanceIndex: index,
          instanceTotal: 3,
        },
        resolvedDataType,
      ),
    );

    expect(instances).toHaveLength(3);
    instances.forEach((port, index) => {
      expect(port.id).toBe(`output-${index + 1}`);
      expect(port.definitionId).toBe("output");
      expect(port.instanceIndex).toBe(index);
      expect(port.instanceTotal).toBe(3);
      expect(port.dataType).toEqual(["text", "html"]);
    });
  });

  it("handles undefined dataType", () => {
    const definition: PortDefinition = {
      id: "generic",
      type: "input",
      label: "Generic",
      position: "left",
    };
    const placement: PortPlacement = { side: "left" };

    const port = createPortInstance(
      definition,
      {
        id: "generic",
        label: "Generic",
        nodeId: "node-1",
        placement,
        instanceIndex: 0,
        instanceTotal: 1,
      },
      undefined,
    );

    expect(port.dataType).toBeUndefined();
  });
});

describe("validatePortCompleteness", () => {
  it("returns empty array when all properties are copied", () => {
    const source = createFullPort();
    const copy = createActionPort(source);

    const missing = validatePortCompleteness(copy, source);

    expect(missing).toEqual([]);
  });

  it("detects missing dataType", () => {
    const source = createFullPort({ dataType: "text" });
    const incomplete: Port = {
      id: source.id,
      type: source.type,
      label: source.label,
      nodeId: source.nodeId,
      position: source.position,
      // dataType intentionally omitted
    };

    const missing = validatePortCompleteness(incomplete, source);

    expect(missing).toContain("dataType");
  });

  it("detects missing maxConnections", () => {
    const source = createFullPort({ maxConnections: 5 });
    const incomplete: Port = {
      id: source.id,
      type: source.type,
      label: source.label,
      nodeId: source.nodeId,
      position: source.position,
      dataType: source.dataType,
      // maxConnections intentionally omitted
    };

    const missing = validatePortCompleteness(incomplete, source);

    expect(missing).toContain("maxConnections");
  });

  it("detects multiple missing properties", () => {
    const source = createFullPort();
    const incomplete: Port = {
      id: source.id,
      type: source.type,
      label: source.label,
      nodeId: source.nodeId,
      position: source.position,
    };

    const missing = validatePortCompleteness(incomplete, source);

    expect(missing).toContain("dataType");
    expect(missing).toContain("maxConnections");
    expect(missing).toContain("allowedNodeTypes");
    expect(missing).toContain("allowedPortTypes");
    expect(missing).toContain("definitionId");
    expect(missing).toContain("placement");
    expect(missing).toContain("instanceIndex");
    expect(missing).toContain("instanceTotal");
  });

  it("ignores properties that are undefined in source", () => {
    const source: Port = {
      id: "minimal",
      type: "input",
      label: "Minimal",
      nodeId: "node-1",
      position: "left",
    };
    const copy: Port = {
      id: "minimal",
      type: "input",
      label: "Minimal",
      nodeId: "node-1",
      position: "left",
    };

    const missing = validatePortCompleteness(copy, source);

    expect(missing).toEqual([]);
  });
});

describe("PORT_PROPERTY_KEYS exhaustiveness", () => {
  it("contains all Port type properties", () => {
    const testPort = createFullPort();

    // Ensure every property key of a full port is in PORT_PROPERTY_KEYS
    const portKeys = Object.keys(testPort) as Array<keyof Port>;

    for (const key of portKeys) {
      expect(PORT_PROPERTY_KEYS).toContain(key);
    }
  });

  it("has correct count of properties", () => {
    // Port type has 13 properties
    expect(PORT_PROPERTY_KEYS).toHaveLength(13);
  });
});
