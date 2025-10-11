/**
 * @file Demonstration of constraint-driven node definitions
 */
import * as React from "react";

import { NodeEditor } from "../NodeEditor";
import type { NodeEditorData } from "../types/core";

import {
  ConstrainedProcessorDefinition,
  CriticalNodeDefinition,
  InputOnlyNodeDefinition,
  SinkNodeDefinition,
} from "./ConstrainedNodeDefinitions.example";
import classes from "./ConstrainedNodeExample.module.css";

const constrainedNodeDefinitions = [
  InputOnlyNodeDefinition,
  ConstrainedProcessorDefinition,
  SinkNodeDefinition,
  CriticalNodeDefinition,
];

const constrainedInitialData: NodeEditorData = {
  nodes: {
    source: {
      id: "source",
      type: "input-only",
      position: { x: 120, y: 160 },
      size: { width: 180, height: 100 },
      data: {
        title: "Sensor Source",
        value: "42",
      },
    },
    processor: {
      id: "processor",
      type: "constrained-processor",
      position: { x: 380, y: 150 },
      size: { width: 200, height: 120 },
      data: {
        title: "Signal Processor",
        algorithm: "normalize",
      },
    },
    sink: {
      id: "sink",
      type: "sink",
      position: { x: 680, y: 160 },
      size: { width: 180, height: 100 },
      data: {
        title: "Data Sink",
      },
    },
    critical: {
      id: "critical",
      type: "critical",
      position: { x: 420, y: 360 },
      size: { width: 220, height: 120 },
      data: {
        title: "Critical System",
        systemId: "SYS-001",
      },
    },
  },
  connections: {
    connSourceToProcessor: {
      id: "connSourceToProcessor",
      fromNodeId: "source",
      fromPortId: "output",
      toNodeId: "processor",
      toPortId: "input1",
    },
    connProcessorToSink: {
      id: "connProcessorToSink",
      fromNodeId: "processor",
      fromPortId: "output",
      toNodeId: "sink",
      toPortId: "input",
    },
    connProcessorToCritical: {
      id: "connProcessorToCritical",
      fromNodeId: "processor",
      fromPortId: "output",
      toNodeId: "critical",
      toPortId: "input",
    },
  },
};

/**
 * Renders the constraint demonstration with specialized node behaviors.
 */
export function ConstrainedNodeExample(): React.ReactElement {
  return (
    <div className={classes.wrapper}>
      <NodeEditor
        includeDefaultDefinitions={false}
        nodeDefinitions={constrainedNodeDefinitions}
        initialData={constrainedInitialData}
      />
    </div>
  );
}
