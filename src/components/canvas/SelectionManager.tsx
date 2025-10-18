/**
 * @file SelectionManager component
 */
import * as React from "react";
import { NodeId, Position } from "../../types/core";
import { useNodeEditor } from "../../contexts/node-editor/context";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { getNodeBoundingBox, createBoundingBoxFromCorners, doRectanglesIntersect } from "../../utils/boundingBoxUtils";
import { SpatialGrid } from "../../contexts/node-editor/utils/nodeLookupUtils";
import styles from "./SelectionManager.module.css";
import { SelectionOverlay } from "./SelectionOverlay";
import { useInteractionSettings } from "../../contexts/InteractionSettingsContext";
import { usePointerShortcutMatcher } from "../../hooks/usePointerShortcutMatcher";
import {
  CANVAS_POINTER_DRAG_THRESHOLD,
  evaluateCanvasPointerIntent,
  hasExceededCanvasDragThreshold,
  normalizePointerType,
} from "../../utils/canvasPointerIntent";

export type SelectionManagerProps = {
  children: React.ReactNode;
};

/**
 * Manages selection box and multi-selection operations
 */
export const SelectionManager: React.FC<SelectionManagerProps> = ({ children }) => {
  const { state: nodeEditorState } = useNodeEditor();
  const { actions } = useEditorActionState();
  const { state: canvasState } = useNodeCanvas();
  const interactionSettings = useInteractionSettings();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [isClearPending, setIsClearPending] = React.useState(false);
  const pendingClearSelectionRef = React.useRef<{ pointerId: number; start: Position } | null>(null);
  const startPosRef = React.useRef<Position | null>(null);
  const matchesPointerAction = usePointerShortcutMatcher();

  // Spatial index for efficient node selection
  const spatialIndex = React.useMemo(() => {
    const grid = new SpatialGrid<NodeId>(200); // 200px cell size
    Object.entries(nodeEditorState.nodes).forEach(([nodeId, node]) => {
      grid.insert(nodeId, node.position.x, node.position.y);
    });
    return grid;
  }, [nodeEditorState.nodes]);

  // Convert client position to canvas position
  const clientToCanvas = React.useCallback(
    (clientPos: Position): Position => {
      if (!containerRef.current) {
        return clientPos;
      }

      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: (clientPos.x - rect.left) / canvasState.viewport.scale - canvasState.viewport.offset.x,
        y: (clientPos.y - rect.top) / canvasState.viewport.scale - canvasState.viewport.offset.y,
      };
    },
    [canvasState.viewport],
  );

  // Check if a node is within the selection box (optimized)
  const isNodeInSelectionBox = React.useCallback(
    (nodeId: NodeId, selectionBox: { start: Position; end: Position }): boolean => {
      const node = nodeEditorState.nodes[nodeId];
      if (!node) {
        return false;
      }

      const nodeBounds = getNodeBoundingBox(node);
      const boxBounds = createBoundingBoxFromCorners(selectionBox.start, selectionBox.end);

      return doRectanglesIntersect(nodeBounds, boxBounds);
    },
    [nodeEditorState.nodes],
  );

  // Handle selection box drag
  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      // Only start selection if clicking on empty canvas
      const target = e.target as HTMLElement;
      if (target !== e.currentTarget) {
        return;
      }

      const nativeEvent = e.nativeEvent;
      pendingClearSelectionRef.current = null;
      setIsClearPending(false);

      const pointerType = normalizePointerType(nativeEvent.pointerType);
      const intent = evaluateCanvasPointerIntent({
        event: nativeEvent,
        pointerType,
        interactiveTarget: false,
        isSpacePanning: canvasState.isSpacePanning,
        panActivators: interactionSettings.canvasPanActivators,
        matchesPointerAction,
      });

      if (intent.canRangeSelect) {
        const additiveSelection = intent.additiveSelection;

        const canvasPos = clientToCanvas({ x: nativeEvent.clientX, y: nativeEvent.clientY });
        startPosRef.current = canvasPos;
        setIsSelecting(true);

        actions.setSelectionBox({ start: canvasPos, end: canvasPos });

        if (!additiveSelection) {
          actions.clearSelection();
        }
        return;
      }

      if (intent.canClearSelection) {
        pendingClearSelectionRef.current = {
          pointerId: e.pointerId,
          start: { x: nativeEvent.clientX, y: nativeEvent.clientY },
        };
        setIsClearPending(true);
      }
    },
    [
      clientToCanvas,
      actions,
      canvasState.isSpacePanning,
      interactionSettings.canvasPanActivators,
      matchesPointerAction,
      setIsClearPending,
    ],
  );

  const handlePointerMove = React.useCallback(
    (e: PointerEvent) => {
      if (!isSelecting || !startPosRef.current) {
        return;
      }

      const canvasPos = clientToCanvas({ x: e.clientX, y: e.clientY });
      actions.setSelectionBox({ start: startPosRef.current, end: canvasPos });

      // Update selected nodes based on box (use spatial index for performance)
      const box = { start: startPosRef.current, end: canvasPos };
      const boxBounds = createBoundingBoxFromCorners(box.start, box.end);

      // Get candidates from spatial index first, then filter precisely
      const candidateNodes = spatialIndex.getInArea(boxBounds.left, boxBounds.top, boxBounds.right, boxBounds.bottom);

      const nodesInBox = candidateNodes.filter((nodeId) => isNodeInSelectionBox(nodeId, box));

      actions.setInteractionSelection(nodesInBox as NodeId[]);
    },
    [isSelecting, clientToCanvas, nodeEditorState.nodes, isNodeInSelectionBox, actions],
  );

  const handlePointerUp = React.useCallback(() => {
    if (!isSelecting) {
      return;
    }

    setIsSelecting(false);
    startPosRef.current = null;
    actions.setSelectionBox(null);
  }, [isSelecting, actions]);

  // Add global event listeners when selecting
  React.useEffect(() => {
    if (!isSelecting) {
      return;
    }

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isSelecting, handlePointerMove, handlePointerUp]);

  React.useEffect(() => {
    if (!isClearPending) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const pending = pendingClearSelectionRef.current;
      if (!pending || pending.pointerId !== event.pointerId) {
        return;
      }
      if (
        hasExceededCanvasDragThreshold(
          pending.start,
          { x: event.clientX, y: event.clientY },
          CANVAS_POINTER_DRAG_THRESHOLD,
        )
      ) {
        pendingClearSelectionRef.current = null;
        setIsClearPending(false);
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      const pending = pendingClearSelectionRef.current;
      if (!pending || pending.pointerId !== event.pointerId) {
        return;
      }
      pendingClearSelectionRef.current = null;
      setIsClearPending(false);
      actions.clearSelection();
    };

    document.addEventListener("pointermove", handlePointerMove, true);
    document.addEventListener("pointerup", handlePointerUp, true);
    document.addEventListener("pointercancel", handlePointerUp, true);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove, true);
      document.removeEventListener("pointerup", handlePointerUp, true);
      document.removeEventListener("pointercancel", handlePointerUp, true);
    };
  }, [isClearPending, actions]);

  // Render selection box overlay layer
  const renderSelectionBox = () => <SelectionOverlay />;

  return (
    <div ref={containerRef} className={styles.selectionContainer} onPointerDown={handlePointerDown}>
      {children}
      {renderSelectionBox()}
    </div>
  );
};
