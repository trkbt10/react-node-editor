/**
 * @file Central export module for all built-in node definitions
 */

export { StandardNodeDefinition } from "./standard";
export { GroupNodeDefinition } from "./group";
export { LabelNodeDefinition } from "./label";

// Export individual node renderers if needed
export { StandardNodeRenderer } from "./standard/node";
export { GroupNodeRenderer } from "./group/node";
export { LabelNodeRenderer } from "./label/node";

// Export error node definition and utilities
export {
  createErrorNodeDefinition,
  defaultFallbackFactory,
  ErrorNodeRenderer,
  ERROR_NODE_TYPE_PREFIX,
  isErrorNodeType,
  getOriginalTypeFromErrorType,
  type ErrorNodeData,
} from "./error";

// Inspector renderers are exported from components/inspector/renderers
// export { StandardInspectorRenderer, GroupInspectorRenderer, LabelInspectorRenderer } from "../components/inspector/renderers";

// Import definitions for default array
import { GroupNodeDefinition } from "./group";
import { LabelNodeDefinition } from "./label";
import type { NodeDefinition } from "../types/NodeDefinition";

/**
 * Array of all default node definitions
 * Use this when you need to register all built-in node types
 */
export const defaultNodeDefinitions: NodeDefinition[] = [
  GroupNodeDefinition as unknown as NodeDefinition,
  LabelNodeDefinition as unknown as NodeDefinition,
];
