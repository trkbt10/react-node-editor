/**
 * @file Node Editor - Main exports
 */
import "./global.css";
// Main component
export { NodeEditor } from "./NodeEditor";
export type { NodeEditorProps } from "./NodeEditor";
export type { NodeEditorRenderers, NodeEditorRendererOverrides } from "./types/renderers";

// Core types
export type {
  NodeId,
  ConnectionId,
  PortId,
  Position,
  Size,
  Bounds,
  Port,
  Node,
  Connection,
  NodeEditorData,
  Viewport,
  GridSettings,
  DragState,
  ResizeState,
  ResizeHandle,
  ConnectionDragState,
  ContextMenuState,
  EditorSettings,
} from "./types/core";

export type {
  NodeDefinition,
  ExternalDataReference,
  NodeRenderProps,
  InspectorRenderProps,
  ConstraintContext,
  ConstraintViolation,
  ConstraintValidationResult,
  NodeConstraint,
  NodeDataTypeMap,
} from "./types/NodeDefinition";

export {
  createNodeDefinition,
  getTypedNodeData,
  createNodeDataUpdater,
  asOriginalNodeRender,
  asOriginalInspectorRender,
  toUntypedDefinition,
} from "./types/NodeDefinition";

// Context providers (for advanced usage)
export {
  NodeEditorProvider,
  NodeDefinitionProvider,
  ExternalDataProvider,
  InlineEditingProvider,
  EditorActionStateProvider,
  NodeCanvasProvider,
  HistoryProvider,
  KeyboardShortcutProvider,
  NodeEditorSettingsProvider,
  useNodeEditorSettings,
} from "./contexts";

// Hooks for custom layers and components
export * from "./hooks";

// Layer components
export { Minimap, DebugOverlay, GridToolbox, NodeMapRenderer } from "./components/layers";

export type { MinimapProps, DebugOverlayProps, GridToolboxProps, NodeMapRendererProps } from "./components/layers";

// UI components
export { NodeCanvas } from "./components/canvas/NodeCanvas";
export { StatusBar } from "./components/layout/StatusBar";
export { NodeEditorToolbar } from "./components/layout/NodeEditorToolbar";
export { FloatingContainer } from "./components/shared/FloatingContainer";
export { GridLayout } from "./components/layout/GridLayout";
export {
  InspectorPanel,
  InspectorLayersTab,
  InspectorPropertiesTab,
  InspectorHistoryTab,
} from "./components/inspector/InspectorPanel";
export { GridSettingsPanel, GeneralSettingsPanel } from "./settings";
export { NodeInspector } from "./components/inspector/NodeInspector";
export type { NodeCanvasProps } from "./components/canvas/NodeCanvas";
export type { NodeEditorToolbarProps } from "./components/layout/NodeEditorToolbar";
export type { FloatingContainerProps } from "./components/shared/FloatingContainer";
export type { GridLayoutProps } from "./components/layout/GridLayout";
export type {
  InspectorPanelProps,
  InspectorPanelTabConfig,
  InspectorSettingsPanelConfig,
} from "./components/inspector/InspectorPanel";
export type { NodeInspectorProps } from "./components/inspector/NodeInspector";

// Layout system types
export type {
  // New grid-based layout system
  EditorGridLayout,
  GridLayoutConfig,
  GridTrack,
  LayerDefinition,
  LayerPositionMode,
  // Legacy panel system (deprecated)
  PanelPosition,
  PanelDefinition,
  EditorPanelsConfig,
} from "./types/panels";

// Layout system constants
export { defaultEditorGridConfig, defaultEditorGridLayers } from "./config/defaultLayout";

// Utilities for custom components
export {
  getNodeBoundingBox,
  createBoundingBox,
  doRectanglesIntersect,
  isRectangleInsideAnother,
  DEFAULT_NODE_SIZE,
} from "./utils/boundingBoxUtils";

export { getDistance, getVector, addVectors, subtractVectors, scaleVector } from "./utils/vectorUtils";

export { calculateNodeDragOffsets, getDraggedNodesBounds } from "./utils/dragUtils";

export {
  createPortToNodeMap,
  createParentToChildrenMap,
  createConnectionLookupMaps,
  SpatialGrid,
} from "./utils/lookupUtils";

// Port position utilities
export { computeNodePortPositions, computeAllPortPositions, updatePortPositions } from "./utils/computePortPositions";

export type {
  PortPosition,
  NodePortPositions,
  EditorPortPositions,
  PortPositionConfig,
  PortPositionBehavior,
  PortPositionNode,
} from "./types/portPosition";

export { DEFAULT_PORT_POSITION_CONFIG } from "./types/portPosition";

// Port position context
export {
  PortPositionProvider,
  usePortPositions,
  usePortPosition,
  useNodePortPositions,
} from "./contexts/PortPositionContext";
export type { PortPositionContextValue, PortPositionProviderProps } from "./contexts/PortPositionContext";

// Settings system
export { SettingsManager, LocalSettingsStorage } from "./settings/SettingsManager";
export { defaultSettings } from "./settings/defaultSettings";
export type {
  SettingDefinition,
  SettingCategory,
  SettingsValues,
  SettingValue,
  SettingsChangeEvent,
  SettingsValidationResult,
  SettingsStorage,
} from "./settings/types";
