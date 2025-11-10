/**
 * @file Context for managing global keyboard shortcuts with registration and event handling
 */
import * as React from "react";
import { bindActionCreators, createAction, createActionHandlerMap, type ActionUnion, type BoundActionCreators } from "../utils/typedActions";

// Keyboard shortcut types
export type KeyboardShortcut = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  /**
   * When true, registers both Ctrl (Windows/Linux) and Cmd (Mac) variants
   * Cannot be used together with ctrl or meta
   */
  cmdOrCtrl?: boolean;
};

/**
 * Handler function for keyboard shortcuts
 * @returns false to allow default browser behavior, true or void to prevent default
 */
export type ShortcutHandler = (e: KeyboardEvent) => void | boolean;

export type KeyboardShortcutState = {
  shortcuts: Map<string, ShortcutHandler>;
  isEnabled: boolean;
};

export const keyboardShortcutActions = {
  registerShortcut: createAction(
    "REGISTER_SHORTCUT",
    (shortcut: KeyboardShortcut, handler: ShortcutHandler) => ({ shortcut, handler }),
  ),
  unregisterShortcut: createAction("UNREGISTER_SHORTCUT", (shortcut: KeyboardShortcut) => ({ shortcut })),
  enableShortcuts: createAction("ENABLE_SHORTCUTS"),
  disableShortcuts: createAction("DISABLE_SHORTCUTS"),
} as const;

export type KeyboardShortcutAction = ActionUnion<typeof keyboardShortcutActions>;

// Helper function to create shortcut key
const createShortcutKey = (shortcut: KeyboardShortcut): string => {
  const parts = [];
  if (shortcut.ctrl) {
    parts.push("ctrl");
  }
  if (shortcut.shift) {
    parts.push("shift");
  }
  if (shortcut.alt) {
    parts.push("alt");
  }
  if (shortcut.meta) {
    parts.push("meta");
  }
  parts.push(shortcut.key.toLowerCase());
  return parts.join("+");
};

// Helper function to check if event matches shortcut
const matchesShortcut = (event: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    !!event.ctrlKey === !!shortcut.ctrl &&
    !!event.shiftKey === !!shortcut.shift &&
    !!event.altKey === !!shortcut.alt &&
    !!event.metaKey === !!shortcut.meta
  );
};

const keyboardShortcutHandlers = createActionHandlerMap<KeyboardShortcutState, typeof keyboardShortcutActions>(
  keyboardShortcutActions,
  {
    registerShortcut: (state, action) => {
      const key = createShortcutKey(action.payload.shortcut);
      const newShortcuts = new Map(state.shortcuts);
      newShortcuts.set(key, action.payload.handler);
      return {
        ...state,
        shortcuts: newShortcuts,
      };
    },
    unregisterShortcut: (state, action) => {
      const key = createShortcutKey(action.payload.shortcut);
      const newShortcuts = new Map(state.shortcuts);
      newShortcuts.delete(key);
      return {
        ...state,
        shortcuts: newShortcuts,
      };
    },
    enableShortcuts: (state) => ({
      ...state,
      isEnabled: true,
    }),
    disableShortcuts: (state) => ({
      ...state,
      isEnabled: false,
    }),
  },
);

// Keyboard shortcut reducer
export const keyboardShortcutReducer = (
  state: KeyboardShortcutState,
  action: KeyboardShortcutAction,
): KeyboardShortcutState => {
  const handler = keyboardShortcutHandlers[action.type];
  if (!handler) {
    return state;
  }
  return handler(state, action, undefined);
};

// Default state
export const defaultKeyboardShortcutState: KeyboardShortcutState = {
  shortcuts: new Map(),
  isEnabled: true,
};

// Context
export type KeyboardShortcutContextValue = {
  state: KeyboardShortcutState;
  dispatch: React.Dispatch<KeyboardShortcutAction>;
  actions: BoundActionCreators<typeof keyboardShortcutActions>;
  actionCreators: typeof keyboardShortcutActions;
  registerShortcut: (shortcut: KeyboardShortcut, handler: ShortcutHandler) => void;
  unregisterShortcut: (shortcut: KeyboardShortcut) => void;
};

