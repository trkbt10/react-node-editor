/**
 * @file Node Editor - Core exports (without panel implementations)
 * @description
 * This module exports the core functionality of the node editor,
 * excluding built-in panel components (Inspector, NodePalette, etc.).
 * Use this when you want to build your own panel system while using
 * the core node editor functionality.
 */

// Core editor component and props
export { NodeEditor } from "./NodeEditor";
export type { NodeEditorProps } from "./NodeEditor";

// Core components for custom layouts (without panel dependencies)
export { NodeEditorCore } from "./NodeEditorCore";
export type { NodeEditorCoreProps } from "./NodeEditorCore";
export { NodeEditorCanvas } from "./components/canvas/NodeEditorCanvas";
export type { NodeEditorCanvasProps } from "./components/canvas/NodeEditorCanvas";

export type { NodeEditorData } from "./types/core";
export type { NodeEditorRenderers, NodeEditorRendererOverrides } from "./types/renderers";

// Helper components for custom node implementations
export { NodeResizer, normalizeNodeSize } from "./components/node/NodeResizer";
export type { NodeResizerProps } from "./components/node/NodeResizer";

// Node definition helpers for custom nodes and inspectors
export {
  createNodeDataUpdater,
  createNodeDefinition,
  getTypedNodeData,
  toUntypedDefinition,
} from "./types/NodeDefinition";
export type {
  ConnectionRenderContext,
  ExternalDataReference,
  InspectorRenderProps,
  NodeDataTypeMap,
  NodeDefinition,
  NodeRenderProps,
  PortDefinition,
  PortRenderContext,
} from "./types/NodeDefinition";

// Node definition registry
export { createNodeDefinitionRegistry } from "./types/NodeDefinitionRegistry";
export type { NodeDefinitionRegistry } from "./types/NodeDefinitionRegistry";

// Behavior configuration for nodes
export type {
  AppearanceBehaviorOptions,
  GroupBehaviorOptions,
  NodeBehavior,
  NodeBehaviorOptions,
  NodeBehaviorType,
  ObjectBehaviorOptions,
} from "./types/behaviors";

// Core graph types used by custom definitions
export type { Connection, ConnectionId, Node, NodeId, Port, PortId } from "./types/core";

// Port positioning customization
export type {
  EditorPortPositions,
  NodePortPositions,
  PortPosition,
  PortPositionBehavior,
  PortPositionConfig,
  PortPositionNode,
} from "./types/portPosition";
export { DEFAULT_PORT_POSITION_CONFIG } from "./types/portPosition";

// Layout and panel configuration for custom panels
export type {
  EditorPanelsConfig,
  GridLayoutConfig,
  GridTrack,
  LayerDefinition,
  PanelDefinition,
  PanelPosition,
} from "./types/panels";

// Default configuration surface
export { defaultEditorGridConfig, defaultEditorGridLayers } from "./config/defaultLayout";
export { defaultSettings } from "./settings/defaultSettings";
export { SettingsManager, LocalSettingsStorage } from "./settings/SettingsManager";
export type {
  CanvasPanActivator,
  ContextMenuRequest,
  ContextMenuTarget,
  ContextMenuBehavior,
  NodeEditorInteractionSettings,
  NodeEditorInteractionSettingsPatch,
  KeyboardShortcutBehavior,
  KeyboardShortcutActionBehavior,
  NodeEditorShortcutAction,
  ShortcutBinding,
  PinchZoomSettings,
} from "./types/interaction";
