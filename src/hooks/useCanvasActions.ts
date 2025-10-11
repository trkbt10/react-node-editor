import * as React from "react";
import { useNodeCanvas } from "../contexts/NodeCanvasContext";

/**
 * Hook that provides pre-bound action creators for the Canvas
 * No need to call dispatch manually - actions are automatically dispatched
 */
export function useCanvasActions() {
  const { dispatch, actions } = useNodeCanvas();

  return React.useMemo(() => ({
    setViewport: (viewport: Parameters<typeof actions.setViewport>[0]) => dispatch(actions.setViewport(viewport)),
    panViewport: (delta: Parameters<typeof actions.panViewport>[0]) => dispatch(actions.panViewport(delta)),
    zoomViewport: (scale: Parameters<typeof actions.zoomViewport>[0], center?: Parameters<typeof actions.zoomViewport>[1]) => dispatch(actions.zoomViewport(scale, center)),
    resetViewport: () => dispatch(actions.resetViewport()),
    startPan: (position: Parameters<typeof actions.startPan>[0]) => dispatch(actions.startPan(position)),
    updatePan: (position: Parameters<typeof actions.updatePan>[0]) => dispatch(actions.updatePan(position)),
    endPan: () => dispatch(actions.endPan()),
  }), [dispatch, actions]);
}

/**
 * Hook that provides both state and pre-bound actions for the Canvas
 * Convenient alternative to useNodeCanvas when you need both state and actions
 */
export function useCanvasState() {
  const { state } = useNodeCanvas();
  const actions = useCanvasActions();

  return { state, actions };
}