/**
 * @file Context for managing canvas viewport, panning, zooming, and grid settings
 */
import * as React from "react";
import { bindActionCreators, createAction, createActionHandlerMap, type ActionUnion, type BoundActionCreators } from "../utils/typedActions";
import type { Position, Viewport, GridSettings } from "../types/core";
import { clampZoomScale } from "../utils/zoomUtils";

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

const nodeCanvasHandlers = createActionHandlerMap<NodeCanvasState, typeof nodeCanvasActions>(nodeCanvasActions, {
  setViewport: (state, action) => ({
    ...state,
    viewport: action.payload.viewport,
  }),
  panViewport: (state, action) => {
    const { delta } = action.payload;
    return {
      ...state,
      viewport: {
        ...state.viewport,
        offset: {
          x: state.viewport.offset.x + delta.x,
          y: state.viewport.offset.y + delta.y,
        },
      },
    };
  },
  zoomViewport: (state, action) => {
    const { scale, center } = action.payload;
    const newScale = clampZoomScale(scale);
    if (center) {
      const scaleRatio = newScale / state.viewport.scale;
      const newOffset = {
        x: center.x - (center.x - state.viewport.offset.x) * scaleRatio,
        y: center.y - (center.y - state.viewport.offset.y) * scaleRatio,
      };
      return {
        ...state,
        viewport: {
          offset: newOffset,
          scale: newScale,
        },
      };
    }
    return {
      ...state,
      viewport: {
        ...state.viewport,
        scale: newScale,
      },
    };
  },
  resetViewport: (state) => ({
    ...state,
    viewport: {
      offset: { x: 0, y: 0 },
      scale: 1,
    },
  }),
  updateGridSettings: (state, action) => ({
    ...state,
    gridSettings: {
      ...state.gridSettings,
      ...action.payload.settings,
    },
  }),
  setSpacePanning: (state, action) => ({
    ...state,
    isSpacePanning: action.payload.isSpacePanning,
  }),
  startPan: (state, action) => ({
    ...state,
    panState: {
      isPanning: true,
      startPosition: action.payload.position,
    },
  }),
  updatePan: (state, action) => {
    if (!state.panState.isPanning || !state.panState.startPosition) {
      return state;
    }
    const deltaX = action.payload.position.x - state.panState.startPosition.x;
    const deltaY = action.payload.position.y - state.panState.startPosition.y;
    return {
      ...state,
      viewport: {
        ...state.viewport,
        offset: {
          x: state.viewport.offset.x + deltaX,
          y: state.viewport.offset.y + deltaY,
        },
      },
      panState: {
        ...state.panState,
        startPosition: action.payload.position,
      },
    };
  },
  endPan: (state) => ({
    ...state,
    panState: {
      isPanning: false,
      startPosition: null,
    },
  }),
});

// Canvas reducer
export const nodeCanvasReducer = (state: NodeCanvasState, action: NodeCanvasAction): NodeCanvasState => {
  const handler = nodeCanvasHandlers[action.type];
  if (!handler) {
    return state;
  }
  return handler(state, action, undefined);
};

// Default state
export const defaultNodeCanvasState: NodeCanvasState = {
  viewport: {
    offset: { x: 0, y: 0 },
    scale: 1,
  },
  gridSettings: {
    enabled: false,
    size: 20,
    showGrid: true,
    snapToGrid: false,
    snapThreshold: 8,
  },
  isSpacePanning: false,
  panState: {
    isPanning: false,
    startPosition: null,
  },
};

// Utility functions for coordinate conversion
export const createCanvasUtils = (
  canvasRef: React.RefObject<HTMLDivElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null> | undefined,
  viewport: Viewport,
) => ({
  // Convert screen coordinates to canvas coordinates
  screenToCanvas: (screenX: number, screenY: number): Position => {
    const element = containerRef?.current ?? canvasRef.current;
    if (!element) {
      console.warn("Canvas ref is not available for coordinate conversion");
      return { x: screenX, y: screenY };
    }

    const rect = element.getBoundingClientRect();
    return {
      x: (screenX - rect.left - viewport.offset.x) / viewport.scale,
      y: (screenY - rect.top - viewport.offset.y) / viewport.scale,
    };
  },

  // Convert canvas coordinates to screen coordinates
  canvasToScreen: (canvasX: number, canvasY: number): Position => {
    const element = containerRef?.current ?? canvasRef.current;
    if (!element) {
      console.warn("Canvas ref is not available for coordinate conversion");
      return { x: canvasX, y: canvasY };
    }

    const rect = element.getBoundingClientRect();
    return {
      x: canvasX * viewport.scale + viewport.offset.x + rect.left,
      y: canvasY * viewport.scale + viewport.offset.y + rect.top,
    };
  },
});

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

// Provider
export type NodeCanvasProviderProps = {
  children: React.ReactNode;
  initialState?: Partial<NodeCanvasState>;
};

export const NodeCanvasProvider: React.FC<NodeCanvasProviderProps> = ({ children, initialState }) => {
  const [state, dispatch] = React.useReducer(nodeCanvasReducer, { ...defaultNodeCanvasState, ...initialState });

  const canvasRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const setContainerElement = React.useCallback((element: HTMLDivElement | null) => {
    containerRef.current = element;
  }, []);
  const boundActions = React.useMemo(() => bindActionCreators(nodeCanvasActions, dispatch), [dispatch]);

  // Stable actions value - refs and dispatch are stable
  const actionsValue = React.useMemo<NodeCanvasActionsValue>(
    () => ({
      dispatch,
      actions: boundActions,
      actionCreators: nodeCanvasActions,
      canvasRef,
      containerRef,
      setContainerElement,
    }),
    [dispatch, boundActions, setContainerElement],
  );

  // Utils depends on viewport state
  const utils = React.useMemo(
    () => createCanvasUtils(canvasRef, containerRef, state.viewport),
    [state.viewport],
  );

  // Combined context value for backward compatibility
  const contextValue = React.useMemo<NodeCanvasContextValue>(
    () => ({
      state,
      utils,
      ...actionsValue,
    }),
    [state, utils, actionsValue],
  );

  return (
    <NodeCanvasStateContext.Provider value={state}>
      <NodeCanvasActionsContext.Provider value={actionsValue}>
        <NodeCanvasContext.Provider value={contextValue}>{children}</NodeCanvasContext.Provider>
      </NodeCanvasActionsContext.Provider>
    </NodeCanvasStateContext.Provider>
  );
};

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

/**
 * Debug notes:
 * - Reviewed src/components/canvas/CanvasBase.tsx to keep zoom dispatch behavior consistent with updated clamping.
 */
