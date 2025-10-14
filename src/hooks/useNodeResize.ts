/**
 * @file Hook for managing node resize operations with grid snapping support
 */
import * as React from "react";
import { useNodeEditor } from "../contexts/node-editor/context";
import { useEditorActionState } from "../contexts/EditorActionStateContext";

export type UseNodeResizeOptions = {
  /** Minimum width for nodes */
  minWidth?: number;
  /** Minimum height for nodes */
  minHeight?: number;
  /** Whether to enable grid snapping during resize */
  snapToGrid?: boolean;
  /** Grid size for snapping */
  gridSize?: number;
};

export type UseNodeResizeResult = {
  /** Start resizing a node - only 'se' (bottom-right) is supported */
  startResize: (
    nodeId: string,
    handle: "se",
    startPosition: { x: number; y: number },
    startSize: { width: number; height: number },
  ) => void;
  /** Check if a specific node is being resized */
  isResizing: (nodeId: string) => boolean;
  /** Get the current resize handle for a node */
  getResizeHandle: (nodeId: string) => "se" | null;
  /** Get the current size during resize */
  getCurrentSize: (nodeId: string) => { width: number; height: number } | null;
};

/**
 * Hook for managing node resize operations
 * Provides a clean interface for resize functionality
 */
export const useNodeResize = (options: UseNodeResizeOptions = {}): UseNodeResizeResult => {
  const { actions: nodeEditorActions } = useNodeEditor();
  const { state: actionState, actions: actionActions } = useEditorActionState();

  const { minWidth = 100, minHeight = 40, snapToGrid = false, gridSize = 20 } = options;

  // Calculate new size based on handle direction and deltas
  // Only 'se' (bottom-right) resize is supported to avoid conflicts with ports
  const calculateNewSize = React.useCallback(
    (
      _handle: "se",
      startSize: { width: number; height: number },
      deltaX: number,
      deltaY: number,
    ): { width: number; height: number } => {
      // Southeast - resize both width and height
      const newSize = {
        width: Math.max(minWidth, startSize.width + deltaX),
        height: Math.max(minHeight, startSize.height + deltaY),
      };

      // Apply grid snapping if enabled
      if (snapToGrid) {
        newSize.width = Math.round(newSize.width / gridSize) * gridSize;
        newSize.height = Math.round(newSize.height / gridSize) * gridSize;
      }

      return newSize;
    },
    [minWidth, minHeight, snapToGrid, gridSize],
  );

  // Handle resize operations
  React.useEffect(() => {
    if (!actionState.resizeState) {
      return;
    }

    const { startPosition, startSize, handle } = actionState.resizeState;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - startPosition.x;
      const deltaY = e.clientY - startPosition.y;

      const newSize = calculateNewSize(handle, startSize, deltaX, deltaY);
      actionActions.updateNodeResize(newSize);
    };

    const handlePointerUp = (_e: PointerEvent) => {
      if (actionState.resizeState) {
        // Apply the final size to the node
        const { nodeId, currentSize } = actionState.resizeState;
        nodeEditorActions.updateNode(nodeId, {
          size: currentSize,
        });
      }

      actionActions.endNodeResize();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Cancel resize operation
        actionActions.endNodeResize();
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [actionState.resizeState, calculateNewSize, actionActions, nodeEditorActions]);

  const startResize = React.useCallback(
    (
      nodeId: string,
      handle: "se",
      startPosition: { x: number; y: number },
      startSize: { width: number; height: number },
    ) => {
      actionActions.startNodeResize(nodeId, startPosition, startSize, handle);
    },
    [actionActions],
  );

  const isResizing = React.useCallback(
    (nodeId: string) => {
      return actionState.resizeState?.nodeId === nodeId;
    },
    [actionState.resizeState],
  );

  const getResizeHandle = React.useCallback(
    (nodeId: string) => {
      return actionState.resizeState?.nodeId === nodeId ? actionState.resizeState.handle : null;
    },
    [actionState.resizeState],
  );

  const getCurrentSize = React.useCallback(
    (nodeId: string) => {
      return actionState.resizeState?.nodeId === nodeId ? actionState.resizeState.currentSize : null;
    },
    [actionState.resizeState],
  );

  return {
    startResize,
    isResizing,
    getResizeHandle,
    getCurrentSize,
  };
};
