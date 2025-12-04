/**
 * @file Grid settings panel component
 * Aggregation layer that combines grid settings sections
 */
import * as React from "react";
import { useNodeCanvas } from "../../../contexts/composed/canvas/viewport/context";
import { GridVisibilitySection } from "../../controls/gridSettings/GridVisibilitySection";
import { GridSizeSection } from "../../controls/gridSettings/GridSizeSection";

/**
 * Grid settings component
 */
export const GridSettingsPanel: React.FC = () => {
  const { state: canvasState, actions: canvasActions } = useNodeCanvas();

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
        showGrid={canvasState.gridSettings.showGrid}
        snapToGrid={canvasState.gridSettings.snapToGrid}
        onShowGridChange={handleShowGridChange}
        onSnapToGridChange={handleSnapToGridChange}
      />
      <GridSizeSection
        gridSize={canvasState.gridSettings.size}
        snapThreshold={canvasState.gridSettings.snapThreshold}
        onGridSizeChange={handleGridSizeChange}
        onSnapThresholdChange={handleSnapThresholdChange}
      />
    </>
  );
};

GridSettingsPanel.displayName = "GridSettingsPanel";
