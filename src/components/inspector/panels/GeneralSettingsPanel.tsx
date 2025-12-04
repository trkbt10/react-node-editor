/**
 * @file General settings panel component
 * Aggregation layer that combines general settings sections
 */
import * as React from "react";
import { useNodeEditor } from "../../../contexts/composed/node-editor/context";
import { useNodeCanvas } from "../../../contexts/composed/canvas/viewport/context";
import {
  calculateAutoLayout,
  calculateNodesBoundingBox,
} from "../../../contexts/composed/node-editor/utils/autoLayout";
import { InspectorDefinitionList } from "../parts/InspectorDefinitionList";
import { AutoSaveSection } from "../../controls/autoSave/AutoSaveSection";
import { AutoLayoutSection } from "../../controls/autoLayout/AutoLayoutSection";

/**
 * General editor settings component
 */
export const GeneralSettingsPanel: React.FC = () => {
  const { state, actions, settings, settingsManager, updateSetting } = useNodeEditor();
  const { state: canvasState, actions: canvasActions } = useNodeCanvas();

  const handleAutoSaveToggle = React.useEffectEvent((enabled: boolean) => {
    updateSetting("general.autoSave", enabled);
  });

  const handleAutoSaveIntervalChange = React.useEffectEvent((interval: number) => {
    updateSetting("general.autoSaveInterval", interval);
  });

  const handleRunAutoLayout = React.useEffectEvent(() => {
    const result = calculateAutoLayout(state);
    actions.moveNodes(result.nodePositions);

    const nodes = Object.values(state.nodes);
    const bbox = calculateNodesBoundingBox(nodes, result.nodePositions);

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

  const settingsWritable = Boolean(settingsManager);
  const hasNodes = Object.keys(state.nodes).length > 0;

  return (
    <InspectorDefinitionList>
      <AutoSaveSection
        autoSave={settings.autoSave}
        autoSaveInterval={settings.autoSaveInterval ?? 30}
        settingsWritable={settingsWritable}
        onAutoSaveToggle={handleAutoSaveToggle}
        onAutoSaveIntervalChange={handleAutoSaveIntervalChange}
      />
      <AutoLayoutSection hasNodes={hasNodes} onRunAutoLayout={handleRunAutoLayout} />
    </InspectorDefinitionList>
  );
};

GeneralSettingsPanel.displayName = "GeneralSettingsPanel";
