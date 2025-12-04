/**
 * @file Context for managing canvas viewport, panning, zooming, and grid settings
 */
import * as React from "react";
import { createAction, type ActionUnion, type BoundActionCreators } from "../../../../utils/typedActions";
import type { Position, Viewport, GridSettings } from "../../../../types/core";
import type { createCanvasUtils } from "./utils/coordinateConversion";

export type PanState = {
  isPanning: boolean;
  startPosition: Position | null;
};

export type NodeCanvasState = {
  viewport: Viewport;
  gridSettings: GridSettings;
  isSpacePanning: boolean;
  panState: PanState;
};

export const nodeCanvasActions = {
  setViewport: createAction("SET_VIEWPORT", (viewport: Viewport) => ({ viewport })),
  panViewport: createAction("PAN_VIEWPORT", (delta: Position) => ({ delta })),
  zoomViewport: createAction("ZOOM_VIEWPORT", (scale: number, center?: Position) => ({ scale, center })),
  resetViewport: createAction("RESET_VIEWPORT"),
  updateGridSettings: createAction("UPDATE_GRID_SETTINGS", (settings: Partial<GridSettings>) => ({ settings })),
  setSpacePanning: createAction("SET_SPACE_PANNING", (isSpacePanning: boolean) => ({ isSpacePanning })),
  startPan: createAction("START_PAN", (position: Position) => ({ position })),
  updatePan: createAction("UPDATE_PAN", (position: Position) => ({ position })),
  endPan: createAction("END_PAN"),
} as const;

export type NodeCanvasAction = ActionUnion<typeof nodeCanvasActions>;

// Context types
export type NodeCanvasActionsValue = {
  dispatch: React.Dispatch<NodeCanvasAction>;
  actions: BoundActionCreators<typeof nodeCanvasActions>;
  actionCreators: typeof nodeCanvasActions;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  setContainerElement: (element: HTMLDivElement | null) => void;
};

export type NodeCanvasContextValue = NodeCanvasActionsValue & {
  state: NodeCanvasState;
  utils: ReturnType<typeof createCanvasUtils>;
};

// Split contexts for performance optimization
const NodeCanvasStateContext = React.createContext<NodeCanvasState | null>(null);
NodeCanvasStateContext.displayName = "NodeCanvasStateContext";

const NodeCanvasActionsContext = React.createContext<NodeCanvasActionsValue | null>(null);
NodeCanvasActionsContext.displayName = "NodeCanvasActionsContext";

// Combined context for backward compatibility
export const NodeCanvasContext = React.createContext<NodeCanvasContextValue | null>(null);
NodeCanvasContext.displayName = "NodeCanvasContext";

// Hooks

/**
 * Hook to access only the canvas state
 * Use this when you only need to read state and don't need actions
 */
export const useNodeCanvasState = (): NodeCanvasState => {
  const state = React.useContext(NodeCanvasStateContext);
  if (!state) {
    throw new Error("useNodeCanvasState must be used within a NodeCanvasProvider");
  }
  return state;
};

/**
 * Hook to access only the canvas actions
 * Use this when you only need to dispatch actions and don't need to re-render on state changes
 * The returned actions have stable references and won't cause re-renders
 */
export const useNodeCanvasActions = (): NodeCanvasActionsValue => {
  const actions = React.useContext(NodeCanvasActionsContext);
  if (!actions) {
    throw new Error("useNodeCanvasActions must be used within a NodeCanvasProvider");
  }
  return actions;
};

/**
 * Hook to access both state and actions (backward compatible)
 * Prefer useNodeCanvasState or useNodeCanvasActions for better performance
 */
export const useNodeCanvas = (): NodeCanvasContextValue => {
  const context = React.useContext(NodeCanvasContext);
  if (!context) {
    throw new Error("useNodeCanvas must be used within a NodeCanvasProvider");
  }
  return context;
};

/**
 * Hook to access only the bound action creators
 * @deprecated Use useNodeCanvasActions().actions instead
 */
export const useCanvasActions = (): BoundActionCreators<typeof nodeCanvasActions> => {
  const { actions } = useNodeCanvasActions();
  return actions;
};

/**
 * Hook to access state and actions
 * @deprecated Use useNodeCanvas() instead
 */
export const useCanvasState = (): { state: NodeCanvasState; actions: BoundActionCreators<typeof nodeCanvasActions> } => {
  const state = useNodeCanvasState();
  const { actions } = useNodeCanvasActions();
  return { state, actions };
};

// Export the split contexts for use in provider
export { NodeCanvasStateContext, NodeCanvasActionsContext };
