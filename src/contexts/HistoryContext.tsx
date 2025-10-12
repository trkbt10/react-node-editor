/**
 * @file Context for managing undo/redo history with editor state snapshots
 */
import * as React from "react";
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

// History actions
export type HistoryAction =
  | { type: "PUSH_ENTRY"; payload: { action: string; data: NodeEditorData } }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "CLEAR_HISTORY" }
  | { type: "SET_RECORDING"; payload: { isRecording: boolean } }
  | { type: "SET_MAX_ENTRIES"; payload: { maxEntries: number } };

// History reducer
export const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
  switch (action.type) {
    case "PUSH_ENTRY": {
      if (!state.isRecording) {
        return state;
      }

      const { action: actionName, data } = action.payload;

      // Create new entry
      const newEntry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        action: actionName,
        data: JSON.parse(JSON.stringify(data)), // Deep clone
      };

      // Remove any entries after current index (if we're not at the end)
      const truncatedEntries = state.entries.slice(0, state.currentIndex + 1);

      // Add new entry
      const newEntries = [...truncatedEntries, newEntry];

      // Limit to max entries (keep the most recent)
      const limitedEntries = newEntries.slice(-state.maxEntries);

      return {
        ...state,
        entries: limitedEntries,
        currentIndex: limitedEntries.length - 1,
      };
    }

    case "UNDO": {
      if (state.currentIndex <= 0) {
        return state;
      }

      return {
        ...state,
        currentIndex: state.currentIndex - 1,
      };
    }

    case "REDO": {
      if (state.currentIndex >= state.entries.length - 1) {
        return state;
      }

      return {
        ...state,
        currentIndex: state.currentIndex + 1,
      };
    }

    case "CLEAR_HISTORY": {
      return {
        ...state,
        entries: [],
        currentIndex: -1,
      };
    }

    case "SET_RECORDING": {
      return {
        ...state,
        isRecording: action.payload.isRecording,
      };
    }

    case "SET_MAX_ENTRIES": {
      const { maxEntries } = action.payload;
      const limitedEntries = state.entries.slice(-maxEntries);

      return {
        ...state,
        maxEntries,
        entries: limitedEntries,
        currentIndex: Math.min(state.currentIndex, limitedEntries.length - 1),
      };
    }

    default:
      return state;
  }
};

// Default state
export const defaultHistoryState: HistoryState = {
  entries: [],
  currentIndex: -1,
  maxEntries: 50,
  isRecording: true,
};

// Action creators
export const historyActions = {
  pushEntry: (action: string, data: NodeEditorData): HistoryAction => ({
    type: "PUSH_ENTRY",
    payload: { action, data },
  }),
  undo: (): HistoryAction => ({
    type: "UNDO",
  }),
  redo: (): HistoryAction => ({
    type: "REDO",
  }),
  clearHistory: (): HistoryAction => ({
    type: "CLEAR_HISTORY",
  }),
  setRecording: (isRecording: boolean): HistoryAction => ({
    type: "SET_RECORDING",
    payload: { isRecording },
  }),
  setMaxEntries: (maxEntries: number): HistoryAction => ({
    type: "SET_MAX_ENTRIES",
    payload: { maxEntries },
  }),
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
