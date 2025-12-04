/**
 * @file React context for configurable editor interaction behavior.
 */
import * as React from "react";
import type {
  CanvasPanActivator,
  KeyboardShortcutActionBehavior,
  ModifierConditions,
  NodeEditorInteractionSettings,
  NodeEditorInteractionSettingsPatch,
  NodeEditorPointerAction,
  NodeEditorShortcutAction,
  PointerShortcutActionBehavior,
  PointerShortcutBinding,
  PointerType,
  ShortcutBinding,
} from "../../types/interaction";
import { pointerShortcutBindingFor } from "../../utils/pointerShortcuts";

/**
 * Default interaction settings applied when no overrides are provided.
 */
const DEFAULT_SHORTCUT_BINDINGS: Record<NodeEditorShortcutAction, ShortcutBinding[]> = {
  "delete-selection": [{ key: "Delete" }, { key: "Backspace" }],
  "select-all": [{ key: "a", cmdOrCtrl: true }],
  "clear-selection": [{ key: "Escape" }],
  "add-node": [{ key: "n", ctrl: true }],
  "duplicate-selection": [{ key: "d", cmdOrCtrl: true }],
  "group-selection": [{ key: "g", cmdOrCtrl: true }],
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

const DEFAULT_POINTER_BINDINGS: Record<NodeEditorPointerAction, PointerShortcutBinding> = {
  "canvas-clear-selection": {
    button: 0,
    pointerTypes: ["mouse", "pen", "touch"],
  },
  "canvas-range-select": {
    button: 0,
    pointerTypes: ["mouse", "pen", "touch"],
    modifiers: { shift: true },
  },
  "canvas-pan": {
    button: 0,
    pointerTypes: ["mouse", "touch"],
    requireEmptyTarget: true,
  },
  "node-select": {
    button: 0,
    pointerTypes: ["mouse", "pen", "touch"],
  },
  "node-add-to-selection": {
    button: 0,
    pointerTypes: ["mouse", "pen", "touch"],
    modifiers: { shift: true },
  },
  "node-open-context-menu": {
    button: 2,
    pointerTypes: ["mouse"],
  },
  "canvas-open-context-menu": {
    button: 2,
    pointerTypes: ["mouse"],
  },
};

const createDefaultKeyboardShortcuts = (): NodeEditorInteractionSettings["keyboardShortcuts"] => {
  const entries = Object.entries(DEFAULT_SHORTCUT_BINDINGS) as Array<[NodeEditorShortcutAction, ShortcutBinding[]]>;
  const actions = entries.reduce<Record<NodeEditorShortcutAction, KeyboardShortcutActionBehavior>>(
    (acc, [action, bindings]) => {
      acc[action] = {
        enabled: true,
        bindings: bindings.map((binding) => ({ ...binding })),
      };
      return acc;
    },
    {} as Record<NodeEditorShortcutAction, KeyboardShortcutActionBehavior>,
  );
  return {
    enabled: true,
    actions,
  };
};

const createDefaultPointerShortcuts = (): NodeEditorInteractionSettings["pointerShortcuts"] => {
  const entries = Object.entries(DEFAULT_POINTER_BINDINGS) as Array<[NodeEditorPointerAction, PointerShortcutBinding]>;
  const actions = entries.reduce<Record<NodeEditorPointerAction, PointerShortcutActionBehavior>>(
    (acc, [action, binding]) => {
      acc[action] = {
        enabled: true,
        binding: { ...binding, pointerTypes: binding.pointerTypes ? [...binding.pointerTypes] : undefined },
      };
      return acc;
    },
    {} as Record<NodeEditorPointerAction, PointerShortcutActionBehavior>,
  );
  return {
    enabled: true,
    actions,
  };
};

const pointerModifiersToConditions = (
  modifiers?: PointerShortcutBinding["modifiers"],
): ModifierConditions | undefined => {
  if (!modifiers) {
    return undefined;
  }
  const conditions: ModifierConditions = {};
  if (modifiers.ctrl !== undefined) {
    conditions.ctrlKey = modifiers.ctrl;
  }
  if (modifiers.shift !== undefined) {
    conditions.shiftKey = modifiers.shift;
  }
  if (modifiers.alt !== undefined) {
    conditions.altKey = modifiers.alt;
  }
  if (modifiers.meta !== undefined) {
    conditions.metaKey = modifiers.meta;
  }
  return Object.keys(conditions).length > 0 ? conditions : undefined;
};

const bindingToCanvasPanActivators = (binding: PointerShortcutBinding | null | undefined): CanvasPanActivator[] => {
  if (!binding) {
    return [
      {
        pointerTypes: ["mouse"],
        buttons: [1],
        requireEmptyTarget: true,
      },
    ];
  }
  const pointerTypes =
    binding.pointerTypes && binding.pointerTypes.length > 0 ? [...binding.pointerTypes] : (["mouse"] as PointerType[]);
  const buttons = binding.button !== undefined ? [binding.button] : undefined;
  return [
    {
      pointerTypes,
      buttons,
      modifiers: pointerModifiersToConditions(binding.modifiers),
      requireEmptyTarget: binding.requireEmptyTarget ?? false,
    },
  ];
};

const deriveCanvasPanActivatorsFromShortcuts = (
  shortcuts: NodeEditorInteractionSettings["pointerShortcuts"],
): CanvasPanActivator[] => {
  const binding = pointerShortcutBindingFor(shortcuts, "canvas-pan");
  return bindingToCanvasPanActivators(binding);
};

const defaultPointerShortcuts = createDefaultPointerShortcuts();

export const defaultInteractionSettings: NodeEditorInteractionSettings = {
  canvasPanActivators: deriveCanvasPanActivatorsFromShortcuts(defaultPointerShortcuts),
  pinchZoom: {
    enabled: true,
    pointerTypes: ["touch"],
    minDistance: 16,
  },
  contextMenu: {},
  keyboardShortcuts: createDefaultKeyboardShortcuts(),
  pointerShortcuts: defaultPointerShortcuts,
};

const InteractionSettingsContext = React.createContext<NodeEditorInteractionSettings>(defaultInteractionSettings);
InteractionSettingsContext.displayName = "InteractionSettingsContext";

export type InteractionSettingsUpdateContextValue = {
  setKeyboardShortcutBindings: (action: NodeEditorShortcutAction, bindings: ShortcutBinding[]) => void;
  resetKeyboardShortcut: (action: NodeEditorShortcutAction) => void;
  setPointerShortcutBinding: (action: NodeEditorPointerAction, binding: PointerShortcutBinding | null) => void;
  resetPointerShortcut: (action: NodeEditorPointerAction) => void;
};

const InteractionSettingsUpdateContext = React.createContext<InteractionSettingsUpdateContextValue | null>(null);
InteractionSettingsUpdateContext.displayName = "InteractionSettingsUpdateContext";

export type InteractionSettingsProviderProps = {
  children: React.ReactNode;
  value?: NodeEditorInteractionSettingsPatch;
};

/**
 * Provides interaction settings to downstream components, merging overrides with defaults.
 */
export const InteractionSettingsProvider: React.FC<InteractionSettingsProviderProps> = ({ children, value }) => {
  const [keyboardOverrides, setKeyboardOverrides] = React.useState<
    Partial<Record<NodeEditorShortcutAction, KeyboardShortcutActionBehavior>>
  >(() => ({}));
  const [pointerOverrides, setPointerOverrides] = React.useState<
    Partial<Record<NodeEditorPointerAction, PointerShortcutActionBehavior>>
  >(() => ({}));

  const baseSettings = React.useMemo<NodeEditorInteractionSettings>(() => {
    return applyInteractionPatch(defaultInteractionSettings, value);
  }, [value]);

  const mergedSettings = React.useMemo<NodeEditorInteractionSettings>(() => {
    const keyboardPatch =
      Object.keys(keyboardOverrides).length > 0
        ? ({ actions: keyboardOverrides } as NodeEditorInteractionSettingsPatch["keyboardShortcuts"])
        : undefined;
    const pointerPatch =
      Object.keys(pointerOverrides).length > 0
        ? ({ actions: pointerOverrides } as NodeEditorInteractionSettingsPatch["pointerShortcuts"])
        : undefined;
    return applyInteractionPatch(baseSettings, {
      keyboardShortcuts: keyboardPatch,
      pointerShortcuts: pointerPatch,
    });
  }, [baseSettings, keyboardOverrides, pointerOverrides]);

  const setKeyboardShortcutBindings = React.useCallback(
    (action: NodeEditorShortcutAction, bindings: ShortcutBinding[]) => {
      setKeyboardOverrides((prev) => ({
        ...prev,
        [action]: {
          enabled: prev[action]?.enabled ?? true,
          bindings,
        },
      }));
    },
    [],
  );

  const resetKeyboardShortcut = React.useCallback((action: NodeEditorShortcutAction) => {
    setKeyboardOverrides((prev) => {
      if (!prev[action]) {
        return prev;
      }
      const { [action]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const setPointerShortcutBinding = React.useCallback(
    (action: NodeEditorPointerAction, binding: PointerShortcutBinding | null) => {
      setPointerOverrides((prev) => {
        if (!binding) {
          if (!prev[action]) {
            return prev;
          }
          const { [action]: _removed, ...rest } = prev;
          return rest;
        }
        return {
          ...prev,
          [action]: {
            enabled: prev[action]?.enabled ?? true,
            binding,
          },
        };
      });
    },
    [],
  );

  const resetPointerShortcut = React.useCallback((action: NodeEditorPointerAction) => {
    setPointerOverrides((prev) => {
      if (!prev[action]) {
        return prev;
      }
      const { [action]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const updateValue = React.useMemo<InteractionSettingsUpdateContextValue>(
    () => ({
      setKeyboardShortcutBindings,
      resetKeyboardShortcut,
      setPointerShortcutBinding,
      resetPointerShortcut,
    }),
    [setKeyboardShortcutBindings, resetKeyboardShortcut, setPointerShortcutBinding, resetPointerShortcut],
  );

  return (
    <InteractionSettingsContext.Provider value={mergedSettings}>
      <InteractionSettingsUpdateContext.Provider value={updateValue}>
        {children}
      </InteractionSettingsUpdateContext.Provider>
    </InteractionSettingsContext.Provider>
  );
};

/**
 * Hook to access interaction settings within the editor.
 */
export const useInteractionSettings = (): NodeEditorInteractionSettings => {
  return React.useContext(InteractionSettingsContext);
};

/**
 * Hook providing mutation helpers for interaction settings.
 */
export const useInteractionSettingsUpdate = (): InteractionSettingsUpdateContextValue => {
  const context = React.useContext(InteractionSettingsUpdateContext);
  if (!context) {
    throw new Error("useInteractionSettingsUpdate must be used within an InteractionSettingsProvider");
  }
  return context;
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
  base: NodeEditorInteractionSettings["keyboardShortcuts"],
  overrides?: NodeEditorInteractionSettingsPatch["keyboardShortcuts"],
): NodeEditorInteractionSettings["keyboardShortcuts"] => {
  const baseActions = base.actions;
  if (!overrides) {
    const clonedActions: Record<NodeEditorShortcutAction, KeyboardShortcutActionBehavior> = {} as Record<
      NodeEditorShortcutAction,
      KeyboardShortcutActionBehavior
    >;
    (Object.keys(baseActions) as NodeEditorShortcutAction[]).forEach((action) => {
      const baseBehavior = baseActions[action];
      if (!baseBehavior) {
        clonedActions[action] = {
          enabled: true,
          bindings: DEFAULT_SHORTCUT_BINDINGS[action]?.map((binding) => ({ ...binding })) ?? [],
        };
        return;
      }
      clonedActions[action] = {
        enabled: baseBehavior.enabled ?? true,
        bindings: baseBehavior.bindings
          ? baseBehavior.bindings.map((binding) => ({ ...binding }))
          : (DEFAULT_SHORTCUT_BINDINGS[action]?.map((binding) => ({ ...binding })) ?? []),
      };
    });
    return {
      enabled: base.enabled,
      actions: clonedActions,
    };
  }
  const actionOverrides = overrides.actions ?? {};
  const actionKeys = new Set<NodeEditorShortcutAction>([
    ...(Object.keys(baseActions) as NodeEditorShortcutAction[]),
    ...(Object.keys(actionOverrides) as NodeEditorShortcutAction[]),
  ]);
  const mergedActions: Record<NodeEditorShortcutAction, KeyboardShortcutActionBehavior> = {} as Record<
    NodeEditorShortcutAction,
    KeyboardShortcutActionBehavior
  >;
  actionKeys.forEach((action) => {
    const baseBehavior =
      baseActions[action] ??
      ({
        enabled: true,
        bindings: DEFAULT_SHORTCUT_BINDINGS[action]?.map((binding) => ({ ...binding })) ?? [],
      } satisfies KeyboardShortcutActionBehavior);
    const overrideBehavior = actionOverrides[action];
    if (!overrideBehavior) {
      mergedActions[action] = {
        enabled: baseBehavior.enabled ?? true,
        bindings: baseBehavior.bindings ? baseBehavior.bindings.map((binding) => ({ ...binding })) : [],
      };
      return;
    }
    mergedActions[action] = {
      enabled: overrideBehavior.enabled ?? baseBehavior.enabled ?? true,
      bindings:
        overrideBehavior.bindings !== undefined
          ? overrideBehavior.bindings
          : baseBehavior.bindings
            ? baseBehavior.bindings.map((binding) => ({ ...binding }))
            : [],
    };
  });
  return {
    enabled: overrides.enabled ?? base.enabled,
    actions: mergedActions,
  };
};

const mergePointerShortcuts = (
  base: NodeEditorInteractionSettings["pointerShortcuts"],
  overrides?: NodeEditorInteractionSettingsPatch["pointerShortcuts"],
): NodeEditorInteractionSettings["pointerShortcuts"] => {
  const baseActions = base.actions;
  if (!overrides) {
    return {
      enabled: base.enabled,
      actions: { ...baseActions },
    };
  }
  const actionOverrides = overrides.actions ?? {};
  const actionKeys = new Set<NodeEditorPointerAction>([
    ...(Object.keys(baseActions) as NodeEditorPointerAction[]),
    ...(Object.keys(actionOverrides) as NodeEditorPointerAction[]),
  ]);
  const mergedActions: Record<NodeEditorPointerAction, PointerShortcutActionBehavior> = {} as Record<
    NodeEditorPointerAction,
    PointerShortcutActionBehavior
  >;
  actionKeys.forEach((action) => {
    const baseBehavior =
      baseActions[action] ??
      ({
        enabled: true,
        binding: DEFAULT_POINTER_BINDINGS[action] ?? null,
      } satisfies PointerShortcutActionBehavior);
    const overrideBehavior = actionOverrides[action];
    if (!overrideBehavior) {
      mergedActions[action] = {
        enabled: baseBehavior.enabled ?? true,
        binding: baseBehavior.binding ? { ...baseBehavior.binding } : null,
      };
      return;
    }
    mergedActions[action] = {
      enabled: overrideBehavior.enabled ?? baseBehavior.enabled ?? true,
      binding:
        overrideBehavior.binding !== undefined
          ? overrideBehavior.binding
          : baseBehavior.binding
            ? { ...baseBehavior.binding }
            : null,
    };
  });
  return {
    enabled: overrides.enabled ?? base.enabled,
    actions: mergedActions,
  };
};

const applyInteractionPatch = (
  base: NodeEditorInteractionSettings,
  patch?: NodeEditorInteractionSettingsPatch,
): NodeEditorInteractionSettings => {
  if (!patch) {
    const keyboardShortcuts = mergeKeyboardShortcuts(base.keyboardShortcuts);
    const pointerShortcuts = mergePointerShortcuts(base.pointerShortcuts);
    return {
      ...base,
      canvasPanActivators: deriveCanvasPanActivatorsFromShortcuts(pointerShortcuts),
      pinchZoom: { ...base.pinchZoom, pointerTypes: [...base.pinchZoom.pointerTypes] },
      contextMenu: { ...base.contextMenu },
      keyboardShortcuts,
      pointerShortcuts,
    };
  }
  const pinchZoomOverrides = patch.pinchZoom ?? {};
  const contextMenuOverrides = patch.contextMenu ?? {};
  const keyboardShortcuts = mergeKeyboardShortcuts(base.keyboardShortcuts, patch.keyboardShortcuts);
  const pointerShortcuts = mergePointerShortcuts(base.pointerShortcuts, patch.pointerShortcuts);
  return {
    ...base,
    canvasPanActivators: deriveCanvasPanActivatorsFromShortcuts(pointerShortcuts),
    pinchZoom: {
      ...base.pinchZoom,
      ...pinchZoomOverrides,
      pointerTypes: pinchingPointerTypes(base.pinchZoom.pointerTypes, pinchZoomOverrides),
    },
    contextMenu: {
      ...base.contextMenu,
      ...contextMenuOverrides,
    },
    keyboardShortcuts,
    pointerShortcuts,
  };
};

/*
debug-notes:
- Added pointer shortcut configuration support; reviewed src/components/node/NodeLayer.tsx and src/components/canvas/SelectionManager.tsx to align event handling with configurable bindings.
*/
