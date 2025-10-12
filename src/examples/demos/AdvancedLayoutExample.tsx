/**
 * @file Advanced layout example with floating sidebar, minimap, grid toolbox, and more
 */
import * as React from "react";
import { NodeEditor, type GridLayoutConfig, type LayerDefinition } from "../../index";
import { InspectorPanel } from "../../components/inspector/InspectorPanel";
import { NodeCanvas } from "../../components/canvas/NodeCanvas";
import { Minimap } from "../../components/layers/Minimap";
import { GridToolbox } from "../../components/layers/GridToolbox";
import type { NodeEditorData } from "../../types/core";
import classes from "./AdvancedLayoutExample.module.css";

const initialData: NodeEditorData = {
  nodes: {
    "node-1": {
      id: "node-1",
      type: "standard-node",
      position: { x: 100, y: 100 },
      size: { width: 180, height: 120 },
      data: { label: "Start Node" },
    },
    "node-2": {
      id: "node-2",
      type: "standard-node",
      position: { x: 400, y: 100 },
      size: { width: 180, height: 120 },
      data: { label: "Process Node" },
    },
    "node-3": {
      id: "node-3",
      type: "standard-node",
      position: { x: 700, y: 100 },
      size: { width: 180, height: 120 },
      data: { label: "End Node" },
    },
    "node-4": {
      id: "node-4",
      type: "standard-node",
      position: { x: 250, y: 300 },
      size: { width: 180, height: 120 },
      data: { label: "Branch A" },
    },
    "node-5": {
      id: "node-5",
      type: "standard-node",
      position: { x: 550, y: 300 },
      size: { width: 180, height: 120 },
      data: { label: "Branch B" },
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
const FloatingSidebar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div className={`${classes.floatingSidebar} ${isOpen ? classes.open : classes.closed}`}>
      <div className={classes.sidebarHeader}>
        <h3 className={classes.sidebarTitle}>Settings</h3>
        <button
          className={classes.toggleButton}
          onClick={() => setIsOpen(!isOpen)}
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
              <input type="checkbox" defaultChecked />
              <span>Show Grid</span>
            </label>
            <label className={classes.settingRow}>
              <input type="checkbox" defaultChecked />
              <span>Snap to Grid</span>
            </label>
            <label className={classes.settingRow}>
              <input type="checkbox" defaultChecked />
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
                defaultValue={20}
                min={5}
                max={100}
                className={classes.numberInput}
              />
            </div>
            <div className={classes.settingRow}>
              <label htmlFor="grid-opacity">Opacity:</label>
              <input
                id="grid-opacity"
                type="range"
                defaultValue={30}
                min={0}
                max={100}
                className={classes.rangeInput}
              />
            </div>
          </div>

          <div className={classes.settingsGroup}>
            <h4 className={classes.settingsTitle}>Theme</h4>
            <select className={classes.themeSelect}>
              <option>Light</option>
              <option>Dark</option>
              <option>Auto</option>
            </select>
          </div>

          <div className={classes.settingsGroup}>
            <h4 className={classes.settingsTitle}>Quick Actions</h4>
            <button className={classes.actionButton}>Export as JSON</button>
            <button className={classes.actionButton}>Clear Canvas</button>
            <button className={classes.actionButton}>Reset Zoom</button>
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
  const gridConfig: GridLayoutConfig = {
    areas: [
      ["toolbar", "toolbar", "toolbar"],
      ["canvas", "canvas", "inspector"],
      ["statusbar", "statusbar", "statusbar"],
    ],
    rows: [{ size: "auto" }, { size: "1fr" }, { size: "auto" }],
    columns: [
      { size: "1fr" },
      { size: "1fr" },
      { size: "320px", resizable: true, minSize: 250, maxSize: 500 },
    ],
    gap: "0",
  };

  const gridLayers: LayerDefinition[] = [
    {
      id: "toolbar",
      component: <GridToolbox />,
      gridArea: "toolbar",
      zIndex: 10,
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
      gridArea: "inspector",
      zIndex: 1,
    },
    {
      id: "statusbar",
      component: <AdvancedStatusBar />,
      gridArea: "statusbar",
      zIndex: 10,
    },
  ];

  return (
    <div className={classes.wrapper}>
      <NodeEditor gridConfig={gridConfig} gridLayers={gridLayers} initialData={initialData} />

      {/* Floating sidebar overlay */}
      <FloatingSidebar />

      {/* Minimap overlay */}
      <div className={classes.minimapWrapper}>
        <Minimap width={220} height={160} />
      </div>

      {/* Floating help button */}
      <button className={classes.helpButton} title="Help">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
          <path d="M10 14a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM10 5a3 3 0 0 0-3 3h2a1 1 0 1 1 2 0c0 .551-.224 1.05-.586 1.414L9 10.828V12h2v-.586l.707-.707A3.001 3.001 0 0 0 10 5z" />
        </svg>
      </button>
    </div>
  );
};
