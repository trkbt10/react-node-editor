/**
 * @file Context for managing editor UI action states like selection, dragging, resizing, and context menus
 */
import * as React from "react";
import { bindActionCreators, createAction, createActionHandlerMap, type ActionUnion, type BoundActionCreators } from "../utils/typedActions";
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

export const editorActionStateActions = {
  selectNode: createAction("SELECT_NODE", (nodeId: NodeId, multiple: boolean = false) => ({ nodeId, multiple })),
  selectConnection: createAction(
    "SELECT_CONNECTION",
    (connectionId: ConnectionId, multiple: boolean = false) => ({ connectionId, multiple }),
  ),
  clearSelection: createAction("CLEAR_SELECTION"),
  selectAllNodes: createAction("SELECT_ALL_NODES", (nodeIds: NodeId[]) => ({ nodeIds })),
  setSelectionBox: createAction("SET_SELECTION_BOX", (box: SelectionBox | null) => ({ box })),
  startNodeDrag: createAction(
    "START_NODE_DRAG",
    (
      nodeIds: NodeId[],
      startPosition: Position,
      initialPositions: Record<NodeId, Position>,
      affectedChildNodes: Record<NodeId, NodeId[]>,
    ) => ({ nodeIds, startPosition, initialPositions, affectedChildNodes }),
  ),
  updateNodeDrag: createAction("UPDATE_NODE_DRAG", (offset: Position) => ({ offset })),
  endNodeDrag: createAction("END_NODE_DRAG"),
  setHoveredNode: createAction("SET_HOVERED_NODE", (nodeId: NodeId | null) => ({ nodeId })),
  setHoveredConnection: createAction("SET_HOVERED_CONNECTION", (connectionId: ConnectionId | null) => ({ connectionId })),
  startConnectionDrag: createAction("START_CONNECTION_DRAG", (fromPort: BasePort) => ({ fromPort })),
  updateConnectionDrag: createAction(
    "UPDATE_CONNECTION_DRAG",
    (toPosition: Position, candidatePort: BasePort | null) => ({ toPosition, candidatePort }),
  ),
  endConnectionDrag: createAction("END_CONNECTION_DRAG"),
  startConnectionDisconnect: createAction(
    "START_CONNECTION_DISCONNECT",
    (
      originalConnection: {
        id: ConnectionId;
        fromNodeId: NodeId;
        fromPortId: PortId;
        toNodeId: NodeId;
        toPortId: PortId;
      },
      disconnectedEnd: "from" | "to",
      fixedPort: BasePort,
      draggingPosition: Position,
    ) => ({ originalConnection, disconnectedEnd, fixedPort, draggingPosition }),
  ),
  updateConnectionDisconnect: createAction(
    "UPDATE_CONNECTION_DISCONNECT",
    (draggingPosition: Position, candidatePort: BasePort | null) => ({
      draggingPosition,
      candidatePort,
    }),
  ),
  endConnectionDisconnect: createAction("END_CONNECTION_DISCONNECT"),
  setHoveredPort: createAction("SET_HOVERED_PORT", (port: BasePort | null) => ({ port })),
  updateConnectedPorts: createAction("UPDATE_CONNECTED_PORTS", (connectedPorts: Set<PortId>) => ({ connectedPorts })),
  updateConnectablePorts: createAction(
    "UPDATE_CONNECTABLE_PORTS",
    (connectablePorts: ConnectablePortsResult) => ({ connectablePorts }),
  ),
  startNodeResize: createAction(
    "START_NODE_RESIZE",
    (nodeId: NodeId, startPosition: Position, startSize: Size, handle: ResizeHandle) => ({
      nodeId,
      startPosition,
      startSize,
      handle,
    }),
  ),
  updateNodeResize: createAction("UPDATE_NODE_RESIZE", (currentSize: Size) => ({ currentSize })),
  endNodeResize: createAction("END_NODE_RESIZE"),
  showContextMenu: createAction(
    "SHOW_CONTEXT_MENU",
    (
      position: Position,
      nodeId?: NodeId,
      canvasPosition?: Position,
      connectionId?: ConnectionId,
      mode?: "menu" | "search",
      allowedNodeTypes?: string[],
      fromPort?: BasePort,
    ) => ({ position, nodeId, canvasPosition, connectionId, mode, allowedNodeTypes, fromPort }),
  ),
  hideContextMenu: createAction("HIDE_CONTEXT_MENU"),
  setInspectorActiveTab: createAction("SET_INSPECTOR_ACTIVE_TAB", (index: number) => ({ index })),
} as const;

