import { useNodeEditorActions } from "./useNodeEditorActions";
import { useCanvasActions } from "./useCanvasActions";
import { useActionStateActions } from "./useActionStateActions";

/**
 * Hook that provides all pre-bound action creators in one convenient object
 * Combines actions from all editor contexts without needing to call dispatch
 * 
 * @example
 * ```tsx
 * const actions = useEditorActions();
 * 
 * // Direct action calls without dispatch
 * actions.editor.addNode(newNode);
 * actions.canvas.setViewport(newViewport);
 * actions.interaction.selectNode(nodeId);
 * ```
 */
export function useEditorActions() {
  const editorActions = useNodeEditorActions();
  const canvasActions = useCanvasActions();
  const interactionActions = useActionStateActions();

  return {
    /** Node editor actions (add/remove/update nodes and connections) */
    editor: editorActions,
    /** Canvas viewport and grid actions */
    canvas: canvasActions,
    /** User interaction actions (drag, resize, selection) */
    interaction: interactionActions,
  };
}

/**
 * Hook that provides common editor actions with semantic names
 * More intuitive for basic operations
 */
export function useCommonActions() {
  const actions = useEditorActions();

  return {
    // Node operations
    addNode: actions.editor.addNode,
    removeNode: actions.editor.deleteNode,
    updateNode: actions.editor.updateNode,
    duplicateNodes: actions.editor.duplicateNodes,
    
    // Connection operations
    addConnection: actions.editor.addConnection,
    removeConnection: actions.editor.deleteConnection,
    
    // Selection operations
    selectNode: actions.interaction.selectNode,
    selectAllNodes: actions.interaction.selectAllNodes,
    clearSelection: actions.interaction.clearSelection,
    
    // Viewport operations
    setViewport: actions.canvas.setViewport,
    panViewport: actions.canvas.panViewport,
    zoomViewport: actions.canvas.zoomViewport,
    resetViewport: actions.canvas.resetViewport,
    
    
    // Context menu
    showContextMenu: actions.interaction.showContextMenu,
    hideContextMenu: actions.interaction.hideContextMenu,
  };
}