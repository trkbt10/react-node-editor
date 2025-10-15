/**
 * @file Utilities for formatting shortcut bindings for display.
 */
import type {
  KeyboardShortcutBehavior,
  NodeEditorShortcutAction,
  ShortcutBinding,
} from "../types/interaction";

export type ShortcutDisplayPlatform = "mac" | "windows";

/**
 * Detects the current platform for shortcut rendering.
 */
export const detectShortcutDisplayPlatform = (): ShortcutDisplayPlatform => {
  if (typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform)) {
    return "mac";
  }
  return "windows";
};

const MAC_MODIFIER_SYMBOLS: Record<"ctrl" | "shift" | "alt" | "meta", string> = {
  ctrl: "⌃",
  shift: "⇧",
  alt: "⌥",
  meta: "⌘",
};

const WINDOWS_MODIFIER_LABELS: Record<"ctrl" | "shift" | "alt" | "meta", string> = {
  ctrl: "Ctrl",
  shift: "Shift",
  alt: "Alt",
  meta: "Win",
};

const MAC_KEY_ALIASES: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Escape: "⎋",
  Enter: "↩",
  Return: "↩",
  Backspace: "⌫",
  Delete: "⌦",
  Space: "Space",
};

const WINDOWS_KEY_ALIASES: Record<string, string> = {
  ArrowUp: "Arrow Up",
  ArrowDown: "Arrow Down",
  ArrowLeft: "Arrow Left",
  ArrowRight: "Arrow Right",
  Escape: "Esc",
  Enter: "Enter",
  Return: "Enter",
  Backspace: "Backspace",
  Delete: "Delete",
  Space: "Space",
};

const normalizeKey = (key: string, platform: ShortcutDisplayPlatform): string => {
  if (platform === "mac") {
    return MAC_KEY_ALIASES[key] ?? (key.length === 1 ? key.toUpperCase() : key);
  }
  return WINDOWS_KEY_ALIASES[key] ?? (key.length === 1 ? key.toUpperCase() : key);
};

const appendModifierSegments = (
  segments: string[],
  binding: ShortcutBinding,
  platform: ShortcutDisplayPlatform,
): void => {
  if (platform === "mac") {
    if (binding.cmdOrCtrl) {
      segments.push(MAC_MODIFIER_SYMBOLS.meta);
    } else {
      if (binding.ctrl) {
        segments.push(MAC_MODIFIER_SYMBOLS.ctrl);
      }
      if (binding.meta) {
        segments.push(MAC_MODIFIER_SYMBOLS.meta);
      }
    }
    if (binding.shift) {
      segments.push(MAC_MODIFIER_SYMBOLS.shift);
    }
    if (binding.alt) {
      segments.push(MAC_MODIFIER_SYMBOLS.alt);
    }
  } else {
    const labels: string[] = [];
    if (binding.cmdOrCtrl) {
      labels.push(WINDOWS_MODIFIER_LABELS.ctrl);
    } else {
      if (binding.ctrl) {
        labels.push(WINDOWS_MODIFIER_LABELS.ctrl);
      }
      if (binding.meta) {
        labels.push(WINDOWS_MODIFIER_LABELS.meta);
      }
    }
    if (binding.shift) {
      labels.push(WINDOWS_MODIFIER_LABELS.shift);
    }
    if (binding.alt) {
      labels.push(WINDOWS_MODIFIER_LABELS.alt);
    }
    segments.push(...labels);
  }
};

/**
 * Formats a shortcut binding into a platform-appropriate label.
 */
export const formatShortcutBinding = (binding: ShortcutBinding, platform: ShortcutDisplayPlatform): string => {
  const segments: string[] = [];
  appendModifierSegments(segments, binding, platform);
  const keyLabel = normalizeKey(binding.key, platform);
  if (platform === "mac") {
    return `${segments.join("")}${keyLabel}`;
  }
  return [...segments, keyLabel].join("+");
};

/**
 * Returns the primary shortcut label for a given action, if available.
 */
export const getShortcutLabelForAction = (
  shortcuts: KeyboardShortcutBehavior,
  action: NodeEditorShortcutAction,
  platform: ShortcutDisplayPlatform,
): string | null => {
  if (!shortcuts.enabled) {
    return null;
  }
  const behavior = shortcuts.actions[action];
  if (behavior && behavior.enabled === false) {
    return null;
  }
  const binding = behavior?.bindings?.[0];
  if (!binding) {
    return null;
  }
  return formatShortcutBinding(binding, platform);
};
