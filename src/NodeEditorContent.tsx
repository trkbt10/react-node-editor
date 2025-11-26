/**
 * @file Main node editor content component with grid layout
 */
import * as React from "react";
import { GridLayout } from "./components/layout/GridLayout";
import { NodeEditorCanvas } from "./components/canvas/NodeEditorCanvas";
import { defaultEditorGridConfig, defaultEditorGridLayers } from "./config/defaultLayout";
import type { SettingsManager } from "./settings/SettingsManager";
import type { GridLayoutConfig, LayerDefinition } from "./types/panels";
import { type PortPositionBehavior } from "./types/portPosition";

export const NodeEditorContent: React.FC<{
  settingsManager?: SettingsManager;
  autoSaveEnabled?: boolean;
  autoSaveInterval?: number;
  portPositionBehavior?: PortPositionBehavior;
  /** Grid layout configuration */
  gridConfig?: GridLayoutConfig;
  /** Grid layer definitions */
  gridLayers?: LayerDefinition[];
}> = ({ settingsManager, portPositionBehavior, gridConfig, gridLayers }) => {
  // Track grid changes to force GridLayout re-render when needed
  const gridLayoutVersionRef = React.useRef(0);
  const prevGridConfigRef = React.useRef(gridConfig);
  const prevGridLayersRef = React.useRef(gridLayers);

  React.useEffect(() => {
    if (prevGridConfigRef.current !== gridConfig || prevGridLayersRef.current !== gridLayers) {
      gridLayoutVersionRef.current++;
      prevGridConfigRef.current = gridConfig;
      prevGridLayersRef.current = gridLayers;
    }
  }, [gridConfig, gridLayers]);

  // Use provided grid config/layers or build default
  const effectiveGridConfig = React.useMemo((): GridLayoutConfig => {
    if (gridConfig) {
      return gridConfig;
    }

    // No gridConfig provided - use default layout with status bar and resizable inspector
    return defaultEditorGridConfig;
  }, [gridConfig]);

  const effectiveGridLayers = React.useMemo((): LayerDefinition[] => {
    if (gridLayers) {
      return gridLayers;
    }

    // No gridLayers provided - use default layers
    return defaultEditorGridLayers;
  }, [gridLayers]);

  // Generate unique key for GridLayout to force re-render when grid changes
  const gridLayoutKey = gridConfig || gridLayers ? `custom-${gridLayoutVersionRef.current}` : "default";

  return (
    <NodeEditorCanvas settingsManager={settingsManager} portPositionBehavior={portPositionBehavior}>
      <GridLayout
        key={gridLayoutKey}
        config={effectiveGridConfig}
        layers={effectiveGridLayers}
      />
    </NodeEditorCanvas>
  );
};
