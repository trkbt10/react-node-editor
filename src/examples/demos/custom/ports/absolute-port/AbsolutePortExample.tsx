/**
 * @file Example demonstrating absolute port placement and inset ports.
 * - Absolute positioning: Ports at specific x,y coordinates relative to node
 * - Unit modes: "px" (default) or "percent" for responsive positioning
 * - Inset ports: Ports placed inside the node boundary
 */
import * as React from "react";
import { NodeEditor } from "../../../../../NodeEditor";
import type { NodeDefinition, PortInstanceContext } from "../../../../../types/NodeDefinition";
import type { NodeEditorData, AbsolutePortPlacement } from "../../../../../types/core";
import { absolutePercent } from "../../../../../core/port/appearance/placement";
import styles from "./AbsolutePortExample.module.css";

const INITIAL_DATA: NodeEditorData = {
  nodes: {
    "absolute-1": {
      id: "absolute-1",
      type: "absolute-ports",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      data: { portCount: 4 },
    },
    "percent-1": {
      id: "percent-1",
      type: "percent-ports",
      position: { x: 400, y: 100 },
      size: { width: 200, height: 150 },
      data: {},
    },
    "inset-1": {
      id: "inset-1",
      type: "inset-ports",
      position: { x: 700, y: 100 },
      size: { width: 180, height: 120 },
      data: {},
    },
    "mixed-1": {
      id: "mixed-1",
      type: "mixed-ports",
      position: { x: 250, y: 320 },
      size: { width: 220, height: 180 },
      data: { dynamicCount: 3 },
    },
  },
  connections: {},
};

/**
 * Node with absolute positioned ports around the perimeter
 */
const absolutePortsDefinition: NodeDefinition = {
  type: "absolute-ports",
  displayName: "Absolute Ports",
  defaultSize: { width: 200, height: 150 },
  ports: [
    {
      id: "corner-tl",
      type: "input",
      label: "TL",
      position: { mode: "absolute", x: 0, y: 0 } as AbsolutePortPlacement,
    },
    {
      id: "corner-tr",
      type: "output",
      label: "TR",
      position: { mode: "absolute", x: 200, y: 0 } as AbsolutePortPlacement,
    },
    {
      id: "corner-bl",
      type: "input",
      label: "BL",
      position: { mode: "absolute", x: 0, y: 150 } as AbsolutePortPlacement,
    },
    {
      id: "corner-br",
      type: "output",
      label: "BR",
      position: { mode: "absolute", x: 200, y: 150 } as AbsolutePortPlacement,
    },
    // Dynamic ports along the top edge
    {
      id: "dynamic-top",
      type: "input",
      label: "Top",
      position: { mode: "absolute", x: 50, y: 0 } as AbsolutePortPlacement,
      instances: ({ node }: PortInstanceContext) => Number(node.data?.portCount ?? 2),
      createPortId: ({ index }) => `dynamic-top-${index + 1}`,
      createPortLabel: ({ index }) => `T${index + 1}`,
    },
  ],
  renderNode: () => (
    <div className={styles.absoluteNode}>
      <div className={styles.nodeTitle}>Absolute Ports</div>
      <div className={styles.nodeInfo}>
        Ports at corners + dynamic top ports
      </div>
    </div>
  ),
};

/**
 * Node with percentage-based port positioning (responsive to node size)
 */
const percentPortsDefinition: NodeDefinition = {
  type: "percent-ports",
  displayName: "Percent Ports",
  defaultSize: { width: 200, height: 150 },
  ports: [
    {
      id: "percent-tl",
      type: "input",
      label: "0%",
      position: absolutePercent(0, 0),
    },
    {
      id: "percent-tr",
      type: "output",
      label: "100%",
      position: absolutePercent(100, 0),
    },
    {
      id: "percent-bl",
      type: "input",
      label: "0%",
      position: absolutePercent(0, 100),
    },
    {
      id: "percent-br",
      type: "output",
      label: "100%",
      position: absolutePercent(100, 100),
    },
    {
      id: "percent-center",
      type: "output",
      label: "50%",
      position: absolutePercent(50, 50),
    },
    {
      id: "percent-quarter",
      type: "input",
      label: "25%",
      position: absolutePercent(25, 75),
    },
  ],
  renderNode: () => (
    <div className={styles.percentNode}>
      <div className={styles.nodeTitle}>Percent Ports</div>
      <div className={styles.nodeInfo}>
        Ports at % positions (responsive)
      </div>
      <div className={styles.nodeInfo}>
        Resize to see ports move!
      </div>
    </div>
  ),
};

