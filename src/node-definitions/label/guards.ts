/**
 * @file Type guards for label node data validation
 */
import type { NodeRenderProps, InspectorRenderProps } from "../../types/NodeDefinition";
import type { LabelNodeData } from "./types";

function isStringOrUndefined(v: unknown): v is string | undefined {
  return typeof v === "string" || typeof v === "undefined";
}

/**
 * Type guard to check if data conforms to LabelNodeData structure
 * @param data - Unknown data to check
 * @returns True if data is valid LabelNodeData
 */
export function isLabelNodeData(data: unknown): data is LabelNodeData {
  if (data == null || typeof data !== "object") {
    return false;
  }
  const d = data as Record<string, unknown>;
  return isStringOrUndefined(d.title) && isStringOrUndefined(d.subtitle) && isStringOrUndefined(d.caption);
}

/**
 * Type guard: render props is for label node with correct data shape
 */
export function isLabelNodeRenderProps(props: NodeRenderProps): props is NodeRenderProps<LabelNodeData> {
  return props.node.type === "label" && isLabelNodeData(props.node.data);
}

/**
 * Type guard: inspector props is for label node with correct data shape
 */
export function isLabelInspectorProps(props: InspectorRenderProps): props is InspectorRenderProps<LabelNodeData> {
  return props.node.type === "label" && isLabelNodeData(props.node.data);
}
