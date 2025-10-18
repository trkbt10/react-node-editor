/**
 * @file Utilities for working with configurable pointer shortcuts.
 */
import type {
  NodeEditorPointerAction,
  PointerShortcutActionBehavior,
  PointerShortcutBehavior,
  PointerShortcutBinding,
  PointerShortcutModifiers,
  PointerType,
} from "../types/interaction";

type PointerLikeEvent = Pick<
  PointerEvent | MouseEvent,
  "button" | "ctrlKey" | "shiftKey" | "altKey" | "metaKey" | "detail"
> & {
  readonly pointerType?: string;
};

const resolvePointerType = (event: PointerLikeEvent): string => {
  if ("pointerType" in event && event.pointerType) {
    return event.pointerType;
  }
  return "mouse";
};

const matchesModifier = (
  event: PointerLikeEvent,
  modifier: keyof PointerShortcutModifiers,
  expected: boolean,
): boolean => {
  if (modifier === "cmdOrCtrl") {
    return expected ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
  }
  if (modifier === "ctrl") {
    return !!event.ctrlKey === expected;
  }
  if (modifier === "shift") {
    return !!event.shiftKey === expected;
  }
  if (modifier === "alt") {
    return !!event.altKey === expected;
  }
  if (modifier === "meta") {
    return !!event.metaKey === expected;
  }
  return true;
};

/**
 * Determines whether the supplied pointer event matches a configured binding.
 */
export const matchesPointerShortcut = (
  event: PointerLikeEvent,
  binding: PointerShortcutBinding,
): boolean => {
  if (binding.button !== undefined && event.button !== binding.button) {
    return false;
  }

  const pointerTypes = binding.pointerTypes;
  if (pointerTypes && pointerTypes.length > 0) {
    const pointerType = resolvePointerType(event);
    if (!pointerTypes.includes(pointerType as PointerType)) {
      return false;
    }
  }

  const modifiers = binding.modifiers;
  if (modifiers) {
    const modifierKeys = Object.keys(modifiers) as Array<keyof PointerShortcutModifiers>;
    for (const key of modifierKeys) {
      const expected = modifiers[key];
      if (expected === undefined) {
        continue;
      }
      if (!matchesModifier(event, key, expected)) {
        return false;
      }
    }
  }

  const requiredClickCount = binding.clickCount ?? 1;
  if (requiredClickCount > 1) {
    const eventClickCount = event.detail ?? 1;
    if (eventClickCount < requiredClickCount) {
      return false;
    }
  }

  return true;
};

const behaviorFor = (
  pointerShortcuts: PointerShortcutBehavior,
  action: NodeEditorPointerAction,
): PointerShortcutActionBehavior | undefined => {
  return pointerShortcuts.actions[action];
};

/**
 * Returns the binding for the specified pointer shortcut, if available.
 */
export const pointerShortcutBindingFor = (
  pointerShortcuts: PointerShortcutBehavior,
  action: NodeEditorPointerAction,
): PointerShortcutBinding | null => {
  const behavior = behaviorFor(pointerShortcuts, action);
  if (!behavior || behavior.binding === undefined) {
    return null;
  }
  return behavior.binding;
};

/**
 * Determines whether a pointer shortcut is currently enabled (both globally and per-action).
 */
export const isPointerShortcutEnabled = (
  pointerShortcuts: PointerShortcutBehavior,
  action: NodeEditorPointerAction,
): boolean => {
  if (!pointerShortcuts.enabled) {
    return false;
  }
  const behavior = behaviorFor(pointerShortcuts, action);
  if (!behavior) {
    return false;
  }
  return behavior.enabled ?? true;
};

/**
 * Determines whether the given event activates the specified pointer shortcut.
 */
export const isPointerShortcutEvent = (
  pointerShortcuts: PointerShortcutBehavior,
  action: NodeEditorPointerAction,
  event: PointerLikeEvent,
): boolean => {
  if (!isPointerShortcutEnabled(pointerShortcuts, action)) {
    return false;
  }
  const binding = pointerShortcutBindingFor(pointerShortcuts, action);
  if (!binding) {
    return false;
  }
  return matchesPointerShortcut(event, binding);
};

const mouseButtonName = (button: number): string => {
  if (button === 0) {
    return "Left";
  }
  if (button === 1) {
    return "Middle";
  }
  if (button === 2) {
    return "Right";
  }
  return `Button ${button}`;
};

type PointerGesture = "click" | "drag" | "context-menu";

const formatClickQualifier = (binding: PointerShortcutBinding): string | null => {
  const count = binding.clickCount ?? 1;
  if (count <= 1) {
    return null;
  }
  if (count === 2) {
    return "Double";
  }
  if (count === 3) {
    return "Triple";
  }
  return `${count}×`;
};

const pointerActionLabel = (binding: PointerShortcutBinding, gesture: PointerGesture): string => {
  const pointerType = binding.pointerTypes && binding.pointerTypes.length === 1 ? binding.pointerTypes[0] : undefined;
  const clickQualifier = formatClickQualifier(binding);
  const qualifierSuffix = clickQualifier ? ` ${clickQualifier}` : "";
  if (pointerType === "pen") {
    if (gesture === "drag") {
      return "Pen Drag";
    }
    if (gesture === "context-menu") {
      return "Pen Context Menu";
    }
    return `Pen${qualifierSuffix} Tap`.trim();
  }
  if (pointerType === "touch") {
    if (gesture === "drag") {
      return "Touch Drag";
    }
    if (gesture === "context-menu") {
      return "Touch Context Menu";
    }
    return `${clickQualifier ? `${clickQualifier} ` : ""}Tap`.trim();
  }
  const prefix = mouseButtonName(binding.button);
  if (gesture === "drag") {
    return `${prefix} Drag`;
  }
  if (gesture === "context-menu") {
    return `${prefix} Context Menu`;
  }
  return `${prefix}${qualifierSuffix} Click`.trim();
};

