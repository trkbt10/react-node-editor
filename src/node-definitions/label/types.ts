/**
 * @file Type definitions for label node data
 */
import type { NodeData } from "../../types/core";

export type LabelNodeData = {
  labelTitle?: string;
  labelSubtitle?: string;
  labelCaption?: string;
  align?: "left" | "center" | "right";
  wrap?: "normal" | "nowrap" | "balance";
  ellipsis?: boolean;
  textColor?: string;
} & NodeData;

export type LabelNodeDataMap = {
  label: LabelNodeData;
};
