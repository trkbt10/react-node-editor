/**
 * @file Demonstration of strongly-typed node definitions
 */
import * as React from "react";

import { NodeEditor } from "../../NodeEditor";
import type { NodeEditorData } from "../../types/core";

import {
  CounterNodeDefinition,
  LegacyNodeDefinition,
  TextDisplayDefinition,
} from "./typedNodes.example";
import { toUntypedDefinition } from "../../types/NodeDefinition";
import classes from "./TypedNodesExample.module.css";

const typedNodesInitialData: NodeEditorData = {
  nodes: {
    counter: {
      id: "counter",
      type: "counter-node",
      position: { x: 120, y: 160 },
      size: { width: 220, height: 160 },
      data: {
        label: "Counter",
        count: 5,
        step: 1,
      },
    },
    textDisplay: {
      id: "textDisplay",
      type: "text-display",
      position: { x: 420, y: 140 },
      size: { width: 260, height: 140 },
      data: {
        title: "Display",
        content: "Counter value is emitted from the node output",
        fontSize: 14,
      },
    },
    legacy: {
      id: "legacy",
      type: "legacy-node",
      position: { x: 280, y: 340 },
      size: { width: 220, height: 140 },
      data: {
        title: "Legacy Node",
      },
    },
  },
  connections: {},
};

const typedNodeDefinitions = [
  toUntypedDefinition(CounterNodeDefinition),
  toUntypedDefinition(TextDisplayDefinition),
  toUntypedDefinition(LegacyNodeDefinition),
];

/**
 * Renders the typed node definitions example in the editor canvas.
 */
export function TypedNodesExample(): React.ReactElement {
  return (
    <div className={classes.wrapper}>
      <NodeEditor
        includeDefaultDefinitions={false}
        nodeDefinitions={typedNodeDefinitions}
        initialData={typedNodesInitialData}
      />
    </div>
  );
}
