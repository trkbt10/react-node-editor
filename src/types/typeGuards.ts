import type { NodeRenderProps, InspectorRenderProps, NodeDataTypeMap } from "./NodeDefinition";

/**
 * Generic type guard factory based on node type (data shape is not validated)
 * @param type - The node type to check for
 * @returns A type guard function for node render props
 */
export function createTypeGuard<T extends string, TMap extends NodeDataTypeMap = NodeDataTypeMap>(type: T) {
  return (
    props: NodeRenderProps<string, TMap>
  ): props is NodeRenderProps<T, TMap> => props.node.type === type;
}

/**
 * Generic type guard factory based on node type for inspector props (data shape is not validated)
 * @param type - The node type to check for
 * @returns A type guard function for inspector render props
 */
export function createInspectorTypeGuard<T extends string, TMap extends NodeDataTypeMap = NodeDataTypeMap>(type: T) {
  return (
    props: InspectorRenderProps<string, TMap>
  ): props is InspectorRenderProps<T, TMap> => props.node.type === type;
}
