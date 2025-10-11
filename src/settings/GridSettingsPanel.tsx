import * as React from "react";
import { useNodeCanvas } from "../contexts/NodeCanvasContext";
import { Label, SwitchInput } from "../components/elements";
import { useI18n } from "../i18n";
import { SettingsField, SettingsInput } from "./components";

/**
 * Grid settings component
 */
export const GridSettingsPanel: React.FC = () => {
  const { state: canvasState, dispatch: canvasDispatch, actions: canvasActions } = useNodeCanvas();
  const { t } = useI18n();

  return (
    <>
      <SettingsField>
        <SwitchInput
          id="grid-show"
          checked={canvasState.gridSettings.showGrid}
          onChange={(checked) => canvasDispatch(canvasActions.updateGridSettings({ showGrid: checked }))}
          label={t("inspectorShowGrid")}
          size="medium"
        />
      </SettingsField>
      <SettingsField>
        <SwitchInput
          id="grid-snap"
          checked={canvasState.gridSettings.snapToGrid}
          onChange={(checked) => canvasDispatch(canvasActions.updateGridSettings({ snapToGrid: checked }))}
          label={t("inspectorSnapToGrid")}
          size="medium"
        />
      </SettingsField>
      <SettingsField>
        <Label htmlFor="grid-size">
          {t("inspectorGridSize")}:
          <SettingsInput
            id="grid-size"
            name="gridSize"
            type="number"
            value={canvasState.gridSettings.size}
            min={10}
            max={100}
            step={5}
            onChange={(e) => {
              const size = parseInt(e.target.value, 10);
              if (!isNaN(size) && size > 0) {
                canvasDispatch(
                  canvasActions.updateGridSettings({
                    size,
                  })
                );
              }
            }}
            aria-label="Grid size in pixels"
          />
        </Label>
      </SettingsField>
      <SettingsField>
        <Label htmlFor="snap-threshold">
          {t("inspectorSnapThreshold")}:
          <SettingsInput
            id="snap-threshold"
            name="snapThreshold"
            type="number"
            value={canvasState.gridSettings.snapThreshold}
            min={1}
            max={20}
            step={1}
            onChange={(e) => {
              const snapThreshold = parseInt(e.target.value, 10);
              if (!isNaN(snapThreshold) && snapThreshold > 0) {
                canvasDispatch(
                  canvasActions.updateGridSettings({
                    snapThreshold,
                  })
                );
              }
            }}
            aria-label="Snap threshold in pixels"
          />
        </Label>
      </SettingsField>
    </>
  );
};

GridSettingsPanel.displayName = "GridSettingsPanel";
