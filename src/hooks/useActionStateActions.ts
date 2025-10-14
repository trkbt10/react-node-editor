/**
 * @file Hooks providing pre-bound action creators for editor action state management
 */
import { useEditorActionState } from "../contexts/EditorActionStateContext";

/**
 * Hook that provides pre-bound action creators for the Editor Action State
 */
export function useActionStateActions() {
  const { actions } = useEditorActionState();
  return actions;
}

/**
 * Hook that provides both state and pre-bound actions for the Editor Action State
 * Convenient alternative to useEditorActionState when you need both state and actions
 */
export function useActionState() {
  const { state, actions } = useEditorActionState();
  return { state, actions };
}
