/**
 * @file Node definitions and initial data for the Opal theme example.
 */
import { createNodeDefinition, asNodeDefinition } from "../../../../../types/NodeDefinition";
import type { NodeEditorData } from "../../../../../types/core";
import { opalConnectionRenderer } from "./connectionRenderer";
import { opalPortRenderer } from "./portRenderer";

const createUserInputDefinition = () => {
  return createNodeDefinition({
    type: "user-input",
    displayName: "User Input",
    description: "Captures and processes user requests and context.",
    category: "Opal",
    defaultData: { title: "User Input" },
    defaultSize: { width: 220, height: 140 },
    ports: [
      {
        id: "text-output",
        type: "output",
        label: "Text",
        position: "right",
        renderConnection: opalConnectionRenderer,
        renderPort: opalPortRenderer,
      },
      {
        id: "context-output",
        type: "output",
        label: "Context",
        position: "bottom",
        renderConnection: opalConnectionRenderer,
        renderPort: opalPortRenderer,
      },
    ],
  });
};

const createProcessingDefinition = () => {
  return createNodeDefinition({
    type: "processing",
    displayName: "AI Processing",
    description: "Analyzes and processes input with AI models.",
    category: "Opal",
    defaultData: { title: "AI Processing" },
    defaultSize: { width: 240, height: 160 },
    ports: [
      {
        id: "text-input",
        type: "input",
        label: "Text In",
        position: "left",
        renderConnection: opalConnectionRenderer,
        renderPort: opalPortRenderer,
      },
      {
        id: "context-input",
        type: "input",
        label: "Context",
        position: "left",
        renderConnection: opalConnectionRenderer,
        renderPort: opalPortRenderer,
      },
      {
        id: "result-output",
        type: "output",
        label: "Result",
        position: "right",
        renderConnection: opalConnectionRenderer,
        renderPort: opalPortRenderer,
      },
    ],
  });
};

const createOutputDefinition = () => {
  return createNodeDefinition({
    type: "output",
    displayName: "Response Output",
    description: "Formats and displays the final response.",
    category: "Opal",
    defaultData: { title: "Response Output" },
    defaultSize: { width: 220, height: 140 },
    ports: [
      {
        id: "result-input",
        type: "input",
        label: "Result",
        position: "left",
        renderConnection: opalConnectionRenderer,
        renderPort: opalPortRenderer,
      },
    ],
  });
};

export const createNodeDefinitions = () => {
  return [createUserInputDefinition(), createProcessingDefinition(), createOutputDefinition()];
};

export const createInitialData = (): NodeEditorData => ({
  nodes: {
    "node-input": {
      id: "node-input",
      type: "user-input",
      position: { x: 60, y: 180 },
      data: { title: "User Input" },
    },
    "node-processing": {
      id: "node-processing",
      type: "processing",
      position: { x: 360, y: 120 },
      data: { title: "AI Processing" },
    },
    "node-output": {
      id: "node-output",
      type: "output",
      position: { x: 680, y: 200 },
      data: { title: "Response Output" },
    },
  },
  connections: {
    "connection-text": {
      id: "connection-text",
      fromNodeId: "node-input",
      fromPortId: "text-output",
      toNodeId: "node-processing",
      toPortId: "text-input",
    },
    "connection-context": {
      id: "connection-context",
      fromNodeId: "node-input",
      fromPortId: "context-output",
      toNodeId: "node-processing",
      toPortId: "context-input",
    },
    "connection-result": {
      id: "connection-result",
      fromNodeId: "node-processing",
      fromPortId: "result-output",
      toNodeId: "node-output",
      toPortId: "result-input",
    },
  },
});

export const getUntypedNodeDefinitions = () => {
  return createNodeDefinitions().map(asNodeDefinition);
};
