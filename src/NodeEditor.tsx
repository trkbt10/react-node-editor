/**
 * @file NodeEditor component
 */
import * as React from "react";
import { ConnectionView as DefaultConnectionView } from "./components/connection/ConnectionView";
import { PortView as DefaultPortView } from "./components/connection/ports/PortView";
import { NodeView as DefaultNodeView } from "./components/node/NodeView";
import { EditorActionStateProvider } from "./contexts/EditorActionStateContext";
import { ExternalDataProvider } from "./contexts/ExternalDataContext";
import { HistoryProvider } from "./contexts/HistoryContext";
import { InlineEditingProvider } from "./contexts/InlineEditingContext";
import { KeyboardShortcutProvider } from "./contexts/KeyboardShortcutContext";
import { NodeEditorProvider, type NodeEditorData } from "./contexts/node-editor";
import { NodeCanvasProvider } from "./contexts/NodeCanvasContext";
import { NodeDefinitionProvider } from "./contexts/node-definitions";
import { RendererProvider } from "./contexts/RendererContext";
import { I18nProvider, enMessages, type I18nMessages, type I18nDictionaries, type Locale } from "./i18n";
import { NodeEditorContent } from "./NodeEditorContent";
import type { SettingsManager } from "./settings/SettingsManager";
import type { ExternalDataReference, NodeDefinition } from "./types/NodeDefinition";
import type { GridLayoutConfig, LayerDefinition } from "./types/panels";
import { type PortPositionBehavior } from "./types/portPosition";
import type { NodeEditorRendererOverrides } from "./types/renderers";

export type NodeEditorProps = {
  /** Initial data for uncontrolled mode (like defaultValue) */
  initialData?: Partial<NodeEditorData>;
  /** Data for controlled mode (like value) */
  data?: NodeEditorData;
  onDataChange?: (data: NodeEditorData) => void;
  onSave?: (data: NodeEditorData) => void | Promise<void>;
  onLoad?: () => NodeEditorData | Promise<NodeEditorData>;
  className?: string;
  /** Custom node definitions */
  nodeDefinitions?: NodeDefinition[];
  /** Whether to include default node definitions */
  includeDefaultDefinitions?: boolean;
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
  className,
  nodeDefinitions,
  includeDefaultDefinitions = true,
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
}: NodeEditorProps) {
  const mergedRenderers = React.useMemo(
    () => ({
      node: renderers?.node ?? DefaultNodeView,
      port: renderers?.port ?? DefaultPortView,
      connection: renderers?.connection ?? DefaultConnectionView,
    }),
    [renderers],
  );

  const dictionaries = React.useMemo<I18nDictionaries>(() => {
    return {
      en: enMessages,
      ...(localeDictionaries ?? {}),
    };
  }, [localeDictionaries]);

  return (
    <I18nProvider
      dictionaries={dictionaries}
      initialLocale={locale}
      fallbackLocale={fallbackLocale}
      messagesOverride={messagesOverride}
    >
      <RendererProvider renderers={mergedRenderers}>
        <NodeDefinitionProvider nodeDefinitions={nodeDefinitions} includeDefaults={includeDefaultDefinitions}>
          <ExternalDataProvider refs={externalDataRefs}>
            <NodeEditorProvider
              initialState={initialData}
              controlledData={data}
              onDataChange={onDataChange}
              onSave={onSave}
              onLoad={onLoad}
              settingsManager={settingsManager}
              autoSaveEnabled={autoSaveEnabled}
              autoSaveInterval={autoSaveInterval}
            >
              <EditorActionStateProvider>
                <NodeCanvasProvider>
                  <HistoryProvider maxEntries={historyMaxEntries}>
                    <InlineEditingProvider>
                      <KeyboardShortcutProvider>
                        <NodeEditorContent
                          className={className}
                          settingsManager={settingsManager}
                          autoSaveEnabled={autoSaveEnabled}
                          autoSaveInterval={autoSaveInterval}
                          gridConfig={gridConfig}
                          gridLayers={gridLayers}
                          portPositionBehavior={portPositionBehavior}
                        />
                      </KeyboardShortcutProvider>
                    </InlineEditingProvider>
                  </HistoryProvider>
                </NodeCanvasProvider>
              </EditorActionStateProvider>
            </NodeEditorProvider>
          </ExternalDataProvider>
        </NodeDefinitionProvider>
      </RendererProvider>
    </I18nProvider>
  );
}
