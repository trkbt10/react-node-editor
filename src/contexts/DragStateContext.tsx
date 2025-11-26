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

export type DragStateContextValue = {
  dragState: DragState | null;
  startDrag: (
    nodeIds: NodeId[],
    startPosition: Position,
    initialPositions: Record<NodeId, Position>,
    affectedChildNodes: Record<NodeId, NodeId[]>,
  ) => void;
  updateDrag: (offset: Position) => void;
  endDrag: () => void;
};

const DragStateContext = React.createContext<DragStateContextValue | null>(null);
DragStateContext.displayName = "DragStateContext";

export const DragStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dragState, setDragState] = React.useState<DragState | null>(null);

  const startDrag = React.useCallback(
    (
      nodeIds: NodeId[],
      startPosition: Position,
      initialPositions: Record<NodeId, Position>,
      affectedChildNodes: Record<NodeId, NodeId[]>,
    ) => {
      setDragState({
        nodeIds,
        startPosition,
        offset: { x: 0, y: 0 },
        initialPositions,
        affectedChildNodes,
      });
    },
    [],
  );

  const updateDrag = React.useCallback((offset: Position) => {
    setDragState((prev) => {
      if (!prev) {
        return null;
      }
      return { ...prev, offset };
    });
  }, []);

  const endDrag = React.useCallback(() => {
    setDragState(null);
  }, []);

  const value = React.useMemo(
    () => ({
      dragState,
      startDrag,
      updateDrag,
      endDrag,
    }),
    [dragState, startDrag, updateDrag, endDrag],
  );

  return <DragStateContext.Provider value={value}>{children}</DragStateContext.Provider>;
};

export const useDragState = (): DragStateContextValue => {
  const context = React.useContext(DragStateContext);
  if (!context) {
    throw new Error("useDragState must be used within a DragStateProvider");
  }
  return context;
};
