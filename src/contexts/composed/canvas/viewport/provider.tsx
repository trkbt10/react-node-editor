/**
 * @file Provider component for canvas viewport context
 */
import * as React from "react";
import { bindActionCreators, createActionHandlerMap } from "../../../../utils/typedActions";
import { clampZoomScale } from "./utils/zoomScale";
import { createCanvasUtils } from "./utils/coordinateConversion";
import {
  type NodeCanvasState,
  type NodeCanvasAction,
  type NodeCanvasActionsValue,
  type NodeCanvasContextValue,
  nodeCanvasActions,
  NodeCanvasStateContext,
  NodeCanvasActionsContext,
  NodeCanvasContext,
} from "./context";

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

/**
 * Debug notes:
 * - Reviewed src/components/canvas/CanvasBase.tsx to keep zoom dispatch behavior consistent with updated clamping.
 */
