/**
 * @file Context for managing canvas viewport, panning, zooming, and grid settings
 */
import * as React from "react";
import { createAction, createActionHandlerMap, type ActionUnion } from "../utils/typedActions";
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
export const createCanvasUtils = (canvasRef: React.RefObject<HTMLDivElement | null>, viewport: Viewport) => ({
  // Convert screen coordinates to canvas coordinates
  screenToCanvas: (screenX: number, screenY: number): Position => {
    if (!canvasRef.current) {
      console.warn("Canvas ref is not available for coordinate conversion");
      return { x: screenX, y: screenY };
    }

    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - viewport.offset.x) / viewport.scale,
      y: (screenY - rect.top - viewport.offset.y) / viewport.scale,
    };
  },

  // Convert canvas coordinates to screen coordinates
  canvasToScreen: (canvasX: number, canvasY: number): Position => {
    if (!canvasRef.current) {
      console.warn("Canvas ref is not available for coordinate conversion");
      return { x: canvasX, y: canvasY };
    }

    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: canvasX * viewport.scale + viewport.offset.x + rect.left,
      y: canvasY * viewport.scale + viewport.offset.y + rect.top,
    };
  },
});

// Context
export type NodeCanvasContextValue = {
  state: NodeCanvasState;
  dispatch: React.Dispatch<NodeCanvasAction>;
  actions: typeof nodeCanvasActions;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  utils: ReturnType<typeof createCanvasUtils>;
};

export const NodeCanvasContext = React.createContext<NodeCanvasContextValue | null>(null);

// Provider
export type NodeCanvasProviderProps = {
  children: React.ReactNode;
  initialState?: Partial<NodeCanvasState>;
};

export const NodeCanvasProvider: React.FC<NodeCanvasProviderProps> = ({ children, initialState }) => {
  const [state, dispatch] = React.useReducer(nodeCanvasReducer, { ...defaultNodeCanvasState, ...initialState });

  const canvasRef = React.useRef<HTMLDivElement>(null);

  const utils = React.useMemo(() => createCanvasUtils(canvasRef, state.viewport), [state.viewport]);

  const contextValue: NodeCanvasContextValue = {
    state,
    dispatch,
    actions: nodeCanvasActions,
    canvasRef,
    utils,
  };

  return <NodeCanvasContext.Provider value={contextValue}>{children}</NodeCanvasContext.Provider>;
};

// Hook
export const useNodeCanvas = (): NodeCanvasContextValue => {
  const context = React.useContext(NodeCanvasContext);
  if (!context) {
    throw new Error("useNodeCanvas must be used within a NodeCanvasProvider");
  }
  return context;
};

/**
 * Debug notes:
 * - Reviewed src/components/canvas/CanvasBase.tsx to keep zoom dispatch behavior consistent with updated clamping.
 */
