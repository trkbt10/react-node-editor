/**
 * @file Pre-bound action creators for node editor operations
 */
import { useNodeEditor } from "../contexts/node-editor/context";

/**
 * Hook that provides pre-bound action creators for the NodeEditor
 */
export function useNodeEditorActions() {
  const { actions } = useNodeEditor();
  return actions;
}

/**
 * Hook that provides both state and pre-bound actions for the NodeEditor
 * Convenient alternative to useNodeEditor when you need both state and actions
 */
export function useNodeEditorState() {
  const { state, actions } = useNodeEditor();
  return { state, actions };
}
