/**
 * @file Tests for port type guards
 */
import { isPort, ensurePort } from "./typeGuards";
import type { Port } from "../../types/core";

describe("isPort", () => {
  const validPort: Port = {
    id: "port-1",
    nodeId: "node-1",
    type: "input",
    label: "Input Port",
    position: "left",
  };

  it("returns true for valid Port with all required fields", () => {
    expect(isPort(validPort)).toBe(true);
  });

  it("returns true for Port with additional optional fields", () => {
    const portWithOptional: Port = {
      ...validPort,
      dataType: "string",
      maxConnections: 2,
      definitionId: "def-1",
    };
    expect(isPort(portWithOptional)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isPort(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isPort(undefined)).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isPort("string")).toBe(false);
    expect(isPort(123)).toBe(false);
    expect(isPort(true)).toBe(false);
  });

  it("returns false for empty object", () => {
    expect(isPort({})).toBe(false);
  });

  it("returns false when id is missing", () => {
    const { id: _, ...noId } = validPort;
    expect(isPort(noId)).toBe(false);
  });

  it("returns false when nodeId is missing", () => {
    const { nodeId: _, ...noNodeId } = validPort;
    expect(isPort(noNodeId)).toBe(false);
  });

  it("returns false when label is missing", () => {
    const { label: _, ...noLabel } = validPort;
    expect(isPort(noLabel)).toBe(false);
  });

  it("returns false when type is missing", () => {
    const { type: _, ...noType } = validPort;
    expect(isPort(noType)).toBe(false);
  });

  it("returns false when position is missing", () => {
    const { position: _, ...noPosition } = validPort;
    expect(isPort(noPosition)).toBe(false);
  });

  it("returns false for invalid type value", () => {
    expect(isPort({ ...validPort, type: "invalid" })).toBe(false);
  });

  it("returns false for invalid position value", () => {
    expect(isPort({ ...validPort, position: "invalid" })).toBe(false);
  });

  it("validates all port types", () => {
    expect(isPort({ ...validPort, type: "input" })).toBe(true);
    expect(isPort({ ...validPort, type: "output" })).toBe(true);
  });

  it("validates all port positions", () => {
    expect(isPort({ ...validPort, position: "left" })).toBe(true);
    expect(isPort({ ...validPort, position: "right" })).toBe(true);
    expect(isPort({ ...validPort, position: "top" })).toBe(true);
    expect(isPort({ ...validPort, position: "bottom" })).toBe(true);
  });

  it("returns false when id is not a string", () => {
    expect(isPort({ ...validPort, id: 123 })).toBe(false);
  });

  it("returns false when nodeId is not a string", () => {
    expect(isPort({ ...validPort, nodeId: 123 })).toBe(false);
  });

  it("returns false when label is not a string", () => {
    expect(isPort({ ...validPort, label: 123 })).toBe(false);
  });
});

describe("ensurePort", () => {
  const fallbackPort: Port = {
    id: "fallback-port",
    nodeId: "fallback-node",
    type: "output",
    label: "Fallback",
    position: "right",
  };

  const validPort: Port = {
    id: "valid-port",
    nodeId: "valid-node",
    type: "input",
    label: "Valid",
    position: "left",
  };

  it("returns the port when valid", () => {
    expect(ensurePort(validPort, fallbackPort)).toBe(validPort);
  });

  it("returns fallback for null", () => {
    expect(ensurePort(null, fallbackPort)).toBe(fallbackPort);
  });

  it("returns fallback for undefined", () => {
    expect(ensurePort(undefined, fallbackPort)).toBe(fallbackPort);
  });

  it("returns fallback for invalid object", () => {
    expect(ensurePort({ id: "incomplete" }, fallbackPort)).toBe(fallbackPort);
  });

  it("returns fallback for primitives", () => {
    expect(ensurePort("string", fallbackPort)).toBe(fallbackPort);
    expect(ensurePort(123, fallbackPort)).toBe(fallbackPort);
  });
});
