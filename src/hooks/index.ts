/**
 * Re-export all hooks for easy access by custom layers
 */

// Core editor hooks
export { useNodeEditor } from "../contexts/node-editor";
export { useNodeCanvas } from "../contexts/NodeCanvasContext";
export { useEditorActionState } from "../contexts/EditorActionStateContext";
export { useInlineEditing } from "../contexts/InlineEditingContext";

// Node definition hooks
export { useNodeDefinitions, useNodeDefinition, useNodeDefinitionList } from "../contexts/NodeDefinitionContext";

// External data hooks
export { useExternalDataRef } from "../contexts/ExternalDataContext";

// Specialized hooks
export { useNodeResize } from "./useNodeResize";
export { useGroupManagement } from "./useGroupManagement";
export { usePointerDrag } from "./usePointerDrag";
export { usePointerInteraction } from "./usePointerInteraction";

// Utility hooks
export { useDocumentPointerEvents, usePointerCapture, usePreventPointerDefaults, useDragPointerEvents } from "./useDocumentPointerEvents";

// Pre-bound action hooks (no need to call dispatch)
export { useNodeEditorActions, useNodeEditorState } from "./useNodeEditorActions";
export { useCanvasActions, useCanvasState } from "./useCanvasActions";
export { useActionStateActions, useActionState } from "./useActionStateActions";
export { useEditorActions, useCommonActions } from "./useEditorActions";

// Settings hook
export { useSettings } from "./useSettings";

// Performance optimization hooks
export { useVisibleNodes } from "./useVisibleNodes";
export { useBatchedUpdates } from "./useBatchedUpdates";

// Port position hooks
export { useDynamicPortPosition, useDynamicConnectionPoint } from "./usePortPosition";

// Type exports for custom layers
export type { UseNodeResizeResult } from "./useNodeResize";
export type { UseGroupManagementResult } from "./useGroupManagement";
export type { PointerDragOptions, PointerDragState } from "./usePointerDrag";
export type { UseDocumentPointerEventsOptions } from "./useDocumentPointerEvents";
export type { PointerInteractionConfig } from "./usePointerInteraction";
