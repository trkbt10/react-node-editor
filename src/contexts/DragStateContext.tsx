/**
 * @file Context for managing node drag state during drag operations
 */
import * as React from "react";
import type { NodeId, Position } from "../types/core";

export type DragState = {
  nodeIds: NodeId[];
  startPosition: Position;
  offset: Position;
  initialPositions: Record<NodeId, Position>;
  affectedChildNodes: Record<NodeId, NodeId[]>;
};

// Context types
export type DragStateActionsValue = {
  startDrag: (
    nodeIds: NodeId[],
    startPosition: Position,
    initialPositions: Record<NodeId, Position>,
    affectedChildNodes: Record<NodeId, NodeId[]>,
  ) => void;
  updateDrag: (offset: Position) => void;
  endDrag: () => void;
};

export type DragStateContextValue = DragStateActionsValue & {
  dragState: DragState | null;
};

// Split contexts for performance optimization
const DragStateStateContext = React.createContext<DragState | null>(null);
DragStateStateContext.displayName = "DragStateStateContext";

const DragStateActionsContext = React.createContext<DragStateActionsValue | null>(null);
DragStateActionsContext.displayName = "DragStateActionsContext";

// Combined context for backward compatibility
const DragStateContext = React.createContext<DragStateContextValue | null>(null);
DragStateContext.displayName = "DragStateContext";

export const DragStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dragState, setDragState] = React.useState<DragState | null>(null);

  // Stable actions value - these functions don't depend on dragState
  const actionsValue = React.useMemo<DragStateActionsValue>(() => {
    const startDrag = (
      nodeIds: NodeId[],
      startPosition: Position,
      initialPositions: Record<NodeId, Position>,
      affectedChildNodes: Record<NodeId, NodeId[]>,
    ): void => {
      setDragState({
        nodeIds,
        startPosition,
        offset: { x: 0, y: 0 },
        initialPositions,
        affectedChildNodes,
      });
    };

    const updateDrag = (offset: Position): void => {
      setDragState((prev) => {
        if (!prev) {
          return null;
        }
        return { ...prev, offset };
      });
    };

    const endDrag = (): void => {
      setDragState(null);
    };

    return {
      startDrag,
      updateDrag,
      endDrag,
    };
  }, []);

  // Combined context value for backward compatibility
  const contextValue = React.useMemo<DragStateContextValue>(
    () => ({
      dragState,
      ...actionsValue,
    }),
    [dragState, actionsValue],
  );

  return (
    <DragStateStateContext.Provider value={dragState}>
      <DragStateActionsContext.Provider value={actionsValue}>
        <DragStateContext.Provider value={contextValue}>{children}</DragStateContext.Provider>
      </DragStateActionsContext.Provider>
    </DragStateStateContext.Provider>
  );
};

// Hooks

/**
 * Hook to access only the drag state
 * Use this when you only need to read the current drag state
 * Note: Returns null when not dragging, DragState when dragging
 */
export const useDragStateState = (): DragState | null => {
  const state = React.useContext(DragStateStateContext);
  // Note: null is valid when not within provider OR when not dragging
  // We need to check if we're within a provider
  const context = React.useContext(DragStateContext);
  if (!context) {
    throw new Error("useDragStateState must be used within a DragStateProvider");
  }
  return state;
};

/**
 * Hook to access only the drag state actions
 * Use this when you only need to dispatch actions and don't need to re-render on drag state changes
 * The returned actions have stable references and won't cause re-renders
 */
export const useDragStateActions = (): DragStateActionsValue => {
  const actions = React.useContext(DragStateActionsContext);
  if (!actions) {
    throw new Error("useDragStateActions must be used within a DragStateProvider");
  }
  return actions;
};

/**
 * Hook to access both state and actions (backward compatible)
 * Prefer useDragStateState or useDragStateActions for better performance
 */
export const useDragState = (): DragStateContextValue => {
  const context = React.useContext(DragStateContext);
  if (!context) {
    throw new Error("useDragState must be used within a DragStateProvider");
  }
  return context;
};
