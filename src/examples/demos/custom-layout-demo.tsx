/**
 * @file Custom Layout Demo
 * @description
 * Demonstrates how to use NodeEditorCore and NodeEditorCanvas
 * to build a custom layout without depending on the built-in GridLayout system.
 */
import * as React from "react";
import {
  NodeEditorCore,
  NodeEditorCanvas,
  createNodeDefinition,
  SettingsManager,
  type NodeEditorData,
} from "../../core";
import { NodeCanvas } from "../../components/canvas/NodeCanvas";
import styles from "./custom-layout-demo.module.css";

// Simple custom panel components
const CustomSidebar = React.memo<{ children?: React.ReactNode }>(({ children }) => {
  return <div className={styles.sidebar}>{children}</div>;
});
CustomSidebar.displayName = "CustomSidebar";

const CustomInspector = React.memo<{ children?: React.ReactNode }>(({ children }) => {
  return <div className={styles.inspector}>{children}</div>;
});
CustomInspector.displayName = "CustomInspector";

// Define some sample node types
const sampleNodeDefinitions = [
  createNodeDefinition({
    type: "input",
    displayName: "Input Node",
    defaultSize: { width: 200, height: 100 },
    ports: [
      {
        id: "out",
        type: "output",
        label: "Output",
        position: "right",
      },
    ],
  }),
  createNodeDefinition({
    type: "process",
    displayName: "Process Node",
    defaultSize: { width: 220, height: 120 },
    ports: [
      {
        id: "in",
        type: "input",
        label: "Input",
        position: "left",
      },
      {
        id: "out",
        type: "output",
        label: "Output",
        position: "right",
      },
    ],
  }),
  createNodeDefinition({
    type: "output",
    displayName: "Output Node",
    defaultSize: { width: 200, height: 100 },
    ports: [
      {
        id: "in",
        type: "input",
        label: "Input",
        position: "left",
      },
    ],
  }),
];

// Initial editor data
const initialData: Partial<NodeEditorData> = {
  nodes: {
    "node-1": {
      id: "node-1",
      type: "input",
      position: { x: 100, y: 100 },
      data: {},
    },
    "node-2": {
      id: "node-2",
      type: "process",
      position: { x: 400, y: 100 },
      data: {},
    },
    "node-3": {
      id: "node-3",
      type: "output",
      position: { x: 700, y: 100 },
      data: {},
    },
  },
  connections: {
    "conn-1": {
      id: "conn-1",
      fromNodeId: "node-1",
      fromPortId: "out",
      toNodeId: "node-2",
      toPortId: "in",
    },
    "conn-2": {
      id: "conn-2",
      fromNodeId: "node-2",
      fromPortId: "out",
      toNodeId: "node-3",
      toPortId: "in",
    },
  },
};

/**
 * CustomLayoutDemo - Example of using NodeEditorCore and NodeEditorCanvas
 * with a custom layout system (flexbox in this case)
 */
export const CustomLayoutDemo: React.FC = () => {
  const [data, setData] = React.useState<NodeEditorData | undefined>();

  // Create SettingsManager with split view mode for node search menu
  const settingsManager = React.useMemo(() => {
    const settings = new SettingsManager();
    settings.setValue("behavior.nodeSearchViewMode", "split");
    return settings;
  }, []);

  const nodeCount = React.useMemo(() => (data ? Object.keys(data.nodes).length : 0), [data]);
  const connectionCount = React.useMemo(() => (data ? Object.keys(data.connections).length : 0), [data]);

  const nodeListItems = React.useMemo(
    () =>
      sampleNodeDefinitions.map((def) => (
        <div key={def.type} className={styles.nodeItem}>
          {def.displayName}
        </div>
      )),
    [],
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span>Custom Layout Demo</span>
          <span className={styles.badge}>
            <span className={styles.badgeIcon}></span>
            NO GRID LAYOUT
          </span>
        </div>
        <div className={styles.engineInfo}>
          <span>Layout Engine:</span>
          <span className={styles.engineBadge}>Flexbox (Custom)</span>
        </div>
      </div>

      {/* Main content area */}
      <div className={styles.mainContent}>
        {/* NodeEditorCore wraps everything with necessary providers */}
        <NodeEditorCore
          initialData={initialData}
          onDataChange={setData}
          nodeDefinitions={sampleNodeDefinitions}
          includeDefaultDefinitions={false}
          autoSaveEnabled={false}
        >
          {/* Left sidebar */}
          <CustomSidebar>
            <h3 className={styles.sidebarTitle}>Node Palette</h3>
            <p className={styles.sidebarDescription}>
              Right-click on the canvas to add nodes from this custom palette
            </p>
            <div className={styles.nodeList}>{nodeListItems}</div>
          </CustomSidebar>

          {/* Canvas area with NodeEditorCanvas */}
          <div className={styles.canvasArea}>
            <NodeEditorCanvas settingsManager={settingsManager}>
              <NodeCanvas />
            </NodeEditorCanvas>
          </div>

          {/* Right inspector */}
          <CustomInspector>
            <h3 className={styles.inspectorTitle}>Inspector</h3>
            <p className={styles.inspectorDescription}>
              Custom inspector panel built with pure Flexbox
            </p>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Nodes</span>
                <span className={styles.statValue}>{nodeCount}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Connections</span>
                <span className={styles.statValue}>{connectionCount}</span>
              </div>
            </div>
          </CustomInspector>
        </NodeEditorCore>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={styles.layoutEngineLabel}>
          Built with NodeEditorCore + NodeEditorCanvas (no GridLayout dependency)
        </span>
        <span className={styles.footerBadge}>100% Custom Flexbox</span>
      </div>
    </div>
  );
};
