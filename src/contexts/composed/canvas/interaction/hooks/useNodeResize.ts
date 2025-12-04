/**
 * @file Hook for managing node resize operations with grid snapping support
 */
import * as React from "react";
import { useNodeEditor } from "../../../node-editor/context";
import { useEditorActionState } from "../../../EditorActionStateContext";
import { useNodeCanvas } from "../../viewport/context";
import { useCanvasInteraction } from "../context";
import type { Position, ResizeHandle, Size } from "../../../../../types/core";

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
  const { actions: _actionActions } = useEditorActionState();
  const { state: interactionState, actions: interactionActions } = useCanvasInteraction();
  const { state: canvasState } = useNodeCanvas();

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
    if (!interactionState.resizeState) {
      return;
    }

    const { startPosition, startSize, handle, startNodePosition } = interactionState.resizeState;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaX = (e.clientX - startPosition.x) / canvasState.viewport.scale;
      const deltaY = (e.clientY - startPosition.y) / canvasState.viewport.scale;

      const { size, position } = calculateResize(handle, startSize, startNodePosition, deltaX, deltaY);
      interactionActions.updateNodeResize(size, position);
    };

    const handlePointerUp = (_e: PointerEvent) => {
      if (interactionState.resizeState) {
        // Apply the final size to the node
        const { nodeId, currentSize, currentPosition } = interactionState.resizeState;
        nodeEditorActions.updateNode(nodeId, {
          size: currentSize,
          position: currentPosition,
        });
      }

      interactionActions.endNodeResize();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Cancel resize operation
        interactionActions.endNodeResize();
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
  }, [interactionState.resizeState, calculateResize, interactionActions, nodeEditorActions, canvasState.viewport.scale]);

  const startResize = React.useCallback(
    (
      nodeId: string,
      handle: ResizeHandle,
      startPosition: Position,
      startSize: Size,
      startNodePosition: Position,
    ) => {
      interactionActions.startNodeResize(nodeId, startPosition, startSize, handle, startNodePosition);
    },
    [interactionActions],
  );

  const isResizing = React.useCallback(
    (nodeId: string) => {
      return interactionState.resizeState?.nodeId === nodeId;
    },
    [interactionState.resizeState],
  );

  const getResizeHandle = React.useCallback(
    (nodeId: string) => {
      return interactionState.resizeState?.nodeId === nodeId ? interactionState.resizeState.handle : null;
    },
    [interactionState.resizeState],
  );

  const getCurrentSize = React.useCallback(
    (nodeId: string) => {
      return interactionState.resizeState?.nodeId === nodeId ? interactionState.resizeState.currentSize : null;
    },
    [interactionState.resizeState],
  );

  const getCurrentPosition = React.useCallback(
    (nodeId: string) => {
      return interactionState.resizeState?.nodeId === nodeId ? interactionState.resizeState.currentPosition : null;
    },
    [interactionState.resizeState],
  );

  return {
    startResize,
    isResizing,
    getResizeHandle,
    getCurrentSize,
    getCurrentPosition,
  };
};