/**
 * Node with inset ports (inside the node boundary)
 */
const insetPortsDefinition: NodeDefinition = {
  type: "inset-ports",
  displayName: "Inset Ports",
  defaultSize: { width: 180, height: 120 },
  ports: [
    {
      id: "inset-left-1",
      type: "input",
      label: "In 1",
      position: { side: "left", align: 0.3, inset: true },
    },
    {
      id: "inset-left-2",
      type: "input",
      label: "In 2",
      position: { side: "left", align: 0.7, inset: true },
    },
    {
      id: "inset-right-1",
      type: "output",
      label: "Out 1",
      position: { side: "right", align: 0.3, inset: true },
    },
    {
      id: "inset-right-2",
      type: "output",
      label: "Out 2",
      position: { side: "right", align: 0.7, inset: true },
    },
  ],
  renderNode: () => (
    <div className={styles.insetNode}>
      <div className={styles.nodeTitle}>Inset Ports</div>
      <div className={styles.nodeInfo}>
        Ports inside node boundary
      </div>
    </div>
  ),
};

/**
 * Node mixing absolute, inset, and normal ports
 */
const mixedPortsDefinition: NodeDefinition = {
  type: "mixed-ports",
  displayName: "Mixed Placement",
  defaultSize: { width: 220, height: 180 },
  ports: [
    // Normal side ports
    {
      id: "normal-left",
      type: "input",
      label: "Normal",
      position: "left",
    },
    {
      id: "normal-right",
      type: "output",
      label: "Normal",
      position: "right",
    },
    // Inset ports
    {
      id: "inset-top",
      type: "input",
      label: "Inset",
      position: { side: "top", inset: true },
    },
    // Absolute port in center
    {
      id: "center",
      type: "output",
      label: "Center",
      position: { mode: "absolute", x: 110, y: 90 } as AbsolutePortPlacement,
    },
    // Dynamic absolute ports along bottom
    {
      id: "bottom-dynamic",
      type: "output",
      label: "Bottom",
      position: { mode: "absolute", x: 40, y: 180 } as AbsolutePortPlacement,
      instances: ({ node }: PortInstanceContext) => Number(node.data?.dynamicCount ?? 2),
      createPortId: ({ index }) => `bottom-${index + 1}`,
      createPortLabel: ({ index }) => `B${index + 1}`,
    },
  ],
  renderNode: ({ node }) => {
    const dynamicCount = Number(node.data?.dynamicCount ?? 2);
    return (
      <div className={styles.mixedNode}>
        <div className={styles.nodeTitle}>Mixed Placement</div>
        <div className={styles.nodeInfo}>
          Normal + Inset + Absolute
        </div>
        <div className={styles.nodeInfo}>
          Dynamic: {dynamicCount} bottom ports
        </div>
      </div>
    );
  },
};

const NODE_DEFINITIONS: NodeDefinition[] = [
  absolutePortsDefinition,
  percentPortsDefinition,
  insetPortsDefinition,
  mixedPortsDefinition,
];

export const AbsolutePortExample: React.FC = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Absolute & Inset Port Placement</h1>
        <p className={styles.description}>
          Demonstrates absolute positioning (px/percent units) and inset ports (inside node boundary)
        </p>
      </header>
      <div className={styles.editorContainer}>
        <NodeEditor
          initialData={INITIAL_DATA}
          nodeDefinitions={NODE_DEFINITIONS}
        />
      </div>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <strong>Absolute Ports (px):</strong> Positioned at specific x,y pixel coordinates
        </div>
        <div className={styles.legendItem}>
          <strong>Percent Ports (%):</strong> Positioned at percentage of node size (0-100), responsive to resize
        </div>
        <div className={styles.legendItem}>
          <strong>Inset Ports:</strong> Placed inside the node boundary (inset: true)
        </div>
        <div className={styles.legendItem}>
          <strong>Dynamic Ports:</strong> Multiple instances with computed positions
        </div>
      </div>
    </div>
  );
};

export default AbsolutePortExample;
