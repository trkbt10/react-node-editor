/**
 * @file Context for managing undo/redo history with editor state snapshots
 */
import * as React from "react";
import { createAction, createActionHandlerMap, type ActionUnion } from "../utils/typedActions";
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

// Context
export type HistoryContextValue = {
  state: HistoryState;
  dispatch: React.Dispatch<HistoryAction>;
  actions: typeof historyActions;
  canUndo: boolean;
  canRedo: boolean;
  currentEntry: HistoryEntry | null;
  pushEntry: (action: string, data: NodeEditorData) => void;
  undo: () => HistoryEntry | null;
  redo: () => HistoryEntry | null;
};

export const HistoryContext = React.createContext<HistoryContextValue | null>(null);

// Provider
export type HistoryProviderProps = {
  children: React.ReactNode;
  initialState?: Partial<HistoryState>;
  /** Preferred: pass max entries as a stable prop; internally memo-updated */
  maxEntries?: number;
};

export const HistoryProvider: React.FC<HistoryProviderProps> = ({ children, initialState, maxEntries }) => {
  const [state, dispatch] = React.useReducer(historyReducer, { ...defaultHistoryState, ...initialState });

  // Apply maxEntries changes via reducer to avoid re-initialization patterns
  React.useEffect(() => {
    if (typeof maxEntries === "number" && maxEntries > 0) {
      dispatch(historyActions.setMaxEntries(maxEntries));
    }
  }, [maxEntries]);

  // Computed values
  const canUndo = state.currentIndex > 0;
  const canRedo = state.currentIndex < state.entries.length - 1;
  const currentEntry = state.currentIndex >= 0 ? state.entries[state.currentIndex] : null;

  // Convenience methods
  const pushEntry = React.useCallback(
    (action: string, data: NodeEditorData) => {
      dispatch(historyActions.pushEntry(action, data));
    },
    [dispatch],
  );

  const undo = React.useCallback((): HistoryEntry | null => {
    if (!canUndo) {
      return null;
    }

    dispatch(historyActions.undo());
    const previousEntry = state.entries[state.currentIndex - 1];
    return previousEntry || null;
  }, [canUndo, state.entries, state.currentIndex, dispatch]);

  const redo = React.useCallback((): HistoryEntry | null => {
    if (!canRedo) {
      return null;
    }

    dispatch(historyActions.redo());
    const nextEntry = state.entries[state.currentIndex + 1];
    return nextEntry || null;
  }, [canRedo, state.entries, state.currentIndex, dispatch]);

  const contextValue: HistoryContextValue = React.useMemo(
    () => ({
      state,
      dispatch,
      actions: historyActions,
      canUndo,
      canRedo,
      currentEntry,
      pushEntry,
      undo,
      redo,
    }),
    [state, dispatch, canUndo, canRedo, currentEntry, pushEntry, undo, redo],
  );

  return <HistoryContext.Provider value={contextValue}>{children}</HistoryContext.Provider>;
};

// Hook
export const useHistory = (): HistoryContextValue => {
  const context = React.useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
};
