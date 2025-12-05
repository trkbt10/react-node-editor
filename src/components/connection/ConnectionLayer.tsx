/**
 * @file ConnectionLayer component
 * Renders all connections and handles connection interactions.
 */
import * as React from "react";
import { useNodeEditor } from "../../contexts/composed/node-editor/context";
import { useEditorActionState } from "../../contexts/composed/EditorActionStateContext";
import { useCanvasInteraction } from "../../contexts/composed/canvas/interaction/context";
import { getNodeResizeSize } from "../../core/node/resizeState";
import { ConnectionRenderer } from "./ConnectionRenderer";
import { DragConnection } from "./DragConnection";
import styles from "./ConnectionLayer.module.css";

export type ConnectionLayerProps = {
  className?: string;
};

/**
 * ConnectionLayer - Renders all connections and handles connection interactions
 */
export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({ className }) => {
  const { state: nodeEditorState } = useNodeEditor();
  const { state: actionState } = useEditorActionState();
  const { state: interactionState } = useCanvasInteraction();

  const { selectedConnectionIds, hoveredConnectionId, selectedNodeIds } = actionState;
  const { dragState, resizeState } = interactionState;

  // Convert to Sets for O(1) lookup instead of O(n) includes
  const selectedConnectionIdsSet = React.useMemo(() => new Set(selectedConnectionIds), [selectedConnectionIds]);
  const selectedNodeIdsSet = React.useMemo(() => new Set(selectedNodeIds), [selectedNodeIds]);

  // Pre-compute drag state set for O(1) lookup
  const draggedNodeIdsSet = React.useMemo(() => {
    if (!dragState) {
      return null;
    }
    const set = new Set<string>(dragState.nodeIds);
    // Include affected children
    for (const childIds of Object.values(dragState.affectedChildNodes)) {
      for (const id of childIds) {
        set.add(id);
      }
    }
    return set;
  }, [dragState]);

  return (
    <svg className={className ? `${styles.root} ${className}` : styles.root} data-connection-layer="root">
      {/* Render all connections */}
      {Object.values(nodeEditorState.connections).map((connection) => {
        // O(1) lookup using Sets
        const isFromDragging = draggedNodeIdsSet?.has(connection.fromNodeId) ?? false;
        const isToDragging = draggedNodeIdsSet?.has(connection.toNodeId) ?? false;
        const fromDragOffset = isFromDragging && dragState ? dragState.offset : null;
        const toDragOffset = isToDragging && dragState ? dragState.offset : null;
        const fromResizeSize = getNodeResizeSize(resizeState, connection.fromNodeId);
        const toResizeSize = getNodeResizeSize(resizeState, connection.toNodeId);
        const isSelected = selectedConnectionIdsSet.has(connection.id);
        const isHovered = hoveredConnectionId === connection.id;
        const isAdjacentToSelectedNode =
          selectedNodeIdsSet.has(connection.fromNodeId) || selectedNodeIdsSet.has(connection.toNodeId);

        return (
          <ConnectionRenderer
            key={connection.id}
            connection={connection}
            fromDragOffset={fromDragOffset}
            toDragOffset={toDragOffset}
            fromResizeSize={fromResizeSize}
            toResizeSize={toResizeSize}
            isSelected={isSelected}
            isHovered={isHovered}
            isAdjacentToSelectedNode={isAdjacentToSelectedNode}
          />
        );
      })}

      {/* Render drag connection */}
      <DragConnection />
    </svg>
  );
};

ConnectionLayer.displayName = "ConnectionLayer";
