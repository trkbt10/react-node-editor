/**
 * @file Type guard factory utilities for safely checking node render and inspector props
 */
import type { NodeRenderProps, InspectorRenderProps } from "./NodeDefinition";

/**
 * Generic type guard factory based on node type (data shape is not validated)
 * @param type - The node type to check for
 * @returns A type guard function for node render props
 */
export function createTypeGuard<TData extends Record<string, unknown> = Record<string, unknown>>(type: string) {
  return (props: NodeRenderProps): props is NodeRenderProps<TData> => props.node.type === type;
}

/**
 * Generic type guard factory based on node type for inspector props (data shape is not validated)
 * @param type - The node type to check for
 * @returns A type guard function for inspector render props
 */
export function createInspectorTypeGuard<TData extends Record<string, unknown> = Record<string, unknown>>(
  type: string,
) {
  return (props: InspectorRenderProps): props is InspectorRenderProps<TData> => props.node.type === type;
}
