/**
 * @file Node appearance calculations
 * Pure functions for deriving node visual properties
 */
import type { Node } from "../../types/core";
import { getReadableTextColor, applyOpacity } from "../../utils/colorUtils";

/**
 * Extract group background color from node data
 */
export const getGroupBackground = (node: Node, isGroup: boolean): string | undefined => {
  if (!isGroup) {
    return undefined;
  }
  const data = node.data as Record<string, unknown>;
  if (typeof data.groupBackground === "string") {
    return data.groupBackground;
  }
  return undefined;
};

/**
 * Extract group opacity from node data
 */
export const getGroupOpacity = (node: Node, isGroup: boolean): number | undefined => {
  if (!isGroup) {
    return undefined;
  }
  const data = node.data as Record<string, unknown>;
  if (typeof data.groupOpacity === "number") {
    return data.groupOpacity;
  }
  return undefined;
};

/**
 * Calculate readable text color for group node
 */
export const getGroupTextColor = (
  groupBackground: string | undefined,
  isGroup: boolean,
): string | undefined => {
  if (!isGroup) {
    return undefined;
  }
  return getReadableTextColor(groupBackground);
};

/**
 * Calculate background color with applied opacity
 */
export const getBackgroundWithOpacity = (
  groupBackground: string | undefined,
  groupOpacity: number | undefined,
  isGroup: boolean,
): string | undefined => {
  if (!isGroup) {
    return undefined;
  }
  if (!groupBackground) {
    return undefined;
  }
  if (typeof groupOpacity !== "number") {
    return groupBackground;
  }
  return applyOpacity(groupBackground, groupOpacity);
};

export type NodeAppearance = {
  groupBackground: string | undefined;
  groupOpacity: number | undefined;
  groupTextColor: string | undefined;
  backgroundWithOpacity: string | undefined;
};

/**
 * Compute all appearance properties for a node
 */
export const computeNodeAppearance = (node: Node, isGroup: boolean): NodeAppearance => {
  const groupBackground = getGroupBackground(node, isGroup);
  const groupOpacity = getGroupOpacity(node, isGroup);
  const groupTextColor = getGroupTextColor(groupBackground, isGroup);
  const backgroundWithOpacity = getBackgroundWithOpacity(groupBackground, groupOpacity, isGroup);

  return {
    groupBackground,
    groupOpacity,
    groupTextColor,
    backgroundWithOpacity,
  };
};

/**
 * Check if two appearances are equal
 */
export const areNodeAppearancesEqual = (
  prev: NodeAppearance,
  next: NodeAppearance,
): boolean => {
  return (
    prev.groupBackground === next.groupBackground &&
    prev.groupOpacity === next.groupOpacity &&
    prev.groupTextColor === next.groupTextColor &&
    prev.backgroundWithOpacity === next.backgroundWithOpacity
  );
};
