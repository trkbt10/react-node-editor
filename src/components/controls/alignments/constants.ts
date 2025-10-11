import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignMiddleIcon,
  AlignBottomIcon,
  DistributeHorizontalIcon,
  DistributeVerticalIcon,
} from "../../elements/icons";
import type { AlignmentActionConfig, AlignmentActionGroup } from "./types";

/**
 * Available alignment action groups
 */
export const ALIGNMENT_GROUPS: AlignmentActionGroup[] = ["horizontal", "vertical"];

/**
 * Available alignment actions with their configurations
 */
export const ALIGNMENT_ACTIONS: AlignmentActionConfig[] = [
  { type: "align-left", icon: AlignLeftIcon, title: "Align Left", group: "horizontal" },
  { type: "align-center-horizontal", icon: AlignCenterIcon, title: "Align Center Horizontal", group: "horizontal" },
  { type: "align-right", icon: AlignRightIcon, title: "Align Right", group: "horizontal" },
  { type: "distribute-horizontal", icon: DistributeHorizontalIcon, title: "Distribute Horizontally", group: "horizontal" },
  { type: "align-top", icon: AlignTopIcon, title: "Align Top", group: "vertical" },
  { type: "align-center-vertical", icon: AlignMiddleIcon, title: "Align Center Vertical", group: "vertical" },
  { type: "align-bottom", icon: AlignBottomIcon, title: "Align Bottom", group: "vertical" },
  { type: "distribute-vertical", icon: DistributeVerticalIcon, title: "Distribute Vertically", group: "vertical" },
];
