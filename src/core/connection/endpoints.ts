/**
 * @file Connection endpoint utilities
 * Type definition for connection endpoints.
 */
import type { Position } from "../../types/core";

/**
 * Connection endpoints - positions only.
 * Direction is calculated automatically from geometric relationship in path.ts.
 */
export type ConnectionEndpoints = {
  /** Output port position (where data flows from) */
  outputPosition: Position;
  /** Input port position (where data flows to) */
  inputPosition: Position;
};
