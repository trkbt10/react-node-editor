/**
 * @file Type definitions for error node data
 */
import type { NodeData } from "../../types/core";

/**
 * Internal prefix used to identify error node types.
 * This prefix is prepended to the original unknown type name.
 */
export const ERROR_NODE_TYPE_PREFIX = "__error__:";

/**
 * Data structure for error nodes displayed when a node definition is not found.
 */
export type ErrorNodeData = {
  /** The original type name that was not found in the registry */
  originalType: string;
  /** Human-readable error message */
  errorMessage: string;
} & NodeData;

/**
 * Checks if a node type string represents an error node.
 */
export const isErrorNodeType = (type: string): boolean => {
  return type.startsWith(ERROR_NODE_TYPE_PREFIX);
};

/**
 * Extracts the original type name from an error node type.
 * Returns undefined if the type is not an error node type.
 */
export const getOriginalTypeFromErrorType = (type: string): string | undefined => {
  if (!isErrorNodeType(type)) {
    return undefined;
  }
  return type.slice(ERROR_NODE_TYPE_PREFIX.length);
};
