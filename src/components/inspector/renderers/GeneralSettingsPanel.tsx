/**
 * @file General settings panel component
 */
import * as React from "react";
import { useNodeEditor } from "../../../contexts/node-editor/context";
import { useNodeCanvas } from "../../../contexts/NodeCanvasContext";
import { SwitchInput } from "../../elements/SwitchInput";
import { useI18n } from "../../../i18n/context";
import { InspectorInput } from "../parts/InspectorInput";
import { InspectorButton } from "../parts/InspectorButton";
import { calculateAutoLayout, calculateNodesBoundingBox } from "../../../contexts/node-editor/utils/autoLayout";
import { InspectorDefinitionItem, InspectorDefinitionList } from "../parts/InspectorDefinitionList";

/**
 * General editor settings component
 */
export const GeneralSettingsPanel: React.FC = () => {
  const { state, actions, settings, settingsManager, updateSetting } = useNodeEditor();
  const { state: canvasState, actions: canvasActions } = useNodeCanvas();
  const { t } = useI18n();
  const [autoSaveIntervalInput, setAutoSaveIntervalInput] = React.useState<string>(() =>
    String(settings.autoSaveInterval ?? 30),
  );
  const [isAutoLayoutProcessing, setIsAutoLayoutProcessing] = React.useState(false);

  React.useEffect(() => {
    setAutoSaveIntervalInput(String(settings.autoSaveInterval ?? 30));
  }, [settings.autoSaveInterval]);

  const handleAutoSaveToggle = React.useCallback(
    (enabled: boolean) => {
      updateSetting("general.autoSave", enabled);
    },
    [updateSetting],
  );

  const handleAutoSaveIntervalChange = React.useCallback((value: string) => {
    setAutoSaveIntervalInput(value);
  }, []);

  const handleAutoSaveIntervalBlur = React.useCallback(() => {
    const interval = parseInt(autoSaveIntervalInput, 10);
    if (!Number.isNaN(interval) && interval >= 5 && interval <= 3600) {
      updateSetting("general.autoSaveInterval", interval);
    } else {
      setAutoSaveIntervalInput(String(settings.autoSaveInterval ?? 30));
    }
  }, [autoSaveIntervalInput, settings.autoSaveInterval, updateSetting]);

  const handleRunAutoLayout = React.useCallback(() => {
    setIsAutoLayoutProcessing(true);
    try {
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
    } catch (error) {
      console.error("Auto-layout failed:", error);
    } finally {
      setIsAutoLayoutProcessing(false);
    }
  }, [state, actions, canvasState.viewport.scale, canvasActions]);

  const settingsWritable = Boolean(settingsManager);
  const hasNodes = Object.keys(state.nodes).length > 0;

  return (
    <>
      <InspectorDefinitionList>
        <React.Activity mode={settingsWritable ? "visible" : "hidden"}>
          <InspectorDefinitionItem label={t("inspectorAutoSave")}>
            <SwitchInput
              id="auto-save"
              checked={settings.autoSave}
              onChange={handleAutoSaveToggle}
              size="medium"
              disabled={!settingsWritable}
            />
          </InspectorDefinitionItem>
          <InspectorDefinitionItem label={t("inspectorAutoSaveInterval")}>
            <InspectorInput
              id="auto-save-interval"
              name="autoSaveInterval"
              type="number"
              value={autoSaveIntervalInput}
              min={5}
              max={3600}
              step={5}
              onChange={(e) => handleAutoSaveIntervalChange(e.target.value)}
              onBlur={handleAutoSaveIntervalBlur}
              disabled={!settingsWritable}
              aria-label="Auto-save interval in seconds"
            />
          </InspectorDefinitionItem>
        </React.Activity>
        <InspectorDefinitionItem label={t("autoLayout")}>
          <InspectorButton onClick={handleRunAutoLayout} disabled={isAutoLayoutProcessing || !hasNodes}>
            {t("autoLayoutPanelRun")}
          </InspectorButton>
        </InspectorDefinitionItem>
      </InspectorDefinitionList>
    </>
  );
};

GeneralSettingsPanel.displayName = "GeneralSettingsPanel";
