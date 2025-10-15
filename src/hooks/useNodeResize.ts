/**
 * @file Hook for managing node resize operations with grid snapping support
 */
import * as React from "react";
import { useNodeEditor } from "../contexts/node-editor/context";
import { useEditorActionState } from "../contexts/EditorActionStateContext";
import type { Position, ResizeHandle, Size } from "../types/core";

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
  /** Start resizing a node from a specific handle */
  startResize: (
    nodeId: string,
    handle: ResizeHandle,
    startPosition: Position,
    startSize: Size,
    startNodePosition: Position,
  ) => void;
  /** Check if a specific node is being resized */
  isResizing: (nodeId: string) => boolean;
  /** Get the current resize handle for a node */
  getResizeHandle: (nodeId: string) => ResizeHandle | null;
  /** Get the current size during resize */
  getCurrentSize: (nodeId: string) => Size | null;
  /** Get the current position during resize (only differs for handles that move the origin) */
  getCurrentPosition: (nodeId: string) => Position | null;
};

/**
 * Hook for managing node resize operations
 * Provides a clean interface for resize functionality
 */
export const useNodeResize = (options: UseNodeResizeOptions = {}): UseNodeResizeResult => {
  const { actions: nodeEditorActions } = useNodeEditor();
  const { state: actionState, actions: actionActions } = useEditorActionState();

  const { minWidth = 100, minHeight = 40, snapToGrid = false, gridSize = 20 } = options;

  // Calculate new size and position based on handle direction and deltas
  const calculateResize = React.useCallback(
    (
      handle: ResizeHandle,
      startSize: Size,
      startNodePosition: Position,
      deltaX: number,
      deltaY: number,
    ): { size: Size; position: Position } => {
      let width = startSize.width;
      let height = startSize.height;
      let hasWidthChanged = false;
      let hasHeightChanged = false;

      const affectsLeft = handle.includes("w");
      const affectsRight = handle.includes("e");
      const affectsTop = handle.includes("n");
      const affectsBottom = handle.includes("s");

      if (affectsLeft) {
        width = startSize.width - deltaX;
        hasWidthChanged = true;
      } else if (affectsRight) {
        width = startSize.width + deltaX;
        hasWidthChanged = true;
      }

      if (affectsTop) {
        height = startSize.height - deltaY;
        hasHeightChanged = true;
      } else if (affectsBottom) {
        height = startSize.height + deltaY;
        hasHeightChanged = true;
      }

      if (hasWidthChanged) {
        width = Math.max(minWidth, width);
        if (snapToGrid) {
          width = Math.max(minWidth, Math.round(width / gridSize) * gridSize);
        }
      } else {
        width = startSize.width;
      }

      if (hasHeightChanged) {
        height = Math.max(minHeight, height);
        if (snapToGrid) {
          height = Math.max(minHeight, Math.round(height / gridSize) * gridSize);
        }
      } else {
        height = startSize.height;
      }

      const position: Position = {
        x: startNodePosition.x,
        y: startNodePosition.y,
      };

      if (affectsLeft) {
        position.x = startNodePosition.x + (startSize.width - width);
      }

      if (affectsTop) {
        position.y = startNodePosition.y + (startSize.height - height);
      }

      return {
        size: { width, height },
        position,
      };
    },
    [gridSize, minHeight, minWidth, snapToGrid],
  );

  // Handle resize operations
  React.useEffect(() => {
    if (!actionState.resizeState) {
      return;
    }

    const { startPosition, startSize, handle, startNodePosition } = actionState.resizeState;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - startPosition.x;
      const deltaY = e.clientY - startPosition.y;

      const { size, position } = calculateResize(handle, startSize, startNodePosition, deltaX, deltaY);
      actionActions.updateNodeResize(size, position);
    };

    const handlePointerUp = (_e: PointerEvent) => {
      if (actionState.resizeState) {
        // Apply the final size to the node
        const { nodeId, currentSize, currentPosition } = actionState.resizeState;
        nodeEditorActions.updateNode(nodeId, {
          size: currentSize,
          position: currentPosition,
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
  }, [actionState.resizeState, calculateResize, actionActions, nodeEditorActions]);

  const startResize = React.useCallback(
    (
      nodeId: string,
      handle: ResizeHandle,
      startPosition: Position,
      startSize: Size,
      startNodePosition: Position,
    ) => {
      actionActions.startNodeResize(nodeId, startPosition, startSize, handle, startNodePosition);
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

  const getCurrentPosition = React.useCallback(
    (nodeId: string) => {
      return actionState.resizeState?.nodeId === nodeId ? actionState.resizeState.currentPosition : null;
    },
    [actionState.resizeState],
  );

  return {
    startResize,
    isResizing,
    getResizeHandle,
    getCurrentSize,
    getCurrentPosition,
  };
};
