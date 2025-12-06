/**
 * @file Connection Rules Example
 * Demonstrates the 4 ways to customize port connectivity:
 * 1. dataType - type-based compatibility
 * 2. canConnect - port-level predicate
 * 3. validateConnection - node-level validation
 * 4. maxConnections - capacity limits
 */
import * as React from "react";

import { NodeEditor } from "../../../../../NodeEditor";
import type { NodeEditorData } from "../../../../../types/core";

import { connectionRulesDefinitions } from "./connectionRulesNodes";
import styles from "./ConnectionRulesExample.module.css";

/** Initial data for the example */
const initialData: NodeEditorData = {
  nodes: {
    // Data Type examples
    "num-src": {
      id: "num-src",
      type: "number-source",
      position: { x: 80, y: 40 },
      data: {},
    },
    "str-src": {
      id: "str-src",
      type: "string-source",
      position: { x: 80, y: 160 },
      data: {},
    },
    "num-consumer": {
      id: "num-consumer",
      type: "number-consumer",
      position: { x: 320, y: 40 },
      data: {},
    },
    "any-consumer": {
      id: "any-consumer",
      type: "any-consumer",
      position: { x: 320, y: 160 },
      data: {},
    },
    // Second string source to test multiple connections to any-consumer
    "str-src-2": {
      id: "str-src-2",
      type: "string-source",
      position: { x: 80, y: 280 },
      data: {},
    },

    // canConnect examples
    "exclusive": {
      id: "exclusive",
      type: "exclusive-source",
      position: { x: 80, y: 420 },
      data: {},
    },
    "premium": {
      id: "premium",
      type: "premium-consumer",
      position: { x: 340, y: 400 },
      data: {},
    },
    "regular": {
      id: "regular",
      type: "regular-consumer",
      position: { x: 340, y: 520 },
      data: {},
    },
    "self1": {
      id: "self1",
      type: "self-aware",
      position: { x: 600, y: 400 },
      data: {},
    },
    "self2": {
      id: "self2",
      type: "self-aware",
      position: { x: 860, y: 400 },
      data: {},
    },

    // maxConnections examples
    "multi-out-1": {
      id: "multi-out-1",
      type: "multi-output",
      position: { x: 600, y: 40 },
      data: {},
    },
    "multi-out-2": {
      id: "multi-out-2",
      type: "multi-output",
      position: { x: 600, y: 140 },
      data: {},
    },
    "multi-out-3": {
      id: "multi-out-3",
      type: "multi-output",
      position: { x: 600, y: 240 },
      data: {},
    },
    "multi-out-4": {
      id: "multi-out-4",
      type: "multi-output",
      position: { x: 600, y: 340 },
      data: {},
    },
    "single-in": {
      id: "single-in",
      type: "single-input",
      position: { x: 880, y: 40 },
      data: {},
    },
    "limited-in": {
      id: "limited-in",
      type: "limited-input",
      position: { x: 880, y: 140 },
      data: {},
    },
    "unlimited-in": {
      id: "unlimited-in",
      type: "unlimited-input",
      position: { x: 880, y: 280 },
      data: {},
    },

    // validateConnection examples
    "validated-hub": {
      id: "validated-hub",
      type: "validated-hub",
      position: { x: 320, y: 640 },
      data: {},
    },
    "directional-1": {
      id: "directional-1",
      type: "directional",
      position: { x: 80, y: 660 },
      data: {},
    },
    "directional-2": {
      id: "directional-2",
      type: "directional",
      position: { x: 600, y: 660 },
      data: {},
    },

    // =========================================
    // Abnormal Section (Invalid Connections)
    // =========================================

    // Type mismatch: string → number-only
    "abnormal-str-src": {
      id: "abnormal-str-src",
      type: "abnormal-string-source",
      position: { x: 80, y: 840 },
      data: {},
    },
    "abnormal-num-consumer": {
      id: "abnormal-num-consumer",
      type: "abnormal-number-consumer",
      position: { x: 320, y: 840 },
      data: {},
    },

    // canConnect violation: exclusive → regular
    "abnormal-exclusive": {
      id: "abnormal-exclusive",
      type: "abnormal-exclusive-source",
      position: { x: 80, y: 960 },
      data: {},
    },
    "abnormal-regular": {
      id: "abnormal-regular",
      type: "abnormal-regular-consumer",
      position: { x: 340, y: 960 },
      data: {},
    },

    // Capacity overflow: 2 connections to max:1 port
    "abnormal-out-1": {
      id: "abnormal-out-1",
      type: "abnormal-multi-output",
      position: { x: 600, y: 840 },
      data: {},
    },
    "abnormal-out-2": {
      id: "abnormal-out-2",
      type: "abnormal-multi-output",
      position: { x: 600, y: 960 },
      data: {},
    },
    "abnormal-overflow": {
      id: "abnormal-overflow",
      type: "abnormal-overflow-input",
      position: { x: 880, y: 900 },
      data: {},
    },
  },
  connections: {
    // =========================================
    // Valid Connections (Normal Section)
    // =========================================

    // dataType: number → number (valid)
    "conn-num-num": {
      id: "conn-num-num",
      fromNodeId: "num-src",
      fromPortId: "value",
      toNodeId: "num-consumer",
      toPortId: "input",
    },
    // dataType: string → any (valid)
    "conn-str-any": {
      id: "conn-str-any",
      fromNodeId: "str-src",
      fromPortId: "value",
      toNodeId: "any-consumer",
      toPortId: "input",
    },

    // canConnect: exclusive → premium (valid)
    "conn-exclusive-premium": {
      id: "conn-exclusive-premium",
      fromNodeId: "exclusive",
      fromPortId: "premium",
      toNodeId: "premium",
      toPortId: "input",
    },

    // maxConnections: multi → single (valid, 1 connection)
    "conn-multi-single": {
      id: "conn-multi-single",
      fromNodeId: "multi-out-1",
      fromPortId: "output",
      toNodeId: "single-in",
      toPortId: "input",
    },
    // maxConnections: multi → limited (valid, multiple connections)
    "conn-multi-limited-1": {
      id: "conn-multi-limited-1",
      fromNodeId: "multi-out-1",
      fromPortId: "output",
      toNodeId: "limited-in",
      toPortId: "input",
    },
    "conn-multi-limited-2": {
      id: "conn-multi-limited-2",
      fromNodeId: "multi-out-2",
      fromPortId: "output",
      toNodeId: "limited-in",
      toPortId: "input",
    },
    // maxConnections: multi → unlimited (valid)
    "conn-multi-unlimited-1": {
      id: "conn-multi-unlimited-1",
      fromNodeId: "multi-out-3",
      fromPortId: "output",
      toNodeId: "unlimited-in",
      toPortId: "input",
    },
    "conn-multi-unlimited-2": {
      id: "conn-multi-unlimited-2",
      fromNodeId: "multi-out-4",
      fromPortId: "output",
      toNodeId: "unlimited-in",
      toPortId: "input",
    },

    // validateConnection: directional chain (valid)
    "conn-dir-hub": {
      id: "conn-dir-hub",
      fromNodeId: "directional-1",
      fromPortId: "output",
      toNodeId: "validated-hub",
      toPortId: "in1",
    },
    "conn-hub-dir": {
      id: "conn-hub-dir",
      fromNodeId: "validated-hub",
      fromPortId: "out",
      toNodeId: "directional-2",
      toPortId: "input",
    },

    // =========================================
    // Invalid Connections (Abnormal Section)
    // =========================================

    // INVALID: string → number-only (type mismatch)
    "conn-invalid-type": {
      id: "conn-invalid-type",
      fromNodeId: "abnormal-str-src",
      fromPortId: "value",
      toNodeId: "abnormal-num-consumer",
      toPortId: "input",
    },

    // INVALID: exclusive → regular (canConnect violation)
    "conn-invalid-canconnect": {
      id: "conn-invalid-canconnect",
      fromNodeId: "abnormal-exclusive",
      fromPortId: "premium",
      toNodeId: "abnormal-regular",
      toPortId: "input",
    },

    // INVALID: 2 connections to max:1 port (capacity overflow)
    "conn-invalid-overflow-1": {
      id: "conn-invalid-overflow-1",
      fromNodeId: "abnormal-out-1",
      fromPortId: "output",
      toNodeId: "abnormal-overflow",
      toPortId: "input",
    },
    "conn-invalid-overflow-2": {
      id: "conn-invalid-overflow-2",
      fromNodeId: "abnormal-out-2",
      fromPortId: "output",
      toNodeId: "abnormal-overflow",
      toPortId: "input",
    },
  },
};

/** Example component demonstrating 4 connection customization methods */
export function ConnectionRulesExample(): React.ReactElement {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Connection Rules Example</h2>
        <p className={styles.description}>
          Try connecting different nodes to see the 4 types of connection rules in action.
          Incompatible connections will be rejected.
        </p>
      </div>

      <div className={styles.editorContainer}>
        <NodeEditor
          includeDefaultDefinitions={false}
          nodeDefinitions={connectionRulesDefinitions}
          initialData={initialData}
        />
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotDataType}`} />
          <span>dataType: Type compatibility</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotCanConnect}`} />
          <span>canConnect: Port-level predicate</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotValidate}`} />
          <span>validateConnection: Node-level validation</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotCapacity}`} />
          <span>maxConnections: Capacity limits</span>
        </div>
      </div>
    </div>
  );
}
