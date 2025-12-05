/**
 * @file General settings panel component
 * Aggregation layer that combines general settings sections
 */
import * as React from "react";
import type { Size, NodeId } from "../../../types/core";
import { useNodeEditor } from "../../../contexts/composed/node-editor/context";
import { useNodeCanvas } from "../../../contexts/composed/canvas/viewport/context";
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

/**
 * General editor settings component
 */
export const GeneralSettingsPanel: React.FC = React.memo(() => {
  const { state, actions, settings, settingsManager, updateSetting } = useNodeEditor();
  const { state: canvasState, actions: canvasActions } = useNodeCanvas();
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

      const newOffsetX = viewportCenterX - bbox.centerX * canvasState.viewport.scale;
      const newOffsetY = viewportCenterY - bbox.centerY * canvasState.viewport.scale;

      canvasActions.setViewport({
        offset: { x: newOffsetX, y: newOffsetY },
        scale: canvasState.viewport.scale,
      });
    }
  });

  const settingsWritable = React.useMemo(() => Boolean(settingsManager), [settingsManager]);
  const hasNodes = React.useMemo(() => Object.keys(state.nodes).length > 0, [state.nodes]);

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
    </InspectorDefinitionList>
  );
});

GeneralSettingsPanel.displayName = "GeneralSettingsPanel";
