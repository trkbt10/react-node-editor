/**
 * @file Context for managing editor UI action states like selection, dragging, resizing, and context menus
 */
import * as React from "react";
import {
  NodeId,
  ConnectionId,
  PortId,
  Position,
  Size,
  Port as BasePort,
  DragState,
  ResizeState,
  ResizeHandle,
  ConnectionDragState,
  ConnectionDisconnectState,
  ContextMenuState,
} from "../types/core";
import type { ConnectablePortsResult } from "./node-ports/utils/connectablePortPlanner";

const createEmptyConnectablePorts = (): ConnectablePortsResult => ({
  ids: new Set<string>(),
  descriptors: new Map(),
  source: null,
});

// Selection box specific to action state
export type SelectionBox = {
  start: Position;
  end: Position;
};

export type EditorActionState = {
  selectedNodeIds: NodeId[];
  selectedConnectionIds: ConnectionId[];
  selectionBox: SelectionBox | null;
  dragState: DragState | null;
  resizeState: ResizeState | null;
  hoveredNodeId: NodeId | null;
  hoveredConnectionId: ConnectionId | null;
  connectionDragState: ConnectionDragState | null;
  connectionDisconnectState: ConnectionDisconnectState | null;
  hoveredPort: BasePort | null;
  connectedPorts: Set<PortId>;
  connectablePorts: ConnectablePortsResult;
  contextMenu: ContextMenuState;
  inspectorActiveTab: number;
};

// Editor action state actions
export type EditorActionStateAction =
  | { type: "SELECT_NODE"; payload: { nodeId: NodeId; multiple: boolean } }
  | { type: "SELECT_CONNECTION"; payload: { connectionId: ConnectionId; multiple: boolean } }
  | { type: "CLEAR_SELECTION" }
  | { type: "SELECT_ALL_NODES"; payload: { nodeIds: NodeId[] } }
  | { type: "SET_SELECTION_BOX"; payload: { box: SelectionBox | null } }
  | {
      type: "START_NODE_DRAG";
      payload: {
        nodeIds: NodeId[];
        startPosition: { x: number; y: number };
        initialPositions: Record<NodeId, { x: number; y: number }>;
        affectedChildNodes: Record<NodeId, NodeId[]>;
      };
    }
  | { type: "UPDATE_NODE_DRAG"; payload: { offset: { x: number; y: number } } }
  | { type: "END_NODE_DRAG" }
  | { type: "SET_HOVERED_NODE"; payload: { nodeId: NodeId | null } }
  | { type: "SET_HOVERED_CONNECTION"; payload: { connectionId: ConnectionId | null } }
  | { type: "START_CONNECTION_DRAG"; payload: { fromPort: BasePort } }
  | {
      type: "UPDATE_CONNECTION_DRAG";
      payload: { toPosition: { x: number; y: number }; candidatePort: BasePort | null };
    }
  | { type: "END_CONNECTION_DRAG" }
  | {
      type: "START_CONNECTION_DISCONNECT";
      payload: {
        originalConnection: {
          id: ConnectionId;
          fromNodeId: NodeId;
          fromPortId: PortId;
          toNodeId: NodeId;
          toPortId: PortId;
        };
        disconnectedEnd: "from" | "to";
        fixedPort: BasePort;
        draggingPosition: { x: number; y: number };
      };
    }
  | { type: "UPDATE_CONNECTION_DISCONNECT"; payload: { draggingPosition: Position; candidatePort: BasePort | null } }
  | { type: "END_CONNECTION_DISCONNECT" }
  | { type: "SET_HOVERED_PORT"; payload: { port: BasePort | null } }
  | { type: "UPDATE_CONNECTED_PORTS"; payload: { connectedPorts: Set<PortId> } }
  | { type: "UPDATE_CONNECTABLE_PORTS"; payload: { connectablePorts: ConnectablePortsResult } }
  | {
      type: "START_NODE_RESIZE";
      payload: { nodeId: NodeId; startPosition: Position; startSize: Size; handle: ResizeHandle };
    }
  | { type: "UPDATE_NODE_RESIZE"; payload: { currentSize: Size } }
  | { type: "END_NODE_RESIZE" }
  | {
      type: "SHOW_CONTEXT_MENU";
      payload: {
        position: Position;
        nodeId?: NodeId;
        connectionId?: ConnectionId;
        canvasPosition?: Position;
        mode?: "menu" | "search";
        allowedNodeTypes?: string[];
        fromPort?: BasePort;
      };
    }
  | { type: "HIDE_CONTEXT_MENU" }
  | { type: "SET_INSPECTOR_ACTIVE_TAB"; payload: { index: number } };

