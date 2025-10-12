/**
 * @file Node Editor - Main exports
 */
import "./global.css";

// Core editor component and props
export { NodeEditor } from "./NodeEditor";
export type { NodeEditorProps } from "./NodeEditor";
export type { NodeEditorData } from "./contexts/node-editor";
export type { NodeEditorRenderers, NodeEditorRendererOverrides } from "./types/renderers";

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
