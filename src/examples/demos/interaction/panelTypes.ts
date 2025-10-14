/**
 * @file Shared types for the interaction customization example panel components.
 */
import type {
  KeyboardShortcutActionBehavior,
  NodeEditorShortcutAction,
  PointerType,
  ShortcutBinding,
} from "../../../types/interaction";

export type PanOptionsState = {
  allowMouse: boolean;
  allowTouch: boolean;
  allowPen: boolean;
  requireEmptyTarget: boolean;
};

export type PinchOptionsState = {
  enabled: boolean;
  pointerTypes: PointerType[];
  minDistance: number;
};

export type ShortcutOverrideState = Partial<Record<NodeEditorShortcutAction, KeyboardShortcutActionBehavior>>;

export type ShortcutBindingMap = Record<NodeEditorShortcutAction, ShortcutBinding[]>;
