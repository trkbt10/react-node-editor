/**
 * @file Context for managing undo/redo history with editor state snapshots
 */
import * as React from "react";
import { bindActionCreators, createAction, createActionHandlerMap, type ActionUnion, type BoundActionCreators } from "../utils/typedActions";
import type { NodeEditorData } from "../types/core";

// History types
export type HistoryEntry = {
  id: string;
  timestamp: number;
  action: string;
  data: NodeEditorData;
};

export type HistoryState = {
  entries: HistoryEntry[];
  currentIndex: number;
  maxEntries: number;
  isRecording: boolean;
};

export const historyActions = {
  pushEntry: createAction("PUSH_ENTRY", (action: string, data: NodeEditorData) => ({ action, data })),
  undo: createAction("UNDO"),
  redo: createAction("REDO"),
  clearHistory: createAction("CLEAR_HISTORY"),
  setRecording: createAction("SET_RECORDING", (isRecording: boolean) => ({ isRecording })),
  setMaxEntries: createAction("SET_MAX_ENTRIES", (maxEntries: number) => ({ maxEntries })),
} as const;

export type HistoryAction = ActionUnion<typeof historyActions>;

// Default state
export const defaultHistoryState: HistoryState = {
  entries: [],
  currentIndex: -1,
  maxEntries: 50,
  isRecording: true,
};

const historyHandlers = createActionHandlerMap<HistoryState, typeof historyActions>(historyActions, {
  pushEntry: (state, action) => {
    if (!state.isRecording) {
      return state;
    }
    const { action: actionName, data } = action.payload;
    const newEntry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      action: actionName,
      data: JSON.parse(JSON.stringify(data)), // Deep clone to preserve snapshot
    };
    const truncatedEntries = state.entries.slice(0, state.currentIndex + 1);
    const newEntries = [...truncatedEntries, newEntry];
    const limitedEntries = newEntries.slice(-state.maxEntries);
    return {
      ...state,
      entries: limitedEntries,
      currentIndex: limitedEntries.length - 1,
    };
  },
  undo: (state) => {
    if (state.currentIndex <= 0) {
      return state;
    }
    return {
      ...state,
      currentIndex: state.currentIndex - 1,
    };
  },
  redo: (state) => {
    if (state.currentIndex >= state.entries.length - 1) {
      return state;
    }
    return {
      ...state,
      currentIndex: state.currentIndex + 1,
    };
  },
  clearHistory: (state) => ({
    ...state,
    entries: [],
    currentIndex: -1,
  }),
  setRecording: (state, action) => ({
    ...state,
    isRecording: action.payload.isRecording,
  }),
  setMaxEntries: (state, action) => {
    const { maxEntries } = action.payload;
    const limitedEntries = state.entries.slice(-maxEntries);
    return {
      ...state,
      maxEntries,
      entries: limitedEntries,
      currentIndex: Math.min(state.currentIndex, limitedEntries.length - 1),
    };
  },
});

// History reducer
export const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
  const handler = historyHandlers[action.type];
  if (!handler) {
    return state;
  }
  return handler(state, action, undefined);
};

// Context types
export type HistoryActionsValue = {
  dispatch: React.Dispatch<HistoryAction>;
  actions: BoundActionCreators<typeof historyActions>;
  actionCreators: typeof historyActions;
  pushEntry: (action: string, data: NodeEditorData) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
};

export type HistoryContextValue = HistoryActionsValue & {
  state: HistoryState;
  canUndo: boolean;
  canRedo: boolean;
  currentEntry: HistoryEntry | null;
};

// Split contexts for performance optimization
const HistoryStateContext = React.createContext<HistoryState | null>(null);
HistoryStateContext.displayName = "HistoryStateContext";

const HistoryActionsContext = React.createContext<HistoryActionsValue | null>(null);
HistoryActionsContext.displayName = "HistoryActionsContext";

