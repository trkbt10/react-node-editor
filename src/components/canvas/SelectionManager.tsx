import * as React from "react";
import { NodeId, Position } from "../../types/core";
import { useNodeEditor } from "../../contexts/node-editor";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { getNodeBoundingBox, createBoundingBoxFromCorners, doRectanglesIntersect } from "../../utils/boundingBoxUtils";
import { SpatialGrid } from "../../contexts/node-editor/utils/nodeLookupUtils";
import styles from "./SelectionManager.module.css";
import { SelectionOverlay } from "./SelectionOverlay";

export type SelectionManagerProps = {
  children: React.ReactNode;
}

/**
 * Manages selection box and multi-selection operations
 */
export const SelectionManager: React.FC<SelectionManagerProps> = ({ children }) => {
  const { state: nodeEditorState } = useNodeEditor();
  const { dispatch: actionDispatch, actions } = useEditorActionState();
  const { state: canvasState } = useNodeCanvas();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const startPosRef = React.useRef<Position | null>(null);

  // Spatial index for efficient node selection
  const spatialIndex = React.useMemo(() => {
    const grid = new SpatialGrid<NodeId>(200); // 200px cell size
    Object.entries(nodeEditorState.nodes).forEach(([nodeId, node]) => {
      grid.insert(nodeId, node.position.x, node.position.y);
    });
    return grid;
  }, [nodeEditorState.nodes]);

  // Convert client position to canvas position
  const clientToCanvas = React.useCallback((clientPos: Position): Position => {
    if (!containerRef.current) {return clientPos;}
    
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientPos.x - rect.left) / canvasState.viewport.scale - canvasState.viewport.offset.x,
      y: (clientPos.y - rect.top) / canvasState.viewport.scale - canvasState.viewport.offset.y,
    };
  }, [canvasState.viewport]);

  // Check if a node is within the selection box (optimized)
  const isNodeInSelectionBox = React.useCallback((nodeId: NodeId, selectionBox: { start: Position; end: Position }): boolean => {
    const node = nodeEditorState.nodes[nodeId];
    if (!node) {return false;}

    const nodeBounds = getNodeBoundingBox(node);
    const boxBounds = createBoundingBoxFromCorners(selectionBox.start, selectionBox.end);

    return doRectanglesIntersect(nodeBounds, boxBounds);
  }, [nodeEditorState.nodes]);

  // Handle selection box drag
  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    // Only start selection if clicking on empty canvas
    const target = e.target as HTMLElement;
    if (target !== e.currentTarget) {return;}

    const canvasPos = clientToCanvas({ x: e.clientX, y: e.clientY });
    startPosRef.current = canvasPos;
    setIsSelecting(true);

    actionDispatch(actions.setSelectionBox({ start: canvasPos, end: canvasPos }));

    // Clear selection if not holding modifier
    if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
      actionDispatch(actions.clearSelection());
    }
  }, [clientToCanvas, actionDispatch, actions]);

  const handlePointerMove = React.useCallback((e: PointerEvent) => {
    if (!isSelecting || !startPosRef.current) {return;}

    const canvasPos = clientToCanvas({ x: e.clientX, y: e.clientY });
    actionDispatch(actions.setSelectionBox({ start: startPosRef.current, end: canvasPos }));

    // Update selected nodes based on box (use spatial index for performance)
    const box = { start: startPosRef.current, end: canvasPos };
    const boxBounds = createBoundingBoxFromCorners(box.start, box.end);
    
    // Get candidates from spatial index first, then filter precisely
    const candidateNodes = spatialIndex.getInArea(
      boxBounds.left, 
      boxBounds.top, 
      boxBounds.right, 
      boxBounds.bottom
    );
    
    const nodesInBox = candidateNodes.filter(nodeId =>
      isNodeInSelectionBox(nodeId, box)
    );

    actionDispatch(actions.selectAllNodes(nodesInBox as NodeId[]));
  }, [isSelecting, clientToCanvas, nodeEditorState.nodes, isNodeInSelectionBox, actionDispatch, actions]);

  const handlePointerUp = React.useCallback(() => {
    if (!isSelecting) {return;}

    setIsSelecting(false);
    startPosRef.current = null;
    actionDispatch(actions.setSelectionBox(null));
  }, [isSelecting, actionDispatch, actions]);

  // Add global event listeners when selecting
  React.useEffect(() => {
    if (!isSelecting) {return;}

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isSelecting, handlePointerMove, handlePointerUp]);

  // Render selection box overlay layer
  const renderSelectionBox = () => <SelectionOverlay />;

  return (
    <div ref={containerRef} className={styles.selectionContainer} onPointerDown={handlePointerDown}>
      {children}
      {renderSelectionBox()}
    </div>
  );
};
