/**
 * @file Unit tests for connection normalization utilities.
 */
import type { Port } from "../../types/core";
import type { NodeDefinition } from "../../types/NodeDefinition";
import { normalizeConnectionPorts, normalizeConnectionContext } from "./normalization";

const createOutputPort = (id: string, nodeId: string): Port => ({
  id,
  nodeId,
  type: "output",
  label: `Output ${id}`,
  position: "right",
});

const createInputPort = (id: string, nodeId: string): Port => ({
  id,
  nodeId,
  type: "input",
  label: `Input ${id}`,
  position: "left",
});

const createNodeDef = (type: string): NodeDefinition => ({
  type,
  displayName: type,
  ports: [],
});

describe("normalizeConnectionPorts", () => {
  const outputPort = createOutputPort("out", "nodeA");
  const inputPort = createInputPort("in", "nodeB");

  it("returns normalized ports for output -> input (no swap needed)", () => {
    const result = normalizeConnectionPorts(outputPort, inputPort);

    expect(result).not.toBeNull();
    expect(result!.sourcePort.type).toBe("output");
    expect(result!.sourcePort.id).toBe("out");
    expect(result!.targetPort.type).toBe("input");
    expect(result!.targetPort.id).toBe("in");
  });

  it("swaps ports for input -> output (reverse direction)", () => {
    const result = normalizeConnectionPorts(inputPort, outputPort);

    expect(result).not.toBeNull();
    expect(result!.sourcePort.type).toBe("output");
    expect(result!.sourcePort.id).toBe("out");
    expect(result!.targetPort.type).toBe("input");
    expect(result!.targetPort.id).toBe("in");
  });

  it("returns null for same type (output -> output)", () => {
    const output2 = createOutputPort("out2", "nodeC");

    expect(normalizeConnectionPorts(outputPort, output2)).toBeNull();
  });

  it("returns null for same type (input -> input)", () => {
    const input2 = createInputPort("in2", "nodeC");

    expect(normalizeConnectionPorts(inputPort, input2)).toBeNull();
  });

  it("returns null for same node connection", () => {
    const sameNodeOutput = createOutputPort("out", "nodeA");
    const sameNodeInput = createInputPort("in", "nodeA");

    expect(normalizeConnectionPorts(sameNodeOutput, sameNodeInput)).toBeNull();
  });
});

describe("normalizeConnectionContext", () => {
  const outputPort = createOutputPort("out", "nodeA");
  const inputPort = createInputPort("in", "nodeB");
  const defA = createNodeDef("TypeA");
  const defB = createNodeDef("TypeB");

  it("returns normalized context with definitions for output -> input", () => {
    const result = normalizeConnectionContext(outputPort, inputPort, defA, defB);

    expect(result).not.toBeNull();
    expect(result!.sourcePort.id).toBe("out");
    expect(result!.targetPort.id).toBe("in");
    expect(result!.sourceDefinition).toBe(defA);
    expect(result!.targetDefinition).toBe(defB);
  });

  it("swaps both ports and definitions for input -> output", () => {
    const result = normalizeConnectionContext(inputPort, outputPort, defB, defA);

    expect(result).not.toBeNull();
    expect(result!.sourcePort.id).toBe("out");
    expect(result!.targetPort.id).toBe("in");
    // Definitions should follow their respective ports
    expect(result!.sourceDefinition).toBe(defA);
    expect(result!.targetDefinition).toBe(defB);
  });

  it("handles undefined definitions", () => {
    const result = normalizeConnectionContext(outputPort, inputPort, undefined, undefined);

    expect(result).not.toBeNull();
    expect(result!.sourceDefinition).toBeUndefined();
    expect(result!.targetDefinition).toBeUndefined();
  });

  it("handles partial definitions (only from)", () => {
    const result = normalizeConnectionContext(outputPort, inputPort, defA, undefined);

    expect(result).not.toBeNull();
    expect(result!.sourceDefinition).toBe(defA);
    expect(result!.targetDefinition).toBeUndefined();
  });

  it("handles partial definitions (only to)", () => {
    const result = normalizeConnectionContext(outputPort, inputPort, undefined, defB);

    expect(result).not.toBeNull();
    expect(result!.sourceDefinition).toBeUndefined();
    expect(result!.targetDefinition).toBe(defB);
  });

  it("returns null for invalid port combinations", () => {
    const output2 = createOutputPort("out2", "nodeC");

    expect(normalizeConnectionContext(outputPort, output2, defA, defB)).toBeNull();
  });

  it("correctly associates definitions after swap", () => {
    // defB is for nodeB (input port), defA is for nodeA (output port)
    // When we pass input first, definitions should still match correctly after swap
    const result = normalizeConnectionContext(inputPort, outputPort, defB, defA);

    expect(result).not.toBeNull();
    // sourcePort is from nodeA, so sourceDefinition should be defA
    expect(result!.sourcePort.nodeId).toBe("nodeA");
    expect(result!.sourceDefinition).toBe(defA);
    // targetPort is from nodeB, so targetDefinition should be defB
    expect(result!.targetPort.nodeId).toBe("nodeB");
    expect(result!.targetDefinition).toBe(defB);
  });
});
