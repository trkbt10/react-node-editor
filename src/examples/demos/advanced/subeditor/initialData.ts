/**
 * @file Initial data factories for the advanced nested editor example
 */
import type { NodeEditorData } from "../../../../types/core";
import type { SubEditorNodeData } from "./types";

const defaultNodeSize = { width: 180, height: 120 };

const nestedNodeSize = { width: 160, height: 110 };

function createStandardNode(
  id: string,
  title: string,
  position: { x: number; y: number },
  content?: string,
): NodeEditorData["nodes"][string] {
  return {
    id,
    type: "standard",
    position,
    size: defaultNodeSize,
    data: {
      title,
      ...(content ? { content } : {}),
    },
  };
}

function createNestedStandardNode(
  id: string,
  title: string,
  position: { x: number; y: number },
  content?: string,
): NodeEditorData["nodes"][string] {
  return {
    id,
    type: "standard",
    position,
    size: nestedNodeSize,
    data: {
      title,
      ...(content ? { content } : {}),
    },
  };
}

/**
 * Creates a default nested editor flow for a given namespace.
 *
 * @param namespace - Namespace used to namespace node and connection IDs.
 * @returns NodeEditorData describing a simple three-step flow.
 */
export function createDefaultSubEditorData(namespace: string): NodeEditorData {
  return {
    nodes: {
      [`${namespace}-ingest`]: createNestedStandardNode(
        `${namespace}-ingest`,
        "Ingest",
        { x: 40, y: 40 },
        "Collect raw events.",
      ),
      [`${namespace}-process`]: createNestedStandardNode(
        `${namespace}-process`,
        "Transform",
        { x: 260, y: 40 },
        "Normalize payload.",
      ),
      [`${namespace}-evaluate`]: createNestedStandardNode(
        `${namespace}-evaluate`,
        "Evaluate",
        { x: 480, y: 40 },
        "Run quality checks.",
      ),
    },
    connections: {
      [`${namespace}-conn-1`]: {
        id: `${namespace}-conn-1`,
        fromNodeId: `${namespace}-ingest`,
        fromPortId: "output",
        toNodeId: `${namespace}-process`,
        toPortId: "input",
      },
      [`${namespace}-conn-2`]: {
        id: `${namespace}-conn-2`,
        fromNodeId: `${namespace}-process`,
        fromPortId: "output",
        toNodeId: `${namespace}-evaluate`,
        toPortId: "input",
      },
    },
  };
}

/**
 * Builds the data payload for a sub-editor node, including nested flow details.
 *
 * @param title - Display title for the sub-editor node.
 * @param namespace - Identifier namespace for nested nodes and connections.
 * @param description - Text describing the node purpose.
 * @returns SubEditorNodeData containing metadata and nested editor data.
 */
export function createSubEditorNodeData(title: string, namespace: string, description: string): SubEditorNodeData {
  return {
    title,
    description,
    nestedEditorData: createDefaultSubEditorData(namespace),
    lastUpdated: new Date().toISOString(),
  };
}

export const advancedNestedInitialData: NodeEditorData = {
  nodes: {
    "source-stream": createStandardNode("source-stream", "Event Stream", { x: 40, y: 120 }, "Kafka topic: metrics.raw"),
    "sub-analytics": {
      id: "sub-analytics",
      type: "sub-editor",
      position: { x: 320, y: 40 },
      size: { width: 320, height: 220 },
      data: createSubEditorNodeData("Analytics Pipeline", "analytics", "Aggregate metrics before training."),
    },
    "sub-automation": {
      id: "sub-automation",
      type: "sub-editor",
      position: { x: 680, y: 240 },
      size: { width: 320, height: 220 },
      data: createSubEditorNodeData("Automation Flow", "automation", "Drive alert automation for critical signals."),
    },
    "model-training": createStandardNode(
      "model-training",
      "Model Training",
      { x: 640, y: 40 },
      "Update weights nightly.",
    ),
    "alerting": createStandardNode("alerting", "Alert Sink", { x: 1040, y: 200 }, "PagerDuty + Slack routing."),
  },
  connections: {
    "conn-1": {
      id: "conn-1",
      fromNodeId: "source-stream",
      fromPortId: "output",
      toNodeId: "sub-analytics",
      toPortId: "input",
    },
    "conn-2": {
      id: "conn-2",
      fromNodeId: "sub-analytics",
      fromPortId: "output",
      toNodeId: "model-training",
      toPortId: "input",
    },
    "conn-3": {
      id: "conn-3",
      fromNodeId: "sub-analytics",
      fromPortId: "output",
      toNodeId: "sub-automation",
      toPortId: "input",
    },
    "conn-4": {
      id: "conn-4",
      fromNodeId: "sub-automation",
      fromPortId: "output",
      toNodeId: "alerting",
      toPortId: "input",
    },
  },
};

/*
debug-notes:
- Mirror nested graphs to ensure sub-editors have meaningful content; coordinates chosen to align with default node sizes.
- Standard nodes reuse createStandardNode helper for brevity.
*/
