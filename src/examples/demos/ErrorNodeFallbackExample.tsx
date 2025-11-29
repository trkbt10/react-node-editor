/**
 * @file Demonstration of error node fallback functionality
 * Shows how unknown node types are handled with and without fallbackDefinition
 */
import * as React from "react";

import { NodeEditor } from "../../NodeEditor";
import type { NodeEditorData } from "../../types/core";
import type { NodeDefinition } from "../../types/NodeDefinition";
import { isErrorNodeType, getOriginalTypeFromErrorType } from "../../node-definitions/error";
import classes from "./ErrorNodeFallbackExample.module.css";

/**
 * Sample data containing nodes with both known and unknown types.
 * The "unknown-widget" and "deprecated-component" types are intentionally not registered.
 */
const initialData: NodeEditorData = {
  nodes: {
    "known-group": {
      id: "known-group",
      type: "group",
      position: { x: 50, y: 50 },
      size: { width: 300, height: 200 },
      data: {
        title: "Known Group Node",
      },
    },
    "unknown-1": {
      id: "unknown-1",
      type: "unknown-widget",
      position: { x: 400, y: 80 },
      size: { width: 200, height: 120 },
      data: {
        title: "My Widget",
        content: "This node type does not exist in the registry",
      },
    },
    "unknown-2": {
      id: "unknown-2",
      type: "deprecated-component",
      position: { x: 400, y: 240 },
      size: { width: 200, height: 120 },
      data: {
        title: "Old Component",
        content: "This was removed in v2.0",
      },
    },
    "known-label": {
      id: "known-label",
      type: "label",
      position: { x: 80, y: 280 },
      size: { width: 220, height: 72 },
      data: {
        title: "Label",
        labelTitle: "Known Label Node",
        labelSubtitle: "This type is registered",
        align: "center",
      },
    },
  },
  connections: {},
};

/**
 * Simple custom node definition for demonstration
 */
const CustomNodeDefinition: NodeDefinition = {
  type: "custom-node",
  displayName: "Custom Node",
  description: "A simple custom node for demonstration",
  category: "Custom",
  defaultData: {
    title: "Custom Node",
  },
  defaultSize: { width: 180, height: 100 },
  ports: [],
  behaviors: ["node"],
};

/**
 * Demonstrates the error node fallback feature.
 * Left panel: Editor with fallbackDefinition enabled (shows error nodes for unknown types)
 * Right panel: Editor without fallback (shows default rendering for unknown types)
 */
export function ErrorNodeFallbackExample(): React.ReactElement {
  return (
    <div className={classes.wrapper}>
      <div className={classes.panelContainer}>
        <div className={classes.panel}>
          <div className={classes.panelHeader}>
            <h2 className={classes.panelTitle}>With Error Node Fallback (Default)</h2>
            <p className={classes.panelDescription}>
              <code>fallbackDefinition: true</code> (default) - Unknown node types display as error nodes
            </p>
          </div>
          <div className={classes.editorContainer}>
            <NodeEditor
              initialData={initialData}
              nodeDefinitions={[CustomNodeDefinition]}
            />
          </div>
        </div>

        <div className={classes.panel}>
          <div className={classes.panelHeader}>
            <h2 className={classes.panelTitle}>Without Fallback</h2>
            <p className={classes.panelDescription}>
              <code>fallbackDefinition: false</code> - Unknown types render with default styling
            </p>
          </div>
          <div className={classes.editorContainer}>
            <NodeEditor
              initialData={initialData}
              nodeDefinitions={[CustomNodeDefinition]}
              fallbackDefinition={false}
            />
          </div>
        </div>
      </div>

      <div className={classes.infoPanel}>
        <h3 className={classes.infoTitle}>Error Node Utilities</h3>
        <div className={classes.infoContent}>
          <div className={classes.utilityDemo}>
            <code className={classes.codeBlock}>isErrorNodeType("__error__:widget")</code>
            <span className={classes.result}>{String(isErrorNodeType("__error__:widget"))}</span>
          </div>
          <div className={classes.utilityDemo}>
            <code className={classes.codeBlock}>isErrorNodeType("standard")</code>
            <span className={classes.result}>{String(isErrorNodeType("standard"))}</span>
          </div>
          <div className={classes.utilityDemo}>
            <code className={classes.codeBlock}>getOriginalTypeFromErrorType("__error__:widget")</code>
            <span className={classes.result}>"{getOriginalTypeFromErrorType("__error__:widget")}"</span>
          </div>
        </div>
      </div>
    </div>
  );
}