// Editor action state reducer
export const editorActionStateReducer = (
  state: EditorActionState,
  action: EditorActionStateAction,
): EditorActionState => {
  switch (action.type) {
    case "SELECT_NODE": {
      const { nodeId, multiple } = action.payload;

      if (multiple) {
        const isSelected = state.selectedNodeIds.includes(nodeId);
        return {
          ...state,
          selectedNodeIds: isSelected
            ? state.selectedNodeIds.filter((id) => id !== nodeId)
            : [...state.selectedNodeIds, nodeId],
        };
      }

      return {
        ...state,
        selectedNodeIds: [nodeId],
        selectedConnectionIds: [], // Clear connection selection
      };
    }

    case "SELECT_CONNECTION": {
      const { connectionId, multiple } = action.payload;

      if (multiple) {
        const isSelected = state.selectedConnectionIds.includes(connectionId);
        return {
          ...state,
          selectedConnectionIds: isSelected
            ? state.selectedConnectionIds.filter((id) => id !== connectionId)
            : [...state.selectedConnectionIds, connectionId],
        };
      }

      return {
        ...state,
        selectedConnectionIds: [connectionId],
        selectedNodeIds: [], // Clear node selection
      };
    }

    case "CLEAR_SELECTION":
      return {
        ...state,
        selectedNodeIds: [],
        selectedConnectionIds: [],
        selectionBox: null,
        hoveredConnectionId: null,
        hoveredNodeId: null,
        hoveredPort: null,
      };

    case "SELECT_ALL_NODES":
      return {
        ...state,
        selectedNodeIds: action.payload.nodeIds,
        selectedConnectionIds: [],
      };

    case "SET_SELECTION_BOX":
      return {
        ...state,
        selectionBox: action.payload.box,
      };

    case "START_NODE_DRAG": {
      const { nodeIds, startPosition, initialPositions, affectedChildNodes } = action.payload;
      return {
        ...state,
        dragState: {
          nodeIds,
          startPosition,
          offset: { x: 0, y: 0 },
          initialPositions,
          affectedChildNodes,
        },
      };
    }

    case "UPDATE_NODE_DRAG": {
      if (!state.dragState) {
        return state;
      }

      return {
        ...state,
        dragState: {
          ...state.dragState,
          offset: action.payload.offset,
        },
      };
    }

    case "END_NODE_DRAG":
      return {
        ...state,
        dragState: null,
      };

    case "SET_HOVERED_NODE":
      return {
        ...state,
        hoveredNodeId: action.payload.nodeId,
      };

    case "SET_HOVERED_CONNECTION":
      return {
        ...state,
        hoveredConnectionId: action.payload.connectionId,
      };

    case "START_CONNECTION_DRAG":
      return {
        ...state,
        connectionDragState: {
          fromPort: action.payload.fromPort,
          toPosition: { x: 0, y: 0 },
          validTarget: null,
          candidatePort: null,
        },
      };

    case "UPDATE_CONNECTION_DRAG":
      if (!state.connectionDragState) {
        return state;
      }
      return {
        ...state,
        connectionDragState: {
          ...state.connectionDragState,
          toPosition: action.payload.toPosition,
          candidatePort: action.payload.candidatePort,
        },
      };

    case "END_CONNECTION_DRAG":
      return {
        ...state,
        connectionDragState: null,
      };

    case "START_CONNECTION_DISCONNECT":
      return {
        ...state,
        connectionDisconnectState: {
          connectionId: action.payload.originalConnection.id,
          fixedPort: action.payload.fixedPort,
          draggingEnd: action.payload.disconnectedEnd,
          draggingPosition: action.payload.draggingPosition,
          originalConnection: action.payload.originalConnection,
          disconnectedEnd: action.payload.disconnectedEnd,
          candidatePort: null,
        },
      };

    case "UPDATE_CONNECTION_DISCONNECT":
      if (!state.connectionDisconnectState) {
        return state;
      }
      return {
        ...state,
        connectionDisconnectState: {
          ...state.connectionDisconnectState,
          draggingPosition: action.payload.draggingPosition,
          candidatePort: action.payload.candidatePort,
        },
      };

    case "END_CONNECTION_DISCONNECT":
      return {
        ...state,
        connectionDisconnectState: null,
      };

    case "SET_HOVERED_PORT":
      return {
        ...state,
        hoveredPort: action.payload.port,
      };

    case "UPDATE_CONNECTED_PORTS":
      return {
        ...state,
        connectedPorts: action.payload.connectedPorts,
      };

    case "UPDATE_CONNECTABLE_PORTS":
      return {
        ...state,
        connectablePorts: action.payload.connectablePorts,
      };

    case "START_NODE_RESIZE": {
      const { nodeId, startPosition, startSize, handle } = action.payload;
      return {
        ...state,
        resizeState: {
          nodeId,
          startPosition,
          startSize,
          currentSize: startSize,
          currentPosition: startPosition,
          handle,
        },
      };
    }

    case "UPDATE_NODE_RESIZE": {
      if (!state.resizeState) {
        return state;
      }

      return {
        ...state,
        resizeState: {
          ...state.resizeState,
          currentSize: action.payload.currentSize,
        },
      };
    }

    case "END_NODE_RESIZE":
      return {
        ...state,
        resizeState: null,
      };

    case "SHOW_CONTEXT_MENU":
      return {
        ...state,
        contextMenu: {
          visible: true,
          position: action.payload.position,
          canvasPosition: action.payload.canvasPosition,
          nodeId: action.payload.nodeId,
          connectionId: action.payload.connectionId,
          mode: action.payload.mode || "menu",
          allowedNodeTypes: action.payload.allowedNodeTypes,
          fromPort: action.payload.fromPort,
        },
      };

    case "HIDE_CONTEXT_MENU":
      return {
        ...state,
        contextMenu: {
          visible: false,
          position: { x: 0, y: 0 },
          canvasPosition: undefined,
          nodeId: undefined,
          connectionId: undefined,
        },
      };

    case "SET_INSPECTOR_ACTIVE_TAB":
      return {
        ...state,
        inspectorActiveTab: action.payload.index,
      };

    default:
      return state;
  }
};

