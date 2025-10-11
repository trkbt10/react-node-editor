import * as React from "react";
import type { Position, Viewport, GridSettings } from "../types/core";

export type PanState = {
  isPanning: boolean;
  startPosition: Position | null;
}

export type NodeCanvasState = {
  viewport: Viewport;
  gridSettings: GridSettings;
  isSpacePanning: boolean;
  panState: PanState;
}

// Canvas actions
export type NodeCanvasAction =
  | { type: "SET_VIEWPORT"; payload: { viewport: Viewport } }
  | { type: "PAN_VIEWPORT"; payload: { delta: Position } }
  | { type: "ZOOM_VIEWPORT"; payload: { scale: number; center?: Position } }
  | { type: "RESET_VIEWPORT" }
  | { type: "UPDATE_GRID_SETTINGS"; payload: { settings: Partial<GridSettings> } }
  | { type: "SET_SPACE_PANNING"; payload: { isSpacePanning: boolean } }
  | { type: "START_PAN"; payload: { position: Position } }
  | { type: "UPDATE_PAN"; payload: { position: Position } }
  | { type: "END_PAN" };

// Canvas reducer
export const nodeCanvasReducer = (state: NodeCanvasState, action: NodeCanvasAction): NodeCanvasState => {
  switch (action.type) {
    case "SET_VIEWPORT":
      return {
        ...state,
        viewport: action.payload.viewport,
      };

    case "PAN_VIEWPORT": {
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
    }

    case "ZOOM_VIEWPORT": {
      const { scale, center } = action.payload;
      // Figma-style zoom limits: 1% to 6400%
      const newScale = Math.max(0.01, Math.min(64, scale));

      if (center) {
        // Zoom relative to center point
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
    }

    case "RESET_VIEWPORT":
      return {
        ...state,
        viewport: {
          offset: { x: 0, y: 0 },
          scale: 1,
        },
      };

    case "UPDATE_GRID_SETTINGS":
      return {
        ...state,
        gridSettings: {
          ...state.gridSettings,
          ...action.payload.settings,
        },
      };

    case "SET_SPACE_PANNING":
      return {
        ...state,
        isSpacePanning: action.payload.isSpacePanning,
      };

    case "START_PAN":
      return {
        ...state,
        panState: {
          isPanning: true,
          startPosition: action.payload.position,
        },
      };

    case "UPDATE_PAN": {
      if (!state.panState.isPanning || !state.panState.startPosition) {return state;}

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
    }

    case "END_PAN":
      return {
        ...state,
        panState: {
          isPanning: false,
          startPosition: null,
        },
      };

    default:
      return state;
  }
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

// Canvas action creators
export const nodeCanvasActions = {
  setViewport: (viewport: Viewport): NodeCanvasAction => ({
    type: "SET_VIEWPORT",
    payload: { viewport },
  }),
  panViewport: (delta: { x: number; y: number }): NodeCanvasAction => ({
    type: "PAN_VIEWPORT",
    payload: { delta },
  }),
  zoomViewport: (scale: number, center?: { x: number; y: number }): NodeCanvasAction => ({
    type: "ZOOM_VIEWPORT",
    payload: { scale, center },
  }),
  resetViewport: (): NodeCanvasAction => ({
    type: "RESET_VIEWPORT",
  }),
  updateGridSettings: (settings: Partial<GridSettings>): NodeCanvasAction => ({
    type: "UPDATE_GRID_SETTINGS",
    payload: { settings },
  }),
  setSpacePanning: (isSpacePanning: boolean): NodeCanvasAction => ({
    type: "SET_SPACE_PANNING",
    payload: { isSpacePanning },
  }),
  startPan: (position: { x: number; y: number }): NodeCanvasAction => ({
    type: "START_PAN",
    payload: { position },
  }),
  updatePan: (position: { x: number; y: number }): NodeCanvasAction => ({
    type: "UPDATE_PAN",
    payload: { position },
  }),
  endPan: (): NodeCanvasAction => ({
    type: "END_PAN",
  }),
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
}

export const NodeCanvasContext = React.createContext<NodeCanvasContextValue | null>(null);

// Provider
export type NodeCanvasProviderProps = {
  children: React.ReactNode;
  initialState?: Partial<NodeCanvasState>;
}

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
