/**
 * @file General settings panel component
 * Aggregation layer that combines general settings sections
 */
import * as React from "react";
import type { Size, NodeId } from "../../../types/core";
import { useNodeEditor } from "../../../contexts/composed/node-editor/context";
import { useNodeCanvasActions, useNodeCanvasViewportScale } from "../../../contexts/composed/canvas/viewport/context";
import { useNodeDefinitions } from "../../../contexts/node-definitions/context";
import {
  calculateAutoLayout,
  calculateNodesBoundingBox,
} from "../../../contexts/composed/node-editor/utils/autoLayout";
import type { LayoutAlgorithm } from "../../../contexts/composed/node-editor/utils/autoLayout";
import { DEFAULT_NODE_SIZE } from "../../../utils/boundingBoxUtils";
import { InspectorDefinitionList } from "../parts/InspectorDefinitionList";
import { AutoSaveSection } from "../../controls/autoSave/AutoSaveSection";
import { AutoLayoutSection } from "../../controls/autoLayout/AutoLayoutSection";
import { ConnectionPruneSection } from "../../controls/connectionPrune/ConnectionPruneSection";
import { findInvalidConnections } from "../../../contexts/composed/node-editor/utils/connectionPruning";

/**
 * General editor settings component
 */
export const GeneralSettingsPanel: React.FC = React.memo(() => {
  const { state, actions, settings, settingsManager, updateSetting } = useNodeEditor();
  const viewportScale = useNodeCanvasViewportScale();
  const { actions: canvasActions } = useNodeCanvasActions();
  const { registry } = useNodeDefinitions();
  const [layoutStrategy, setLayoutStrategy] = React.useState<LayoutAlgorithm>("auto");

  // Collect node sizes from NodeDefinition.defaultSize or node.size
  const nodeSizes = React.useMemo(() => {
    const sizes: Record<NodeId, Size> = {};
    Object.values(state.nodes).forEach((node) => {
      // Priority: node.size > NodeDefinition.defaultSize > DEFAULT_NODE_SIZE
      if (node.size) {
        sizes[node.id] = node.size;
      } else {
        const definition = registry.get(node.type);
        if (definition?.defaultSize) {
          sizes[node.id] = definition.defaultSize;
        } else {
          sizes[node.id] = DEFAULT_NODE_SIZE;
        }
      }
    });
    return sizes;
  }, [state.nodes, registry]);

  const handleAutoSaveToggle = React.useEffectEvent((enabled: boolean) => {
    updateSetting("general.autoSave", enabled);
  });

  const handleAutoSaveIntervalChange = React.useEffectEvent((interval: number) => {
    updateSetting("general.autoSaveInterval", interval);
  });

  const handleStrategyChange = React.useEffectEvent((strategy: LayoutAlgorithm) => {
    setLayoutStrategy(strategy);
  });

  const handleRunAutoLayout = React.useEffectEvent(() => {
    const result = calculateAutoLayout(state, { algorithm: layoutStrategy, nodeSizes });
    actions.moveNodes(result.nodePositions);

    const nodes = Object.values(state.nodes);
    const bbox = calculateNodesBoundingBox(nodes, result.nodePositions, nodeSizes);

    if (bbox.width > 0 && bbox.height > 0) {
      const viewportCenterX = typeof window !== "undefined" ? window.innerWidth / 2 : bbox.centerX;
      const viewportCenterY = typeof window !== "undefined" ? window.innerHeight / 2 : bbox.centerY;

      const newOffsetX = viewportCenterX - bbox.centerX * viewportScale;
      const newOffsetY = viewportCenterY - bbox.centerY * viewportScale;

      canvasActions.setViewport({
        offset: { x: newOffsetX, y: newOffsetY },
        scale: viewportScale,
      });
    }
  });

  const handleRunPrune = React.useEffectEvent(() => {
    actions.pruneInvalidConnections();
  });

  const settingsWritable = React.useMemo(() => Boolean(settingsManager), [settingsManager]);
  const hasNodes = React.useMemo(() => Object.keys(state.nodes).length > 0, [state.nodes]);
  const hasConnections = React.useMemo(() => Object.keys(state.connections).length > 0, [state.connections]);
  const nodeDefinitions = React.useMemo(() => registry.getAll(), [registry]);
  const invalidCount = React.useMemo(
    () => findInvalidConnections(state, nodeDefinitions).length,
    [state, nodeDefinitions],
  );

  const autoSaveInterval = settings.autoSaveInterval ?? 30;

  return (
    <InspectorDefinitionList>
      <AutoSaveSection
        autoSave={settings.autoSave}
        autoSaveInterval={autoSaveInterval}
        settingsWritable={settingsWritable}
        onAutoSaveToggle={handleAutoSaveToggle}
        onAutoSaveIntervalChange={handleAutoSaveIntervalChange}
      />
      <AutoLayoutSection
        hasNodes={hasNodes}
        selectedStrategy={layoutStrategy}
        onStrategyChange={handleStrategyChange}
        onRunAutoLayout={handleRunAutoLayout}
      />
      <ConnectionPruneSection
        hasConnections={hasConnections}
        invalidCount={invalidCount}
        onRunPrune={handleRunPrune}
      />
    </InspectorDefinitionList>
  );
});

GeneralSettingsPanel.displayName = "GeneralSettingsPanel";
