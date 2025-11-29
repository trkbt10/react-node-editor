/**
 * @file NodeEditor component
 */
import * as React from "react";
import { NodeEditorCore } from "./NodeEditorCore";
import type { NodeEditorData } from "./types/core";
import type { I18nMessages, I18nDictionaries, Locale } from "./i18n/types";
import { NodeEditorContent } from "./NodeEditorContent";
import type { SettingsManager } from "./settings/SettingsManager";
import type { ExternalDataReference, NodeDefinition } from "./types/NodeDefinition";
import type { FallbackDefinition } from "./types/NodeDefinitionRegistry";
import type { GridLayoutConfig, LayerDefinition } from "./types/panels";
import { type PortPositionBehavior } from "./types/portPosition";
import type { NodeEditorRendererOverrides } from "./types/renderers";
import type { NodeEditorInteractionSettingsPatch } from "./types/interaction";

export type NodeEditorProps = {
  /** Initial data for uncontrolled mode (like defaultValue) */
  initialData?: Partial<NodeEditorData>;
  /** Data for controlled mode (like value) */
  data?: NodeEditorData;
  onDataChange?: (data: NodeEditorData) => void;
  onSave?: (data: NodeEditorData) => void | Promise<void>;
  onLoad?: () => NodeEditorData | Promise<NodeEditorData>;
  /** Custom node definitions */
  nodeDefinitions?: NodeDefinition[];
  /** Whether to include default node definitions */
  includeDefaultDefinitions?: boolean;
  /**
   * Fallback definition for unknown node types.
   * - `true`: Use the default error node definition factory
   * - `false` or `undefined`: No fallback (returns undefined for unknown types)
   * - `NodeDefinition`: Use a fixed definition for all unknown types
   * - `(type: string) => NodeDefinition`: Use a factory function
   */
  fallbackDefinition?: FallbackDefinition | boolean;
  /** External data references for nodes */
  externalDataRefs?: Record<string, ExternalDataReference>;
  /** Settings manager instance */
  settingsManager?: SettingsManager;
  /** Grid layout configuration */
  gridConfig?: GridLayoutConfig;
  /** Grid layer definitions */
  gridLayers?: LayerDefinition[];
  // i18n options
  locale?: Locale;
  fallbackLocale?: Locale;
  messagesOverride?: Partial<Record<Locale, Partial<I18nMessages>>>;
  /** Additional locale dictionaries to make available beyond the default English bundle */
  localeDictionaries?: I18nDictionaries;
  /** Override: enable/disable auto-save regardless of settings */
  autoSaveEnabled?: boolean;
  /** Override: auto-save interval in seconds */
  autoSaveInterval?: number;
  /** Maximum number of history entries to keep */
  historyMaxEntries?: number;
  /** Renderer overrides for core editor visuals */
  renderers?: NodeEditorRendererOverrides;
  /** Customizes how node ports are positioned and rendered */
  portPositionBehavior?: PortPositionBehavior;
  /** Overrides for canvas interaction behavior (pan, pinch zoom, context menu) */
  interactionSettings?: NodeEditorInteractionSettingsPatch;
};

/**
 * NodeEditor - Main component that integrates all node editor functionality
 * Provides three separate contexts for managing different aspects of the editor
 */
export function NodeEditor({
  initialData,
  data,
  onDataChange,
  onSave,
  onLoad,
  nodeDefinitions,
  includeDefaultDefinitions = true,
  fallbackDefinition = true,
  externalDataRefs,
  settingsManager,
  gridConfig,
  gridLayers,
  locale,
  fallbackLocale,
  messagesOverride,
  localeDictionaries,
  autoSaveEnabled,
  autoSaveInterval,
  historyMaxEntries = 40,
  renderers,
  portPositionBehavior,
  interactionSettings,
}: NodeEditorProps) {
  return (
    <NodeEditorCore
      initialData={initialData}
      data={data}
      onDataChange={onDataChange}
      onSave={onSave}
      onLoad={onLoad}
      nodeDefinitions={nodeDefinitions}
      includeDefaultDefinitions={includeDefaultDefinitions}
      fallbackDefinition={fallbackDefinition}
      externalDataRefs={externalDataRefs}
      settingsManager={settingsManager}
      locale={locale}
      fallbackLocale={fallbackLocale}
      messagesOverride={messagesOverride}
      localeDictionaries={localeDictionaries}
      autoSaveEnabled={autoSaveEnabled}
      autoSaveInterval={autoSaveInterval}
      historyMaxEntries={historyMaxEntries}
      renderers={renderers}
      interactionSettings={interactionSettings}
    >
      <NodeEditorContent
        settingsManager={settingsManager}
        autoSaveEnabled={autoSaveEnabled}
        autoSaveInterval={autoSaveInterval}
        gridConfig={gridConfig}
        gridLayers={gridLayers}
        portPositionBehavior={portPositionBehavior}
      />
    </NodeEditorCore>
  );
}
