/**
 * @file Grid settings panel component
 * Aggregation layer that combines grid settings sections
 */
import * as React from "react";
import { useNodeCanvasActions, useNodeCanvasGridSettings } from "../../../contexts/composed/canvas/viewport/context";
import { GridVisibilitySection } from "../../controls/gridSettings/GridVisibilitySection";
import { GridSizeSection } from "../../controls/gridSettings/GridSizeSection";

/**
 * Grid settings component
 */
export const GridSettingsPanel: React.FC = () => {
  const gridSettings = useNodeCanvasGridSettings();
  const { actions: canvasActions } = useNodeCanvasActions();

  const handleShowGridChange = React.useEffectEvent((checked: boolean) => {
    canvasActions.updateGridSettings({ showGrid: checked });
  });

  const handleSnapToGridChange = React.useEffectEvent((checked: boolean) => {
    canvasActions.updateGridSettings({ snapToGrid: checked });
  });

  const handleGridSizeChange = React.useEffectEvent((size: number) => {
    canvasActions.updateGridSettings({ size });
  });

  const handleSnapThresholdChange = React.useEffectEvent((snapThreshold: number) => {
    canvasActions.updateGridSettings({ snapThreshold });
  });

  return (
    <>
      <GridVisibilitySection
        showGrid={gridSettings.showGrid}
        snapToGrid={gridSettings.snapToGrid}
        onShowGridChange={handleShowGridChange}
        onSnapToGridChange={handleSnapToGridChange}
      />
      <GridSizeSection
        gridSize={gridSettings.size}
        snapThreshold={gridSettings.snapThreshold}
        onGridSizeChange={handleGridSizeChange}
        onSnapThresholdChange={handleSnapThresholdChange}
      />
    </>
  );
};

GridSettingsPanel.displayName = "GridSettingsPanel";
