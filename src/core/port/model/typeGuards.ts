/**
 * @file Port type guard utilities
 * Runtime validation functions for Port types
 */
import type { Port, PortPosition, PortType } from "../../../types/core";

const VALID_PORT_TYPES: readonly PortType[] = ["input", "output"];
const VALID_PORT_POSITIONS: readonly PortPosition[] = ["left", "right", "top", "bottom"];

/**
 * Runtime type guard for Port
 * Validates that an unknown value conforms to the Port interface's required fields
 */
export const isPort = (value: unknown): value is Port => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  const hasValidId = typeof candidate.id === "string";
  const hasValidNodeId = typeof candidate.nodeId === "string";
  const hasValidLabel = typeof candidate.label === "string";
  const hasValidType = VALID_PORT_TYPES.includes(candidate.type as PortType);
  const hasValidPosition = VALID_PORT_POSITIONS.includes(candidate.position as PortPosition);

  return hasValidId && hasValidNodeId && hasValidLabel && hasValidType && hasValidPosition;
};

/**
 * Returns the port if valid, otherwise returns the fallback
 */
export const ensurePort = (raw: unknown, fallback: Port): Port => (isPort(raw) ? raw : fallback);

// Brand symbols for compile-time type discrimination
// These symbols only exist at the type level - no runtime overhead
declare const InputPortBrand: unique symbol;
declare const OutputPortBrand: unique symbol;

/**
 * Branded type for input ports.
 * Provides compile-time guarantee that a port has type: "input".
 * The brand symbol ensures InputPort and OutputPort are structurally distinct.
 */
export type InputPort = Port & {
  readonly type: "input";
  readonly [InputPortBrand]: never;
};

/**
 * Branded type for output ports.
 * Provides compile-time guarantee that a port has type: "output".
 * The brand symbol ensures InputPort and OutputPort are structurally distinct.
 */
export type OutputPort = Port & {
  readonly type: "output";
  readonly [OutputPortBrand]: never;
};

/**
 * Union type representing either branded port type.
 * Useful for functions that need to accept any validated port.
 */
export type BrandedPort = InputPort | OutputPort;

/**
 * Type guard that narrows Port to InputPort.
 * Use this for conditional checks where you need to verify port direction.
 */
export const isInputPort = (port: Port): port is InputPort => port.type === "input";

/**
 * Type guard that narrows Port to OutputPort.
 * Use this for conditional checks where you need to verify port direction.
 */
export const isOutputPort = (port: Port): port is OutputPort => port.type === "output";

/**
 * Assertion function that throws if port is not an input port.
 * Use this at function boundaries to enforce correct port direction.
 * @throws Error if port.type !== "input"
 */
export function assertInputPort(port: Port): asserts port is InputPort {
  if (port.type !== "input") {
    throw new Error(`Expected input port, got "${port.type}" for port "${port.id}"`);
  }
}

/**
 * Assertion function that throws if port is not an output port.
 * Use this at function boundaries to enforce correct port direction.
 * @throws Error if port.type !== "output"
 */
export function assertOutputPort(port: Port): asserts port is OutputPort {
  if (port.type !== "output") {
    throw new Error(`Expected output port, got "${port.type}" for port "${port.id}"`);
  }
}
