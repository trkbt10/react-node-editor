/**
 * @file Node renderer component
 */
import * as React from "react";
import { Node, NodeId } from "../../types/core";
import { NodeDragHandler } from "./NodeDragHandler";
import { createMemoizedComponent, areNodesEqual } from "../../contexts/node-editor/utils/renderOptimizationMemoization";
import styles from "./NodeRenderer.module.css";
import { NodeView } from "./NodeView";
import { useOptionalRenderers } from "../../contexts/RendererContext";
import { useNodeDefinitionList } from "../../contexts/node-definitions";
import { nodeHasGroupBehavior } from "../../types/behaviors";

export type CustomNodeRendererProps = {
  node: Node;
  isSelected: boolean;
  isDragging: boolean;
  isEditing: boolean;
  externalData: unknown;
  isLoadingExternalData: boolean;
  externalDataError: Error | null;
  onStartEdit: () => void;
  onUpdateNode: (updates: Partial<Node>) => void;
};

export type NodeRendererProps = {
  node: Node;
  isSelected: boolean;
  isDragging: boolean;
  dragOffset?: { x: number; y: number };
  nodeRenderer?: (props: CustomNodeRendererProps) => React.ReactNode;
  onUpdateNode?: (nodeId: NodeId, updates: Partial<Node>) => void;
  onNodeContextMenu?: (e: React.MouseEvent, nodeId: NodeId) => void;
  externalDataMap?: Map<NodeId, unknown>;
};

/**
 * Renders an individual node with optimized re-rendering
 */
const NodeRendererComponent: React.FC<NodeRendererProps> = ({
  node,
  isSelected,
  dragOffset = { x: 0, y: 0 },
  nodeRenderer,
  onUpdateNode,
  onNodeContextMenu,
  externalDataMap,
}) => {
  const renderers = useOptionalRenderers();
  const NodeComponent = renderers?.node ?? NodeView;
  const nodeDefinitions = useNodeDefinitionList();

  // Calculate actual position including drag offset
  const actualPosition = React.useMemo(
    () => ({
      x: node.position.x + dragOffset.x,
      y: node.position.y + dragOffset.y,
    }),
    [node.position, dragOffset],
  );

  // Get external data for custom renderers
  const externalData = externalDataMap?.get(node.id);

  // Handle node updates
  const handleUpdateNode = React.useCallback(
    (updates: Partial<Node>) => {
      onUpdateNode?.(node.id, updates);
    },
    [node.id, onUpdateNode],
  );

  // Handle context menu
  const handleContextMenu = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onNodeContextMenu?.(e, node.id);
    },
    [node.id, onNodeContextMenu],
  );

  const isGroup = nodeHasGroupBehavior(node, nodeDefinitions);

  return (
    <NodeDragHandler nodeId={node.id}>
      {({ onPointerDown, isDragging: isCurrentlyDragging }) => (
        <div
          className={styles.nodeWrapper}
          style={{
            transform: `translate(${actualPosition.x}px, ${actualPosition.y}px)`,
            zIndex: isCurrentlyDragging ? 1000 : isGroup ? 1 : 10,
          }}
          data-node-id={node.id}
          data-dragging={isCurrentlyDragging}
        >
          <NodeComponent
            node={node}
            isSelected={isSelected}
            isDragging={isCurrentlyDragging}
            onPointerDown={onPointerDown}
            onContextMenu={handleContextMenu}
            nodeRenderer={nodeRenderer}
            externalData={externalData}
            onUpdateNode={handleUpdateNode}
          />
        </div>
      )}
    </NodeDragHandler>
  );
};

// Create memoized version with custom comparison
export const NodeRenderer = createMemoizedComponent(NodeRendererComponent, (prevProps, nextProps) => {
  // Use custom equality check that ignores position during drag
  const nodesEqual = areNodesEqual(prevProps.node, nextProps.node, prevProps.isDragging || nextProps.isDragging);

  return (
    nodesEqual &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.dragOffset?.x === nextProps.dragOffset?.x &&
    prevProps.dragOffset?.y === nextProps.dragOffset?.y &&
    prevProps.nodeRenderer === nextProps.nodeRenderer &&
    prevProps.onUpdateNode === nextProps.onUpdateNode &&
    prevProps.onNodeContextMenu === nextProps.onNodeContextMenu &&
    prevProps.externalDataMap === nextProps.externalDataMap
  );
});
