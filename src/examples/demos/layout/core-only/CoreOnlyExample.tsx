/**
 * @file Core Only Example
 * @description
 * Demonstrates how to use NodeEditorCore alone without NodeEditorCanvas or GridLayout.
 * This is the most minimal setup, showing only the canvas with nodes and connections.
 */
import * as React from "react";
import {
  NodeEditorCore,
  createNodeDefinition,
  type NodeEditorData,
} from "../../../../core";
import { NodeCanvas } from "../../../../components/canvas/NodeCanvas";
import styles from "./CoreOnlyExample.module.css";

// Simple node definitions
const nodeDefinitions = [
  createNodeDefinition({
    type: "source",
    displayName: "Source",
    defaultSize: { width: 180, height: 80 },
    ports: [
      { id: "out", type: "output", label: "Out", position: "right" },
    ],
  }),
  createNodeDefinition({
    type: "transform",
    displayName: "Transform",
    defaultSize: { width: 200, height: 100 },
    ports: [
      { id: "in", type: "input", label: "In", position: "left" },
      { id: "out", type: "output", label: "Out", position: "right" },
    ],
  }),
  createNodeDefinition({
    type: "destination",
    displayName: "Destination",
    defaultSize: { width: 180, height: 80 },
    ports: [
      { id: "in", type: "input", label: "In", position: "left" },
    ],
  }),
];

// Initial data
const initialData: Partial<NodeEditorData> = {
  nodes: {
    "node-1": {
      id: "node-1",
      type: "source",
      position: { x: 100, y: 150 },
      data: {},
    },
    "node-2": {
      id: "node-2",
      type: "transform",
      position: { x: 400, y: 150 },
      data: {},
    },
    "node-3": {
      id: "node-3",
      type: "destination",
      position: { x: 720, y: 150 },
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
 * CoreOnlyExample - Minimal NodeEditorCore setup
 *
 * This example shows:
 * - NodeEditorCore provides all necessary contexts
 * - NodeCanvas renders the canvas directly
 * - No GridLayout, no NodeEditorCanvas, no panels
 * - Just the raw canvas with drag, pan, zoom, and connections
 */
export const CoreOnlyExample: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Core Only Example</h1>
        <p className={styles.description}>
          Minimal setup using only NodeEditorCore + NodeCanvas.
          No GridLayout, no context menus, no panels.
        </p>
      </div>

      <div className={styles.canvasContainer}>
        <NodeEditorCore
          initialData={initialData}
          nodeDefinitions={nodeDefinitions}
          includeDefaultDefinitions={false}
          autoSaveEnabled={false}
        >
          <NodeCanvas />
        </NodeEditorCore>
      </div>

      <div className={styles.footer}>
        <div className={styles.controls}>
          <span className={styles.controlItem}>Pan: Drag canvas or Space + Drag</span>
          <span className={styles.controlItem}>Zoom: Scroll wheel</span>
          <span className={styles.controlItem}>Move node: Drag node</span>
          <span className={styles.controlItem}>Connect: Drag from port</span>
        </div>
      </div>
    </div>
  );
};