export const KeyboardShortcutContext = React.createContext<KeyboardShortcutContextValue | null>(null);

// Provider
export type KeyboardShortcutProviderProps = {
  children: React.ReactNode;
  initialState?: Partial<KeyboardShortcutState>;
};

export const KeyboardShortcutProvider: React.FC<KeyboardShortcutProviderProps> = ({ children, initialState }) => {
  const [state, dispatch] = React.useReducer(keyboardShortcutReducer, {
    ...defaultKeyboardShortcutState,
    ...initialState,
  });
  const boundActions = React.useMemo(() => bindActionCreators(keyboardShortcutActions, dispatch), [dispatch]);

  // Global keyboard event handler
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!state.isEnabled) {
        return;
      }

      // Don't handle shortcuts when focused on input elements
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Check all registered shortcuts
      for (const [key, handler] of state.shortcuts) {
        const shortcutParts = key.split("+");
        const shortcutKey = shortcutParts[shortcutParts.length - 1];
        const modifiers = shortcutParts.slice(0, -1);

        const shortcut: KeyboardShortcut = {
          key: shortcutKey,
          ctrl: modifiers.includes("ctrl"),
          shift: modifiers.includes("shift"),
          alt: modifiers.includes("alt"),
          meta: modifiers.includes("meta"),
        };

        if (matchesShortcut(event, shortcut)) {
          const result = handler(event);
          // Only prevent default if handler didn't explicitly return false
          if (result !== false) {
            event.preventDefault();
            event.stopPropagation();
          }
          break; // Handle only the first matching shortcut
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state.shortcuts, state.isEnabled]);

  // Convenience methods
  const registerShortcut = React.useCallback(
    (shortcut: KeyboardShortcut, handler: ShortcutHandler) => {
      boundActions.registerShortcut(shortcut, handler);
    },
    [boundActions],
  );

  const unregisterShortcut = React.useCallback(
    (shortcut: KeyboardShortcut) => {
      boundActions.unregisterShortcut(shortcut);
    },
    [boundActions],
  );

  const contextValue: KeyboardShortcutContextValue = {
    state,
    dispatch,
    actions: boundActions,
    actionCreators: keyboardShortcutActions,
    registerShortcut,
    unregisterShortcut,
  };

  return <KeyboardShortcutContext.Provider value={contextValue}>{children}</KeyboardShortcutContext.Provider>;
};

// Hook
export const useKeyboardShortcut = (): KeyboardShortcutContextValue => {
  const context = React.useContext(KeyboardShortcutContext);
  if (!context) {
    throw new Error("useKeyboardShortcut must be used within a KeyboardShortcutProvider");
  }
  return context;
};

// Hook for registering shortcuts with automatic cleanup
export const useRegisterShortcut = (
  shortcut: KeyboardShortcut,
  handler: ShortcutHandler,
  deps: React.DependencyList = [],
) => {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcut();

  React.useEffect(() => {
    // Validate that cmdOrCtrl is not used with ctrl or meta
    if (shortcut.cmdOrCtrl && (shortcut.ctrl || shortcut.meta)) {
      console.warn("cmdOrCtrl cannot be used together with ctrl or meta. Using cmdOrCtrl only.");
    }

    // If cmdOrCtrl is specified, register both Ctrl and Meta variants
    if (shortcut.cmdOrCtrl) {
      const ctrlShortcut: KeyboardShortcut = {
        ...shortcut,
        ctrl: true,
        meta: false,
        cmdOrCtrl: false,
      };
      const metaShortcut: KeyboardShortcut = {
        ...shortcut,
        ctrl: false,
        meta: true,
        cmdOrCtrl: false,
      };

      registerShortcut(ctrlShortcut, handler);
      registerShortcut(metaShortcut, handler);

      return () => {
        unregisterShortcut(ctrlShortcut);
        unregisterShortcut(metaShortcut);
      };
    } else {
      // Normal registration
      registerShortcut(shortcut, handler);
      return () => unregisterShortcut(shortcut);
    }
  }, [registerShortcut, unregisterShortcut, ...deps]);
};
