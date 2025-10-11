import type { NodeRenderProps, InspectorRenderProps, NodeDataTypeMap } from "../../types/NodeDefinition";
import type { LabelNodeData, LabelNodeDataMap } from "./types";

function isStringOrUndefined(v: unknown): v is string | undefined {
  return typeof v === "string" || typeof v === "undefined";
}































export function isLabelNodeData(data: unknown): data is LabelNodeData {
  if (data == null || typeof data !== "object") {return false;}
  const d = data as Record<string, unknown>;
  return isStringOrUndefined(d.title) && isStringOrUndefined(d.subtitle) && isStringOrUndefined(d.caption);
}

/**
 * Type guard: render props is for label node with correct data shape
 */
export function isLabelNodeRenderProps(
  props: NodeRenderProps<string, NodeDataTypeMap & LabelNodeDataMap>
): props is NodeRenderProps<"label", LabelNodeDataMap> {
  return props.node.type === "label" && isLabelNodeData(props.node.data);
}

/**
 * Type guard: inspector props is for label node with correct data shape
 */
export function isLabelInspectorProps(
  props: InspectorRenderProps<string, NodeDataTypeMap & LabelNodeDataMap>
): props is InspectorRenderProps<"label", LabelNodeDataMap> {
  return props.node.type === "label" && isLabelNodeData(props.node.data);
}