export type EditorActionStateAction = ActionUnion<typeof editorActionStateActions>;

const editorActionStateHandlers = createActionHandlerMap<EditorActionState, typeof editorActionStateActions>(
  editorActionStateActions,
  {
    selectNode: (state, action) => {
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
        selectedConnectionIds: [],
      };
    },
    selectConnection: (state, action) => {
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
        selectedNodeIds: [],
      };
    },
    clearSelection: (state) => ({
      ...state,
      selectedNodeIds: [],
      selectedConnectionIds: [],
      selectionBox: null,
      hoveredConnectionId: null,
      hoveredNodeId: null,
      hoveredPort: null,
    }),
    selectAllNodes: (state, action) => ({
      ...state,
      selectedNodeIds: action.payload.nodeIds,
      selectedConnectionIds: [],
    }),
    setSelectionBox: (state, action) => ({
      ...state,
      selectionBox: action.payload.box,
    }),
    startNodeDrag: (state, action) => {
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
    },
    updateNodeDrag: (state, action) => {
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
    },
    endNodeDrag: (state) => ({
      ...state,
      dragState: null,
    }),
    setHoveredNode: (state, action) => ({
      ...state,
      hoveredNodeId: action.payload.nodeId,
    }),
    setHoveredConnection: (state, action) => ({
      ...state,
      hoveredConnectionId: action.payload.connectionId,
    }),
    startConnectionDrag: (state, action) => ({
      ...state,
      connectionDragState: {
        fromPort: action.payload.fromPort,
        toPosition: { x: 0, y: 0 },
        validTarget: null,
        candidatePort: null,
      },
    }),
    updateConnectionDrag: (state, action) => {
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
    },
    endConnectionDrag: (state) => ({
      ...state,
      connectionDragState: null,
    }),
    startConnectionDisconnect: (state, action) => ({
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
    }),
    updateConnectionDisconnect: (state, action) => {
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
    },
    endConnectionDisconnect: (state) => ({
      ...state,
      connectionDisconnectState: null,
    }),
    setHoveredPort: (state, action) => ({
      ...state,
      hoveredPort: action.payload.port,
    }),
    updateConnectedPorts: (state, action) => ({
      ...state,
      connectedPorts: action.payload.connectedPorts,
    }),
    updateConnectablePorts: (state, action) => ({
      ...state,
      connectablePorts: action.payload.connectablePorts,
    }),
    startNodeResize: (state, action) => {
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
    },
    updateNodeResize: (state, action) => {
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
    },
    endNodeResize: (state) => ({
      ...state,
      resizeState: null,
    }),
    showContextMenu: (state, action) => ({
      ...state,
      contextMenu: {
        visible: true,
        position: action.payload.position,
        canvasPosition: action.payload.canvasPosition,
        nodeId: action.payload.nodeId,
        connectionId: action.payload.connectionId,
        mode: action.payload.mode ?? "menu",
        allowedNodeTypes: action.payload.allowedNodeTypes,
        fromPort: action.payload.fromPort,
      },
    }),
    hideContextMenu: (state) => ({
      ...state,
      contextMenu: {
        visible: false,
        position: { x: 0, y: 0 },
        canvasPosition: undefined,
        nodeId: undefined,
        connectionId: undefined,
      },
    }),
    setInspectorActiveTab: (state, action) => ({
      ...state,
      inspectorActiveTab: action.payload.index,
    }),
  },
);

// Editor action state reducer
export const editorActionStateReducer = (
  state: EditorActionState,
  action: EditorActionStateAction,
): EditorActionState => {
  const handler = editorActionStateHandlers[action.type];
  if (!handler) {
    return state;
  }
  return handler(state, action, undefined);
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


// Context
export type EditorActionStateContextValue = {
  state: EditorActionState;
  dispatch: React.Dispatch<EditorActionStateAction>;
  actions: BoundActionCreators<typeof editorActionStateActions>;
  actionCreators: typeof editorActionStateActions;
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
  const boundActions = React.useMemo(() => bindActionCreators(editorActionStateActions, dispatch), [dispatch]);

  const contextValue: EditorActionStateContextValue = {
    state,
    dispatch,
    actions: boundActions,
    actionCreators: editorActionStateActions,
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
