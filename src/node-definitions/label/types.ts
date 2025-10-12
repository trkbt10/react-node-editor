import type { NodeData } from "../../types/core";

export type LabelNodeData = {
  title?: string;
  subtitle?: string;
  caption?: string;
  align?: "left" | "center" | "right";
  wrap?: "normal" | "nowrap" | "balance";
  ellipsis?: boolean;
  textColor?: string;
} & NodeData;

export type LabelNodeDataMap = {
  label: LabelNodeData;
};
