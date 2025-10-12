/**
 * @file ConnectionLayer component
 */
import * as React from "react";
import { useNodeEditor } from "../../contexts/node-editor";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import { calculateBezierPath, getOppositePortPosition } from "./utils/connectionUtils";
import { useDynamicConnectionPoint } from "../../hooks/usePortPosition";
import type { Connection, Node as EditorNode, Port as CorePort } from "../../types/core";
import { classNames } from "../elements";
import styles from "./ConnectionLayer.module.css";
import { useRenderers } from "../../contexts/RendererContext";

export type ConnectionLayerProps = {
  className?: string;
}

/**
 * ConnectionLayer - Renders all connections and handles connection interactions
 */
export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({ className }) => {
  const { state: nodeEditorState } = useNodeEditor();

  return (
    <svg className={classNames(styles.connectionLayer, className)}>
      {/* Render all connections */}
      {Object.values(nodeEditorState.connections).map((connection) => {
        return <ConnectionRenderer key={connection.id} connection={connection} />;
      })}

      {/* Render drag connection */}
      <DragConnection />
    </svg>
  );
};

ConnectionLayer.displayName = "ConnectionLayer";
const DragConnection = React.memo(() => {
  const { state: actionState } = useEditorActionState();
  const { state: nodeEditorState, portLookupMap } = useNodeEditor();
  
  // Get port IDs for hooks (always call hooks, even if not used)
  const dragFromPortId = actionState.connectionDragState?.fromPort.id;
  const dragFromNodeId = actionState.connectionDragState?.fromPort.nodeId;
  const disconnectPortId = actionState.connectionDisconnectState?.fixedPort.id;
  const disconnectNodeId = actionState.connectionDisconnectState?.fixedPort.nodeId;
  
  // Always call hooks (React rules)
  const dragFromPos = useDynamicConnectionPoint(dragFromNodeId || '', dragFromPortId || '');
  const disconnectPos = useDynamicConnectionPoint(disconnectNodeId || '', disconnectPortId || '');
  
  if (actionState.connectionDragState) {
    const fromPort = actionState.connectionDragState.fromPort;
    const fromNode = nodeEditorState.nodes[fromPort.nodeId];
    if (!fromNode) {return null;}

    // Find the actual port data using context method
    const port = portLookupMap.get(`${fromPort.nodeId}:${fromPort.id}`)?.port;
    if (!port) {return null;}

    if (!dragFromPos) {return null;}
    const toPos = actionState.connectionDragState.toPosition;

    const pathData = calculateBezierPath(
      dragFromPos, 
      toPos, 
      port.position, 
      getOppositePortPosition(port.position)
    );

    return (
      <g className={styles.dragConnection} shapeRendering="geometricPrecision">
        <path
          d={pathData}
          fill="none"
          stroke="var(--node-editor-accent-color, #0066cc)"
          strokeWidth={2}
          strokeDasharray="5,5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{ pointerEvents: "none" }}
        />
      </g>
    );
  }

  // Render disconnect drag connection
  if (actionState.connectionDisconnectState) {
    const disconnectState = actionState.connectionDisconnectState;
    const fixedNode = nodeEditorState.nodes[disconnectState.fixedPort.nodeId];
    if (!fixedNode) {return null;}

    const fixedPort = portLookupMap.get(`${disconnectState.fixedPort.nodeId}:${disconnectState.fixedPort.id}`)?.port;
    if (!fixedPort) {return null;}

    if (!disconnectPos) {return null;}
    const draggingPos = disconnectState.draggingPosition;

    const pathData = calculateBezierPath(
      disconnectPos, 
      draggingPos, 
      fixedPort.position, 
      getOppositePortPosition(fixedPort.position)
    );

    return (
      <g className={styles.dragConnection} shapeRendering="geometricPrecision">
        <path
          d={pathData}
          fill="none"
          stroke="var(--node-editor-caution-color, #ff3b30)"
          strokeWidth={3}
          strokeDasharray="8,4"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{ pointerEvents: "none" }}
        />
      </g>
    );
  }

  return null;
});
const ConnectionRenderer = ({ connection }: { connection: Connection }) => {
  const { state: nodeEditorState, portLookupMap } = useNodeEditor();
  const { state: actionState, dispatch: actionDispatch, actions: actionActions } = useEditorActionState();
  const { utils } = useNodeCanvas();
  const { connection: ConnectionComponent } = useRenderers();
  
  // Runtime type guard for CorePort
  const isCorePort = (p: unknown): p is CorePort => {
    if (!p || typeof p !== 'object') {return false;}
    const o = p as Record<string, unknown>;
    const typeOk = o.type === 'input' || o.type === 'output';
    const posOk = o.position === 'left' || o.position === 'right' || o.position === 'top' || o.position === 'bottom';
    return (
      typeof o.id === 'string' &&
      typeof o.nodeId === 'string' &&
      typeof o.label === 'string' &&
      typeOk &&
      posOk
    );
  };
  
  // Get dynamic port positions
  const fromPortPos = useDynamicConnectionPoint(connection.fromNodeId, connection.fromPortId);
  const toPortPos = useDynamicConnectionPoint(connection.toNodeId, connection.toPortId);

  // Handle connection pointer events
  const handleConnectionPointerDown = React.useCallback(
    (e: React.PointerEvent, connectionId: string) => {
      const fromNode = nodeEditorState.nodes[connection.fromNodeId];
      const toNode = nodeEditorState.nodes[connection.toNodeId];
      const fromPort = portLookupMap.get(`${connection.fromNodeId}:${connection.fromPortId}`)?.port;
      const toPort = portLookupMap.get(`${connection.toNodeId}:${connection.toPortId}`)?.port;

      if (!fromNode || !toNode || !fromPort || !toPort) {return;}

      // Use pre-calculated positions
      if (!fromPortPos || !toPortPos) {return;}

      // Select the connection
      const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey;
      actionDispatch(actionActions.selectConnection(connectionId, isMultiSelect));
    },
    [connection, nodeEditorState, portLookupMap, actionDispatch, actionActions, fromPortPos, toPortPos]
  );

  const handleConnectionPointerEnter = React.useCallback(
    (_e: React.PointerEvent, connectionId: string) => {
      actionDispatch(actionActions.setHoveredConnection(connectionId));
    },
    [actionDispatch, actionActions]
  );

  const handleConnectionPointerLeave = React.useCallback(
    (_e: React.PointerEvent, _connectionId: string) => {
      actionDispatch(actionActions.setHoveredConnection(null));
    },
    [actionDispatch, actionActions]
  );

  const handleConnectionContextMenu = React.useCallback(
    (e: React.MouseEvent, connectionId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const position = { x: e.clientX, y: e.clientY };
      const canvasPos = utils.screenToCanvas(e.clientX, e.clientY);
      actionDispatch(actionActions.showContextMenu(position, undefined, canvasPos, connectionId));
    },
    [actionDispatch, actionActions, utils]
  );
  const fromNode = nodeEditorState.nodes[connection.fromNodeId];
  const toNode = nodeEditorState.nodes[connection.toNodeId];

  const fromRaw = portLookupMap.get(`${connection.fromNodeId}:${connection.fromPortId}`)?.port as unknown;
  const toRaw = portLookupMap.get(`${connection.toNodeId}:${connection.toPortId}`)?.port as unknown;
  // Require nodes; if ports are missing (e.g., tests without full port resolution), synthesize minimal ports
  if (!fromNode || !toNode) {return null;}

  const ensurePort = (raw: unknown, fallback: CorePort): CorePort => (isCorePort(raw) ? raw : fallback);

  const fromPort: CorePort = ensurePort(
    fromRaw,
    {
      id: connection.fromPortId,
      nodeId: connection.fromNodeId,
      type: 'output',
      label: connection.fromPortId,
      position: 'right',
    }
  );
  const toPort: CorePort = ensurePort(
    toRaw,
    {
      id: connection.toPortId,
      nodeId: connection.toNodeId,
      type: 'input',
      label: connection.toPortId,
      position: 'left',
    }
  );

  // Skip if nodes are not visible
  if (fromNode.visible === false || toNode.visible === false) {return null;}

  // Get preview position and size for nodes during drag or resize
  const getNodePreviewData = (node: EditorNode, nodeId: string) => {
    let previewPosition = null;
    let previewSize = null;

    // Check for drag state
    if (actionState.dragState) {
      const { nodeIds, offset, affectedChildNodes } = actionState.dragState;

      // Check if this node is directly being dragged
      if (nodeIds.includes(nodeId)) {
        previewPosition = {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y,
        };
      } else {
        // Check if this node is a child of a dragging group
        const isChildOfDraggingGroup = Object.entries(affectedChildNodes).some(([_groupId, childIds]) =>
          childIds.includes(nodeId)
        );

        if (isChildOfDraggingGroup) {
          previewPosition = {
            x: node.position.x + offset.x,
            y: node.position.y + offset.y,
          };
        }
      }
    }

    // Check for resize state
    if (actionState.resizeState && actionState.resizeState.nodeId === nodeId) {
      previewSize = actionState.resizeState.currentSize;
    }

    return { previewPosition, previewSize };
  };

  const fromNodeData = getNodePreviewData(fromNode, connection.fromNodeId);
  const toNodeData = getNodePreviewData(toNode, connection.toNodeId);
  return (
    <ConnectionComponent
      key={connection.id}
      connection={connection}
      fromNode={fromNode}
      toNode={toNode}
      fromPort={fromPort}
      toPort={toPort}
      isAdjacentToSelectedNode={
        actionState.selectedNodeIds.includes(connection.fromNodeId) ||
        actionState.selectedNodeIds.includes(connection.toNodeId)
      }
      fromNodePosition={fromNodeData.previewPosition || undefined}
      toNodePosition={toNodeData.previewPosition || undefined}
      fromNodeSize={fromNodeData.previewSize || undefined}
      toNodeSize={toNodeData.previewSize || undefined}
      isSelected={actionState.selectedConnectionIds.includes(connection.id)}
      isHovered={actionState.hoveredConnectionId === connection.id}
      onPointerDown={handleConnectionPointerDown}
      onPointerEnter={handleConnectionPointerEnter}
      onPointerLeave={handleConnectionPointerLeave}
      onContextMenu={handleConnectionContextMenu}
    />
  );
};
