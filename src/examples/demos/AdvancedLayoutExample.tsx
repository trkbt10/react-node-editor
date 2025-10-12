/**
 * @file Advanced layout example with floating sidebar, minimap, grid toolbox, and more
 */
import * as React from "react";
import { NodeEditor, type GridLayoutConfig, type LayerDefinition } from "../../index";
import { InspectorPanel } from "../../components/inspector/InspectorPanel";
import { NodeCanvas } from "../../components/canvas/NodeCanvas";
import { Minimap } from "../../components/layers/Minimap";
import { GridToolbox } from "../../components/layers/GridToolbox";
import { StandardNodeDefinition } from "../../node-definitions/standard";
import { toUntypedDefinition } from "../../types/NodeDefinition";
import { useNodeCanvas } from "../../contexts/NodeCanvasContext";
import type { NodeEditorData } from "../../types/core";
import classes from "./AdvancedLayoutExample.module.css";

const initialData: NodeEditorData = {
  nodes: {
    "node-1": {
      id: "node-1",
      type: "standard",
      position: { x: 100, y: 100 },
      size: { width: 180, height: 120 },
      data: { title: "Start Node", content: "" },
    },
    "node-2": {
      id: "node-2",
      type: "standard",
      position: { x: 400, y: 100 },
      size: { width: 180, height: 120 },
      data: { title: "Process Node", content: "" },
    },
    "node-3": {
      id: "node-3",
      type: "standard",
      position: { x: 700, y: 100 },
      size: { width: 180, height: 120 },
      data: { title: "End Node", content: "" },
    },
    "node-4": {
      id: "node-4",
      type: "standard",
      position: { x: 250, y: 300 },
      size: { width: 180, height: 120 },
      data: { title: "Branch A", content: "" },
    },
    "node-5": {
      id: "node-5",
      type: "standard",
      position: { x: 550, y: 300 },
      size: { width: 180, height: 120 },
      data: { title: "Branch B", content: "" },
    },
  },
  connections: {
    "conn-1": {
      id: "conn-1",
      fromNodeId: "node-1",
      fromPortId: "output",
      toNodeId: "node-2",
      toPortId: "input",
    },
    "conn-2": {
      id: "conn-2",
      fromNodeId: "node-2",
      fromPortId: "output",
      toNodeId: "node-3",
      toPortId: "input",
    },
  },
};

/**
 * Floating sidebar component with settings and controls
 */
