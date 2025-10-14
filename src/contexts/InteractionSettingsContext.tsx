/**
 * @file React context for configurable editor interaction behavior.
 */
import * as React from "react";
import type {
  KeyboardShortcutActionBehavior,
  NodeEditorInteractionSettings,
  NodeEditorInteractionSettingsPatch,
  NodeEditorShortcutAction,
  PointerType,
  ShortcutBinding,
} from "../types/interaction";

/**
 * Default pointer activators for canvas panning.
 */
const defaultCanvasPanActivators: NodeEditorInteractionSettings["canvasPanActivators"] = [
  {
    pointerTypes: ["mouse"],
    buttons: [1], // Middle mouse button
  },
  {
    pointerTypes: ["touch"],
    buttons: [0],
    requireEmptyTarget: true,
  },
];

/**
 * Default interaction settings applied when no overrides are provided.
 */
const DEFAULT_SHORTCUT_BINDINGS: Record<NodeEditorShortcutAction, ShortcutBinding[]> = {
  "delete-selection": [{ key: "Delete" }, { key: "Backspace" }],
  "select-all": [{ key: "a", cmdOrCtrl: true }],
  "clear-selection": [{ key: "Escape" }],
  "add-node": [{ key: "n", ctrl: true }],
  "duplicate-selection": [{ key: "d", cmdOrCtrl: true }],
  "lock-selection": [{ key: "2", cmdOrCtrl: true }],
  "unlock-all": [{ key: "2", cmdOrCtrl: true, shift: true }],
  save: [{ key: "s", cmdOrCtrl: true }],
  "auto-layout": [{ key: "l", ctrl: true }],
  undo: [{ key: "z", cmdOrCtrl: true }],
  redo: [
    { key: "z", cmdOrCtrl: true, shift: true },
    { key: "y", cmdOrCtrl: true },
  ],
  copy: [{ key: "c", cmdOrCtrl: true }],
  cut: [{ key: "x", cmdOrCtrl: true }],
  paste: [{ key: "v", cmdOrCtrl: true }],
};

export const defaultInteractionSettings: NodeEditorInteractionSettings = {
  canvasPanActivators: defaultCanvasPanActivators,
  pinchZoom: {
    enabled: true,
    pointerTypes: ["touch"],
    minDistance: 16,
  },
  contextMenu: {},
  keyboardShortcuts: {
    enabled: true,
    actions: Object.entries(DEFAULT_SHORTCUT_BINDINGS).reduce(
      (acc, [action, bindings]) => {
        acc[action as NodeEditorShortcutAction] = {
          enabled: true,
          bindings,
        };
        return acc;
      },
      {} as Record<NodeEditorShortcutAction, KeyboardShortcutActionBehavior>,
    ),
  },
};

const InteractionSettingsContext = React.createContext<NodeEditorInteractionSettings>(defaultInteractionSettings);

export type InteractionSettingsProviderProps = {
  children: React.ReactNode;
  value?: NodeEditorInteractionSettingsPatch;
};

/**
 * Provides interaction settings to downstream components, merging overrides with defaults.
 */
export const InteractionSettingsProvider: React.FC<InteractionSettingsProviderProps> = ({ children, value }) => {
  const mergedSettings = React.useMemo<NodeEditorInteractionSettings>(() => {
    const pinchZoomOverrides = value?.pinchZoom ?? {};
    const contextMenuOverrides = value?.contextMenu ?? {};

    return {
      canvasPanActivators: value?.canvasPanActivators ?? defaultInteractionSettings.canvasPanActivators,
      pinchZoom: {
        ...defaultInteractionSettings.pinchZoom,
        ...pinchZoomOverrides,
        pointerTypes: pinchingPointerTypes(defaultInteractionSettings.pinchZoom.pointerTypes, pinchZoomOverrides),
      },
      contextMenu: {
        ...defaultInteractionSettings.contextMenu,
        ...contextMenuOverrides,
      },
      keyboardShortcuts: mergeKeyboardShortcuts(value?.keyboardShortcuts),
    };
  }, [value]);

  return <InteractionSettingsContext.Provider value={mergedSettings}>{children}</InteractionSettingsContext.Provider>;
};

/**
 * Hook to access interaction settings within the editor.
 */
export const useInteractionSettings = (): NodeEditorInteractionSettings => {
  return React.useContext(InteractionSettingsContext);
};

/**
 * Merge helper that preserves default pointer types when overrides omit them.
 */
const pinchingPointerTypes = (
  defaults: PointerType[],
  overrides: Partial<NodeEditorInteractionSettings["pinchZoom"]>,
): PointerType[] => {
  if (!overrides.pointerTypes || overrides.pointerTypes.length === 0) {
    return defaults;
  }
  return overrides.pointerTypes;
};

const mergeKeyboardShortcuts = (
  overrides: NodeEditorInteractionSettingsPatch["keyboardShortcuts"],
): NodeEditorInteractionSettings["keyboardShortcuts"] => {
  const base = defaultInteractionSettings.keyboardShortcuts;
  const actionOverrides = overrides?.actions ?? {};
  const mergedActions: Record<NodeEditorShortcutAction, KeyboardShortcutActionBehavior> = {} as Record<
    NodeEditorShortcutAction,
    KeyboardShortcutActionBehavior
  >;

  const actionKeys = new Set<NodeEditorShortcutAction>([
    ...(Object.keys(base.actions) as NodeEditorShortcutAction[]),
    ...(Object.keys(actionOverrides) as NodeEditorShortcutAction[]),
  ]);

  actionKeys.forEach((action) => {
    const baseBehavior = base.actions[action] ?? { enabled: true, bindings: DEFAULT_SHORTCUT_BINDINGS[action] ?? [] };
    const overrideBehavior = actionOverrides[action];
    mergedActions[action] = {
      enabled: overrideBehavior?.enabled ?? baseBehavior.enabled ?? true,
      bindings: overrideBehavior?.bindings ?? baseBehavior.bindings ?? [],
    };
  });

  return {
    enabled: overrides?.enabled ?? base.enabled,
    actions: mergedActions,
  };
};
