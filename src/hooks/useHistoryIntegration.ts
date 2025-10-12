/**
 * @file History Integration Hook
 * Provides undo/redo functionality integrated with node editor state management
 */
import * as React from "react";
import { useHistory } from "../contexts/HistoryContext";
import { useNodeEditor } from "../contexts/node-editor";
import type { NodeEditorAction } from "../contexts/node-editor/actions";

/**
 * Hook that integrates history tracking with node editor state changes
 */
export const useHistoryIntegration = () => {
  const { state: nodeEditorState, dispatch: nodeEditorDispatch, actions: nodeEditorActions } = useNodeEditor();
  const { pushEntry, undo, redo, canUndo, canRedo } = useHistory();

  // Track previous state to detect changes
  const previousStateRef = React.useRef(nodeEditorState);
  const actionNameRef = React.useRef<string | null>(null);

  // Record state changes in history
  React.useEffect(() => {
    const currentState = nodeEditorState;
    const previousState = previousStateRef.current;

    // Skip if this is the initial state or if states are identical
    if (previousState === currentState || JSON.stringify(previousState) === JSON.stringify(currentState)) {
      return;
    }

    // Push the previous state to history (before the change)
    const actionName = actionNameRef.current || "Unknown Action";
    pushEntry(actionName, previousState);

    // Update reference
    previousStateRef.current = currentState;
    actionNameRef.current = null;
  }, [nodeEditorState, pushEntry]);

  // Enhanced dispatch that records action names
  const dispatchWithHistory = React.useCallback(
    (action: NodeEditorAction) => {
      // Extract action name for history
      if (action && typeof action === "object" && action.type) {
        actionNameRef.current = action.type;
      }

      nodeEditorDispatch(action);
    },
    [nodeEditorDispatch],
  );

  // Undo function that restores previous state
  const performUndo = React.useCallback(() => {
    if (!canUndo) {
      return false;
    }

    const previousEntry = undo();
    if (previousEntry) {
      // Temporarily disable history recording to avoid infinite loop
      actionNameRef.current = null;
      previousStateRef.current = previousEntry.data;

      // Restore the state
      nodeEditorDispatch(nodeEditorActions.restoreState(previousEntry.data));
      return true;
    }
    return false;
  }, [canUndo, undo, nodeEditorDispatch, nodeEditorActions]);

  // Redo function that restores next state
  const performRedo = React.useCallback(() => {
    if (!canRedo) {
      return false;
    }

    const nextEntry = redo();
    if (nextEntry) {
      // Temporarily disable history recording to avoid infinite loop
      actionNameRef.current = null;
      previousStateRef.current = nextEntry.data;

      // Restore the state
      nodeEditorDispatch(nodeEditorActions.restoreState(nextEntry.data));
      return true;
    }
    return false;
  }, [canRedo, redo, nodeEditorDispatch, nodeEditorActions]);

  return {
    dispatchWithHistory,
    performUndo,
    performRedo,
    canUndo,
    canRedo,
  };
};
