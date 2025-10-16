/**
 * @file Types describing configurable interaction behavior for the node editor.
 */
import type { Position } from "./core";

/**
 * Supported pointer input types for editor interactions.
 */
export type PointerType = "mouse" | "pen" | "touch";

/**
 * Modifier keys that can participate in interaction activation rules.
 */
export type ModifierKey = "altKey" | "ctrlKey" | "metaKey" | "shiftKey";

/**
 * Optional modifier constraints for a pointer activation.
 * When provided, each key's boolean indicates whether the key must be pressed (true) or released (false).
 */
export type ModifierConditions = Partial<Record<ModifierKey, boolean>>;

/**
 * Defines how a pointer interaction can activate canvas panning.
 */
export type CanvasPanActivator = {
  /**
   * Pointer input types that satisfy this activation rule.
   */
  pointerTypes: PointerType[];
  /**
   * Optional list of button values (from PointerEvent.button) that must match.
   * If omitted, any button is accepted.
   */
  buttons?: number[];
  /**
   * Optional modifier constraints required for this activation to succeed.
   */
  modifiers?: ModifierConditions;
  /**
   * When true, the activation is only permitted if the pointer down target is not interactive.
   */
  requireEmptyTarget?: boolean;
};

/**
 * Pinch zoom configuration for touch/pen gestures.
 */
export type PinchZoomSettings = {
  /**
   * Enables pinch-to-zoom gestures when true.
   */
  enabled: boolean;
  /**
   * Pointer types that are allowed to trigger pinch zoom.
   */
  pointerTypes: PointerType[];
  /**
   * Optional minimum pixel distance before pinch zoom engages, to prevent jitter.
   */
  minDistance?: number;
};

/**
 * Target metadata for context menu requests.
 */
export type ContextMenuTarget =
  | { kind: "canvas" }
  | { kind: "node"; nodeId: string }
  | { kind: "connection"; connectionId: string };

/**
 * Details supplied to consumers that override context menu behavior.
 */
export type ContextMenuRequest = {
  /**
   * Contextual target that initiated the request.
   */
  target: ContextMenuTarget;
  /**
   * Screen-space coordinates where the request originated.
   */
  screenPosition: Position;
  /**
   * Canvas-space coordinates associated with the request.
   */
  canvasPosition: Position;
  /**
   * Pointer type responsible for the request (defaults to "unknown" when not derivable).
   */
  pointerType: PointerType | "unknown";
  /**
   * Underlying DOM event for reference. Consumers should avoid mutating it.
   */
  event: MouseEvent | PointerEvent;
  /**
   * Invokes the built-in context menu handling.
   */
  defaultShow: () => void;
};

/**
 * Customization surface for context menu handling.
 */
export type ContextMenuBehavior = {
  /**
   * Optional handler invoked whenever the editor intends to show a context menu.
   * Call `request.defaultShow()` to preserve the default behavior.
   */
  handleRequest?: (request: ContextMenuRequest) => void;
};

/**
 * Declares a keyboard shortcut binding. Mirrors the runtime shortcut configuration.
 */
export type ShortcutBinding = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  /**
   * When true, registers both Ctrl (Windows/Linux) and Cmd (macOS) variants.
   * Should not be combined with explicit ctrl/meta flags.
   */
  cmdOrCtrl?: boolean;
};

export type PointerShortcutModifiers = {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  /**
   * When true, accepts either Ctrl (Windows/Linux) or Cmd (macOS).
   */
  cmdOrCtrl?: boolean;
};

/**
 * Pointer shortcut binding describing a button + modifier combination.
 */
export type PointerShortcutBinding = {
  /**
   * Pointer button index that activates the shortcut (0 = primary button).
   */
  button: number;
  /**
   * Pointer types that can trigger this shortcut. When omitted, any type is accepted.
   */
  pointerTypes?: PointerType[];
  /**
   * Modifier constraints required for activation.
   */
  modifiers?: PointerShortcutModifiers;
  /**
   * When true, activation requires the pointer target to be non-interactive (empty surface).
   */
  requireEmptyTarget?: boolean;
};

/**
 * Well-known shortcut actions exposed for configuration.
 */
export type NodeEditorShortcutAction =
  | "delete-selection"
  | "select-all"
  | "clear-selection"
  | "add-node"
  | "duplicate-selection"
  | "lock-selection"
  | "unlock-all"
  | "save"
  | "auto-layout"
  | "undo"
  | "redo"
  | "copy"
  | "cut"
  | "paste";

/**
 * Pointer-based interaction actions that can be configured.
 */
export type NodeEditorPointerAction =
  | "canvas-clear-selection"
  | "canvas-pan"
  | "canvas-range-select"
  | "node-select"
  | "node-add-to-selection"
  | "node-open-context-menu"
  | "canvas-open-context-menu";

/**
 * Configuration for a single shortcut action.
 */
export type KeyboardShortcutActionBehavior = {
  /**
   * Explicitly enable or disable this shortcut. Defaults to true.
   */
  enabled?: boolean;
  /**
   * Custom bindings to use instead of the defaults. When omitted, defaults apply.
   */
  bindings?: ShortcutBinding[];
};

/**
 * Aggregated keyboard shortcut behavior customizations.
 */
export type KeyboardShortcutBehavior = {
  /**
   * Global toggle for the entire shortcut system.
   */
  enabled: boolean;
  /**
   * Action-specific overrides keyed by shortcut identifier.
   */
  actions: Partial<Record<NodeEditorShortcutAction, KeyboardShortcutActionBehavior>>;
};

/**
 * Configuration for a single pointer shortcut action.
 */
export type PointerShortcutActionBehavior = {
  /**
   * Enable or disable this pointer shortcut. Defaults to true.
   */
  enabled?: boolean;
  /**
   * Pointer binding overriding the default.
   */
  binding?: PointerShortcutBinding | null;
};

/**
 * Aggregated pointer shortcut behavior customizations.
 */
export type PointerShortcutBehavior = {
  /**
   * Global toggle for pointer shortcuts.
   */
  enabled: boolean;
  /**
   * Action-specific overrides.
   */
  actions: Partial<Record<NodeEditorPointerAction, PointerShortcutActionBehavior>>;
};

/**
 * Aggregated interaction settings that can be supplied to the node editor.
 */
export type NodeEditorInteractionSettings = {
  canvasPanActivators: CanvasPanActivator[];
  pinchZoom: PinchZoomSettings;
  contextMenu: ContextMenuBehavior;
  keyboardShortcuts: KeyboardShortcutBehavior;
  pointerShortcuts: PointerShortcutBehavior;
};

/**
 * Partial update shape for interaction settings supplied via props.
 */
export type NodeEditorInteractionSettingsPatch = {
  canvasPanActivators?: CanvasPanActivator[];
  pinchZoom?: Partial<PinchZoomSettings>;
  contextMenu?: Partial<ContextMenuBehavior>;
  keyboardShortcuts?: {
    enabled?: boolean;
    actions?: Partial<Record<NodeEditorShortcutAction, KeyboardShortcutActionBehavior>>;
  };
  pointerShortcuts?: {
    enabled?: boolean;
    actions?: Partial<Record<NodeEditorPointerAction, PointerShortcutActionBehavior>>;
  };
};