const modifierSegments = (binding: PointerShortcutBinding): string[] => {
  return modifierSymbols(binding.modifiers);
};

const modifierSymbols = (modifiers?: PointerShortcutModifiers | null): string[] => {
  if (!modifiers) {
    return [];
  }
  const symbols: string[] = [];
  if (modifiers.cmdOrCtrl) {
    symbols.push("Cmd/Ctrl");
  } else {
    if (modifiers.ctrl) {
      symbols.push("Ctrl");
    }
    if (modifiers.meta) {
      symbols.push("Cmd");
    }
  }
  if (modifiers.shift) {
    symbols.push("Shift");
  }
  if (modifiers.alt) {
    symbols.push("Alt");
  }
  return symbols;
};

export type PointerShortcutFormatOptions = {
  gesture?: PointerGesture;
};

export type PointerShortcutDisplay = {
  modifiers: string[];
  pointerToken: string;
  pointerDisplayType: PointerType | undefined;
  gestureLabel: string | null;
  requireEmptyTarget: boolean;
};

export type PointerShortcutDisplayOptions = {
  gesture?: PointerGesture;
};

const resolvePointerDisplayType = (binding: PointerShortcutBinding): PointerType | undefined => {
  const pointerTypes = binding.pointerTypes;
  if (!pointerTypes || pointerTypes.length === 0) {
    return binding.button !== undefined ? "mouse" : undefined;
  }
  if (pointerTypes.includes("mouse")) {
    return "mouse";
  }
  if (pointerTypes.length === 1) {
    return pointerTypes[0];
  }
  return pointerTypes[0];
};

const pointerTokenFor = (binding: PointerShortcutBinding, pointerType: PointerType | undefined): string => {
  let token: string;
  if (pointerType === "pen") {
    token = "Pen";
  } else if (pointerType === "touch") {
    token = "Touch";
  } else if (binding.button === 1) {
    token = "M";
  } else if (binding.button === 2) {
    token = "R";
  } else if (binding.button !== undefined && binding.button > 2) {
    token = `B${binding.button}`;
  } else {
    token = "L";
  }

  const count = binding.clickCount ?? 1;
  if (count > 1) {
    if (count === 2) {
      return `${token}×2`;
    }
    if (count === 3) {
      return `${token}×3`;
    }
    return `${token}×${count}`;
  }

  return token;
};

const gestureLabelFor = (gesture: PointerGesture, binding: PointerShortcutBinding): string | null => {
  if (gesture === "drag") {
    return "Drag";
  }
  if (gesture === "context-menu") {
    return "Context Menu";
  }
  const qualifier = formatClickQualifier(binding);
  if (!qualifier) {
    return null;
  }
  if (qualifier === "Double") {
    return "Double Click";
  }
  if (qualifier === "Triple") {
    return "Triple Click";
  }
  return `${qualifier} Click`;
};

export const describePointerShortcutDisplay = (
  binding: PointerShortcutBinding,
  options?: PointerShortcutDisplayOptions,
): PointerShortcutDisplay => {
  const pointerType = resolvePointerDisplayType(binding);
  const gesture = options?.gesture ?? "click";
  return {
    modifiers: modifierSymbols(binding.modifiers),
    pointerToken: pointerTokenFor(binding, pointerType),
    pointerDisplayType: pointerType,
    gestureLabel: gestureLabelFor(gesture, binding),
    requireEmptyTarget: binding.requireEmptyTarget ?? false,
  };
};

/**
 * Formats a pointer shortcut binding into a readable label.
 */
export const formatPointerShortcutBinding = (
  binding: PointerShortcutBinding,
  options?: PointerShortcutFormatOptions,
): string => {
  const gesture = options?.gesture ?? "click";
  const segments = modifierSegments(binding);
  segments.push(pointerActionLabel(binding, gesture));
  return segments.join(" + ");
};

export const formatPointerShortcutBindingCompact = (
  binding: PointerShortcutBinding,
  options?: PointerShortcutFormatOptions,
): string => {
  const descriptor = describePointerShortcutDisplay(binding, options);
  const segments = [...descriptor.modifiers, descriptor.pointerToken];
  if (descriptor.gestureLabel) {
    segments.push(descriptor.gestureLabel);
  }
  let label = segments.join(" + ");
  if (descriptor.requireEmptyTarget) {
    label = `${label} ∅`;
  }
  return label;
};

/**
 * Retrieves the formatted label for a pointer shortcut action, respecting enabled state.
 */
export const getPointerShortcutLabelForAction = (
  pointerShortcuts: PointerShortcutBehavior,
  action: NodeEditorPointerAction,
  options?: PointerShortcutFormatOptions,
): string | null => {
  if (!isPointerShortcutEnabled(pointerShortcuts, action)) {
    return null;
  }
  const binding = pointerShortcutBindingFor(pointerShortcuts, action);
  if (!binding) {
    return null;
  }
  return formatPointerShortcutBinding(binding, options);
};