// Default state
export const defaultEditorActionState: EditorActionState = {
  selectedNodeIds: [],
  selectedConnectionIds: [],
  selectionBox: null,
  dragState: null,
  resizeState: null,
  hoveredNodeId: null,
  hoveredConnectionId: null,
  connectionDragState: null,
  connectionDisconnectState: null,
  hoveredPort: null,
  connectedPorts: new Set<PortId>(),
  connectablePorts: createEmptyConnectablePorts(),
  contextMenu: {
    visible: false,
    position: { x: 0, y: 0 },
    canvasPosition: undefined,
    nodeId: undefined,
    connectionId: undefined,
    mode: "menu",
    allowedNodeTypes: undefined,
    fromPort: undefined,
  },
  inspectorActiveTab: 0,
};

// Editor action state action creators
export const editorActionStateActions = {
  selectNode: (nodeId: NodeId, multiple: boolean = false): EditorActionStateAction => ({
    type: "SELECT_NODE",
    payload: { nodeId, multiple },
  }),
  selectConnection: (connectionId: ConnectionId, multiple: boolean = false): EditorActionStateAction => ({
    type: "SELECT_CONNECTION",
    payload: { connectionId, multiple },
  }),
  clearSelection: (): EditorActionStateAction => ({
    type: "CLEAR_SELECTION",
  }),
  selectAllNodes: (nodeIds: NodeId[]): EditorActionStateAction => ({
    type: "SELECT_ALL_NODES",
    payload: { nodeIds },
  }),
  setSelectionBox: (box: SelectionBox | null): EditorActionStateAction => ({
    type: "SET_SELECTION_BOX",
    payload: { box },
  }),
  startNodeDrag: (
    nodeIds: NodeId[],
    startPosition: { x: number; y: number },
    initialPositions: Record<NodeId, { x: number; y: number }>,
    affectedChildNodes: Record<NodeId, NodeId[]>,
  ): EditorActionStateAction => ({
    type: "START_NODE_DRAG",
    payload: { nodeIds, startPosition, initialPositions, affectedChildNodes },
  }),
  updateNodeDrag: (offset: { x: number; y: number }): EditorActionStateAction => ({
    type: "UPDATE_NODE_DRAG",
    payload: { offset },
  }),
  endNodeDrag: (): EditorActionStateAction => ({
    type: "END_NODE_DRAG",
  }),
  setHoveredNode: (nodeId: NodeId | null): EditorActionStateAction => ({
    type: "SET_HOVERED_NODE",
    payload: { nodeId },
  }),
  setHoveredConnection: (connectionId: ConnectionId | null): EditorActionStateAction => ({
    type: "SET_HOVERED_CONNECTION",
    payload: { connectionId },
  }),
  startConnectionDrag: (fromPort: BasePort): EditorActionStateAction => ({
    type: "START_CONNECTION_DRAG",
    payload: { fromPort },
  }),
  updateConnectionDrag: (
    toPosition: { x: number; y: number },
    candidatePort: BasePort | null,
  ): EditorActionStateAction => ({
    type: "UPDATE_CONNECTION_DRAG",
    payload: { toPosition, candidatePort },
  }),
  endConnectionDrag: (): EditorActionStateAction => ({
    type: "END_CONNECTION_DRAG",
  }),
  setHoveredPort: (port: BasePort | null): EditorActionStateAction => ({
    type: "SET_HOVERED_PORT",
    payload: { port },
  }),
  updateConnectedPorts: (connectedPorts: Set<PortId>): EditorActionStateAction => ({
    type: "UPDATE_CONNECTED_PORTS",
    payload: { connectedPorts },
  }),
  updateConnectablePorts: (connectablePorts: ConnectablePortsResult): EditorActionStateAction => ({
    type: "UPDATE_CONNECTABLE_PORTS",
    payload: { connectablePorts },
  }),
  startConnectionDisconnect: (
    originalConnection: {
      id: ConnectionId;
      fromNodeId: NodeId;
      fromPortId: PortId;
      toNodeId: NodeId;
      toPortId: PortId;
    },
    disconnectedEnd: "from" | "to",
    fixedPort: BasePort,
    draggingPosition: { x: number; y: number },
  ): EditorActionStateAction => ({
    type: "START_CONNECTION_DISCONNECT",
    payload: { originalConnection, disconnectedEnd, fixedPort, draggingPosition },
  }),
  updateConnectionDisconnect: (
    draggingPosition: { x: number; y: number },
    candidatePort: BasePort | null,
  ): EditorActionStateAction => ({
    type: "UPDATE_CONNECTION_DISCONNECT",
    payload: { draggingPosition, candidatePort },
  }),
  endConnectionDisconnect: (): EditorActionStateAction => ({
    type: "END_CONNECTION_DISCONNECT",
  }),
  startNodeResize: (
    nodeId: NodeId,
    startPosition: { x: number; y: number },
    startSize: { width: number; height: number },
    handle: "se",
  ): EditorActionStateAction => ({
    type: "START_NODE_RESIZE",
    payload: { nodeId, startPosition, startSize, handle },
  }),
  updateNodeResize: (currentSize: { width: number; height: number }): EditorActionStateAction => ({
    type: "UPDATE_NODE_RESIZE",
    payload: { currentSize },
  }),
  endNodeResize: (): EditorActionStateAction => ({
    type: "END_NODE_RESIZE",
  }),
  showContextMenu: (
    position: { x: number; y: number },
    nodeId?: NodeId,
    canvasPosition?: { x: number; y: number },
    connectionId?: ConnectionId,
    mode?: "menu" | "search",
    allowedNodeTypes?: string[],
    fromPort?: BasePort,
  ): EditorActionStateAction => ({
    type: "SHOW_CONTEXT_MENU",
    payload: { position, nodeId, canvasPosition, connectionId, mode, allowedNodeTypes, fromPort },
  }),
  hideContextMenu: (): EditorActionStateAction => ({
    type: "HIDE_CONTEXT_MENU",
  }),
  setInspectorActiveTab: (index: number): EditorActionStateAction => ({
    type: "SET_INSPECTOR_ACTIVE_TAB",
    payload: { index },
  }),
};

// Context
export type EditorActionStateContextValue = {
  state: EditorActionState;
  dispatch: React.Dispatch<EditorActionStateAction>;
  actions: typeof editorActionStateActions;
};

export const EditorActionStateContext = React.createContext<EditorActionStateContextValue | null>(null);

// Provider
export type EditorActionStateProviderProps = {
  children: React.ReactNode;
  initialState?: Partial<EditorActionState>;
};

export const EditorActionStateProvider: React.FC<EditorActionStateProviderProps> = ({ children, initialState }) => {
  const [state, dispatch] = React.useReducer(editorActionStateReducer, {
    ...defaultEditorActionState,
    ...initialState,
  });

  const contextValue: EditorActionStateContextValue = {
    state,
    dispatch,
    actions: editorActionStateActions,
  };

  return <EditorActionStateContext.Provider value={contextValue}>{children}</EditorActionStateContext.Provider>;
};

// Hook
export const useEditorActionState = (): EditorActionStateContextValue => {
  const context = React.useContext(EditorActionStateContext);
  if (!context) {
    throw new Error("useEditorActionState must be used within an EditorActionStateProvider");
  }
  return context;
};
