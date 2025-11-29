/**
 * @file Error node definition factory for unknown node types
 */
import type { NodeDefinition } from "../../types/NodeDefinition";
import type { ErrorNodeData } from "./types";
import { ERROR_NODE_TYPE_PREFIX } from "./types";
import { ErrorNodeRenderer } from "./node";

export { ErrorNodeRenderer } from "./node";
export {
  ERROR_NODE_TYPE_PREFIX,
  isErrorNodeType,
  getOriginalTypeFromErrorType,
  type ErrorNodeData,
} from "./types";

/**
 * Creates an error node definition for a given unknown type.
 * This is used as a fallback when a node's type is not found in the registry.
 *
 * @param originalType - The original type name that was not found
 * @returns A NodeDefinition configured to display an error state
 */
export const createErrorNodeDefinition = (originalType: string): NodeDefinition<ErrorNodeData> => ({
  type: `${ERROR_NODE_TYPE_PREFIX}${originalType}`,
  displayName: "Unknown Node",
  description: `Node definition not found for type: ${originalType}`,
  icon: "⚠️",
  category: "__internal__",
  visualState: "error",
  defaultData: {
    title: "Unknown Node",
    originalType,
    errorMessage: `Definition not found: "${originalType}"`,
  },
  defaultSize: { width: 200, height: 100 },
  defaultResizable: true,
  ports: [],
  behaviors: ["node"],
  renderNode: ErrorNodeRenderer,
});

/**
 * Type for the fallback definition option.
 * - NodeDefinition: A fixed fallback definition to use for all unknown types
 * - (type: string) => NodeDefinition: A factory function that creates a definition based on the unknown type
 */
export type FallbackDefinition = NodeDefinition | ((type: string) => NodeDefinition);

/**
 * Default fallback factory that creates error node definitions.
 * This is the standard fallback used when `fallbackDefinition: true` is specified.
 */
export const defaultFallbackFactory = (type: string): NodeDefinition => {
  return createErrorNodeDefinition(type) as unknown as NodeDefinition;
};