const FloatingSidebar: React.FC<{ showMinimap: boolean; onToggleMinimap: () => void }> = ({
  showMinimap,
  onToggleMinimap,
}) => {
  const [isOpen, setIsOpen] = React.useState(true);
  const { state, dispatch, actions } = useNodeCanvas();

  const handleGridToggle = React.useCallback(() => {
    dispatch(actions.updateGridSettings({ showGrid: !state.gridSettings.showGrid }));
  }, [state.gridSettings.showGrid, dispatch, actions]);

  const handleSnapToggle = React.useCallback(() => {
    dispatch(actions.updateGridSettings({ snapToGrid: !state.gridSettings.snapToGrid }));
  }, [state.gridSettings.snapToGrid, dispatch, actions]);

  const handleGridSizeChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const size = Number(e.target.value);
      dispatch(actions.updateGridSettings({ size }));
    },
    [dispatch, actions],
  );

  const handleZoomReset = React.useCallback(() => {
    dispatch(actions.setViewport({ ...state.viewport, scale: 1 }));
  }, [state.viewport, dispatch, actions]);

  return (
    <div className={`${classes.floatingSidebar} ${isOpen ? classes.open : classes.closed}`}>
      <div className={classes.sidebarHeader}>
        <h3 className={classes.sidebarTitle}>Settings</h3>
        <button
          className={classes.toggleButton}
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? "◀" : "▶"}
        </button>
      </div>
      {isOpen && (
        <div className={classes.sidebarContent}>
          <div className={classes.settingsGroup}>
            <h4 className={classes.settingsTitle}>View Options</h4>
            <label className={classes.settingRow}>
              <input type="checkbox" checked={state.gridSettings.showGrid} onChange={handleGridToggle} />
              <span>Show Grid</span>
            </label>
            <label className={classes.settingRow}>
              <input type="checkbox" checked={state.gridSettings.snapToGrid} onChange={handleSnapToggle} />
              <span>Snap to Grid</span>
            </label>
            <label className={classes.settingRow}>
              <input type="checkbox" checked={showMinimap} onChange={onToggleMinimap} />
              <span>Show Minimap</span>
            </label>
          </div>

          <div className={classes.settingsGroup}>
            <h4 className={classes.settingsTitle}>Grid Settings</h4>
            <div className={classes.settingRow}>
              <label htmlFor="grid-size">Size:</label>
              <input
                id="grid-size"
                type="number"
                value={state.gridSettings.size}
                onChange={handleGridSizeChange}
                min={5}
                max={100}
                className={classes.numberInput}
              />
            </div>
          </div>

          <div className={classes.settingsGroup}>
            <h4 className={classes.settingsTitle}>Quick Actions</h4>
            <button className={classes.actionButton} onClick={handleZoomReset}>
              Reset Zoom
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Status bar component showing editor information
 */
const AdvancedStatusBar: React.FC = () => {
  return (
    <div className={classes.statusBar}>
      <div className={classes.statusSection}>
        <span className={classes.statusLabel}>Ready</span>
      </div>
      <div className={classes.statusSection}>
        <span className={classes.statusItem}>Position: (0, 0)</span>
        <span className={classes.statusDivider}>|</span>
        <span className={classes.statusItem}>Zoom: 100%</span>
        <span className={classes.statusDivider}>|</span>
        <span className={classes.statusItem}>Selection: 0 nodes</span>
      </div>
      <div className={classes.statusSection}>
        <span className={classes.statusItem}>Advanced Layout Demo v1.0</span>
      </div>
    </div>
  );
};

/**
 * Advanced layout example with all the bells and whistles
 */
export const AdvancedLayoutExample: React.FC = () => {
  // Custom grid configuration for advanced layout
  const gridConfig = React.useMemo<GridLayoutConfig>(
    () => ({
      areas: [
        ["toolbar", "toolbar", "toolbar"],
        ["canvas", "canvas", "canvas"],
        ["statusbar", "statusbar", "statusbar"],
      ],
      rows: [{ size: "auto" }, { size: "1fr" }, { size: "auto" }],
      columns: [{ size: "1fr" }, { size: "1fr" }, { size: "320px", resizable: true, minSize: 250, maxSize: 500 }],
      gap: "0",
    }),
    [],
  );

  const [showMinimap, setShowMinimap] = React.useState(true);
  const handleToggleMinimap = React.useCallback(() => {
    setShowMinimap((prev) => !prev);
  }, []);

  const gridLayers = React.useMemo<LayerDefinition[]>(
    () => [
      {
        id: "toolbar",
        component: <GridToolbox />,
        gridArea: "toolbar",
        zIndex: 200,
        positionMode: "fixed",
        position: {
          bottom: 20,
          left: "50%",
        },
        style: {
          transform: "translateX(-50%)",
        },
      },
      {
        id: "minimap",
        component: showMinimap ? <Minimap width={200} height={150} /> : null,
        positionMode: "absolute",
        position: { right: 10, bottom: 10 },
        zIndex: 20,
        draggable: true,
        width: 200,
        height: 150,
      },
      {
        id: "canvas",
        component: <NodeCanvas />,
        gridArea: "canvas",
        zIndex: 0,
      },
      {
        id: "inspector",
        component: <InspectorPanel />,
        gridArea: "canvas",
        zIndex: 50,
        positionMode: "absolute",
        position: {
          right: 0,
          top: 0,
        },
        pointerEvents: "auto",
        width: 320,
        height: 520,
        draggable: true,
      },
      {
        id: "statusbar",
        component: <AdvancedStatusBar />,
        gridArea: "statusbar",
        zIndex: 10,
      },
      {
        id: "floating-sidebar",
        component: <FloatingSidebar showMinimap={showMinimap} onToggleMinimap={handleToggleMinimap} />,
        positionMode: "absolute",
        position: {
          top: "var(--node-editor-space-xxl)",
          left: "var(--node-editor-space-lg)",
        },
        zIndex: 1000,
        draggable: true,
        pointerEvents: "auto",
      },
    ],
    [showMinimap, handleToggleMinimap],
  );

  return (
    <div className={classes.wrapper}>
      <NodeEditor
        gridConfig={gridConfig}
        gridLayers={gridLayers}
        initialData={initialData}
        nodeDefinitions={[toUntypedDefinition(StandardNodeDefinition)]}
      />
    </div>
  );
};

/*
debug-notes:
- Reviewed src/components/layout/GridLayout.tsx to verify absolute positioning behaviour for LayerDefinition overlays.
- Reviewed src/examples/demos/ColumnLayoutExample.tsx to compare grid layer patterns used across demos.
- Reviewed src/examples/demos/threejs/ThreeJsExample.tsx to confirm useMemo usage for grid configuration and layers.
- Reviewed src/NodeEditorContent.tsx to check project utilities for composing class names.
*/
