/**
 * @file Pre-bound action creators for canvas viewport operations
 */
import { useNodeCanvas } from "../contexts/NodeCanvasContext";

/**
 * Hook that provides pre-bound action creators for the Canvas
 * No need to call dispatch manually - actions are automatically dispatched
 */
export function useCanvasActions() {
  const { actions } = useNodeCanvas();
  return actions;
}

/**
 * Hook that provides both state and pre-bound actions for the Canvas
 * Convenient alternative to useNodeCanvas when you need both state and actions
 */
export function useCanvasState() {
  const { state, actions } = useNodeCanvas();
  return { state, actions };
}
