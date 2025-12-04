/**
 * @file Context for canvas-specific interaction states (selection box, drag, resize, connection drag)
 */
import * as React from "react";
import { createAction, type ActionUnion, type BoundActionCreators } from "../../../../utils/typedActions";
import type {
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
} from "../../../../types/core";

// Selection box for canvas range selection
export type SelectionBox = {
  start: Position;
  end: Position;
};

export type CanvasInteractionState = {
  selectionBox: SelectionBox | null;
  dragState: DragState | null;
  resizeState: ResizeState | null;
  connectionDragState: ConnectionDragState | null;
  connectionDisconnectState: ConnectionDisconnectState | null;
};

export const canvasInteractionActions = {
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
  startNodeResize: createAction(
    "START_NODE_RESIZE",
    (
      nodeId: NodeId,
      startPosition: Position,
      startSize: Size,
      handle: ResizeHandle,
      startNodePosition: Position,
    ) => ({
      nodeId,
      startPosition,
      startSize,
      handle,
      startNodePosition,
    }),
  ),
  updateNodeResize: createAction(
    "UPDATE_NODE_RESIZE",
    (currentSize: Size, currentPosition: Position) => ({ currentSize, currentPosition }),
  ),
  endNodeResize: createAction("END_NODE_RESIZE"),
} as const;

export type CanvasInteractionAction = ActionUnion<typeof canvasInteractionActions>;

// Context types
export type CanvasInteractionActionsValue = {
  dispatch: React.Dispatch<CanvasInteractionAction>;
  actions: BoundActionCreators<typeof canvasInteractionActions>;
  actionCreators: typeof canvasInteractionActions;
};

export type CanvasInteractionContextValue = CanvasInteractionActionsValue & {
  state: CanvasInteractionState;
};

// Split contexts for performance optimization
const CanvasInteractionStateContext = React.createContext<CanvasInteractionState | null>(null);
CanvasInteractionStateContext.displayName = "CanvasInteractionStateContext";

const CanvasInteractionActionsContext = React.createContext<CanvasInteractionActionsValue | null>(null);
CanvasInteractionActionsContext.displayName = "CanvasInteractionActionsContext";

// Combined context for backward compatibility
export const CanvasInteractionContext = React.createContext<CanvasInteractionContextValue | null>(null);
CanvasInteractionContext.displayName = "CanvasInteractionContext";

// Hooks

/**
 * Hook to access only the canvas interaction state
 * Use this when you only need to read state and don't need actions
 */
export const useCanvasInteractionState = (): CanvasInteractionState => {
  const state = React.useContext(CanvasInteractionStateContext);
  if (!state) {
    throw new Error("useCanvasInteractionState must be used within a CanvasInteractionProvider");
  }
  return state;
};

/**
 * Hook to access only the canvas interaction actions
 * Use this when you only need to dispatch actions and don't need to re-render on state changes
 * The returned actions have stable references and won't cause re-renders
 */
export const useCanvasInteractionActions = (): CanvasInteractionActionsValue => {
  const actions = React.useContext(CanvasInteractionActionsContext);
  if (!actions) {
    throw new Error("useCanvasInteractionActions must be used within a CanvasInteractionProvider");
  }
  return actions;
};

/**
 * Hook to access both state and actions
 * Prefer useCanvasInteractionState or useCanvasInteractionActions for better performance
 */
export const useCanvasInteraction = (): CanvasInteractionContextValue => {
  const context = React.useContext(CanvasInteractionContext);
  if (!context) {
    throw new Error("useCanvasInteraction must be used within a CanvasInteractionProvider");
  }
  return context;
};

// Export the split contexts for use in provider
export { CanvasInteractionStateContext, CanvasInteractionActionsContext };