// Combined context for backward compatibility
export const HistoryContext = React.createContext<HistoryContextValue | null>(null);
HistoryContext.displayName = "HistoryContext";

// Provider
export type HistoryProviderProps = {
  children: React.ReactNode;
  initialState?: Partial<HistoryState>;
  /** Preferred: pass max entries as a stable prop; internally memo-updated */
  maxEntries?: number;
};

export const HistoryProvider: React.FC<HistoryProviderProps> = ({ children, initialState, maxEntries }) => {
  const [state, dispatch] = React.useReducer(historyReducer, { ...defaultHistoryState, ...initialState });
  const boundActions = React.useMemo(() => bindActionCreators(historyActions, dispatch), [dispatch]);

  // Use ref to provide stable undo/redo functions that always read latest state
  const stateRef = React.useRef(state);
  stateRef.current = state;

  // Apply maxEntries changes via reducer to avoid re-initialization patterns
  React.useEffect(() => {
    if (typeof maxEntries === "number" && maxEntries > 0) {
      boundActions.setMaxEntries(maxEntries);
    }
  }, [maxEntries, boundActions]);

  // Computed values
  const canUndo = state.currentIndex > 0;
  const canRedo = state.currentIndex < state.entries.length - 1;
  const currentEntry = state.currentIndex >= 0 ? state.entries[state.currentIndex] : null;

  // Stable actions value - uses ref to access latest state
  const actionsValue = React.useMemo<HistoryActionsValue>(() => {
    const pushEntry = (action: string, data: NodeEditorData): void => {
      boundActions.pushEntry(action, data);
    };

    const undo = (): HistoryEntry | null => {
      const currentState = stateRef.current;
      if (currentState.currentIndex <= 0) {
        return null;
      }
      const previousEntry = currentState.entries[currentState.currentIndex - 1];
      boundActions.undo();
      return previousEntry || null;
    };

    const redo = (): HistoryEntry | null => {
      const currentState = stateRef.current;
      if (currentState.currentIndex >= currentState.entries.length - 1) {
        return null;
      }
      const nextEntry = currentState.entries[currentState.currentIndex + 1];
      boundActions.redo();
      return nextEntry || null;
    };

    return {
      dispatch,
      actions: boundActions,
      actionCreators: historyActions,
      pushEntry,
      undo,
      redo,
    };
  }, [dispatch, boundActions]);

  // Combined context value for backward compatibility
  const contextValue = React.useMemo<HistoryContextValue>(
    () => ({
      state,
      canUndo,
      canRedo,
      currentEntry,
      ...actionsValue,
    }),
    [state, canUndo, canRedo, currentEntry, actionsValue],
  );

  return (
    <HistoryStateContext.Provider value={state}>
      <HistoryActionsContext.Provider value={actionsValue}>
        <HistoryContext.Provider value={contextValue}>{children}</HistoryContext.Provider>
      </HistoryActionsContext.Provider>
    </HistoryStateContext.Provider>
  );
};

// Hooks

/**
 * Hook to access only the history state
 * Use this when you only need to read state and don't need actions
 */
export const useHistoryState = (): HistoryState => {
  const state = React.useContext(HistoryStateContext);
  if (!state) {
    throw new Error("useHistoryState must be used within a HistoryProvider");
  }
  return state;
};

/**
 * Hook to access only the history actions
 * Use this when you only need to dispatch actions and don't need to re-render on state changes
 * The returned actions have stable references and won't cause re-renders
 */
export const useHistoryActions = (): HistoryActionsValue => {
  const actions = React.useContext(HistoryActionsContext);
  if (!actions) {
    throw new Error("useHistoryActions must be used within a HistoryProvider");
  }
  return actions;
};

/**
 * Hook to access both state and actions (backward compatible)
 * Prefer useHistoryState or useHistoryActions for better performance
 */
export const useHistory = (): HistoryContextValue => {
  const context = React.useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
};
