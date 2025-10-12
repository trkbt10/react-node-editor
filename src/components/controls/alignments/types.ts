/**
 * @file Alignment types
 */
import type { ComponentType } from "react";

/**
 * Alignment action types
 */
export type AlignmentActionType =
  | "align-left"
  | "align-center-horizontal"
  | "align-right"
  | "align-top"
  | "align-center-vertical"
  | "align-bottom"
  | "distribute-horizontal"
  | "distribute-vertical";

/**
 * Alignment action groups
 */
export type AlignmentActionGroup = "horizontal" | "vertical";

/**
 * Alignment action configuration
 */
export type AlignmentActionConfig = {
  type: AlignmentActionType;
  icon: ComponentType<{ size?: number }>;
  title: string;
  group: AlignmentActionGroup;
};
