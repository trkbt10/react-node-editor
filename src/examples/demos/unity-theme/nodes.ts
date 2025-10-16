/**
 * @file Node definitions and initial data for the Unity theme example.
 */
import { createNodeDefinition, toUntypedDefinition } from "../../../types/NodeDefinition";
import type { NodeEditorData } from "../../../types/core";

const createGameObjectDefinition = () => {
  return createNodeDefinition({
    type: "game-object",
    displayName: "Game Object",
    description: "Base game object with transform component.",
    category: "Unity",
    defaultData: { title: "Game Object" },
    defaultSize: { width: 220, height: 140 },
    ports: [
      {
        id: "transform-output",
        type: "output",
        label: "Transform",
        position: "right",
      },
      {
        id: "event-output",
        type: "output",
        label: "Event",
        position: "bottom",
      },
    ],
  });
};

const createScriptDefinition = () => {
  return createNodeDefinition({
    type: "script",
    displayName: "Script Component",
    description: "Custom script component for game logic.",
    category: "Unity",
    defaultData: { title: "Script Component" },
    defaultSize: { width: 240, height: 160 },
    ports: [
      {
        id: "transform-input",
        type: "input",
        label: "Transform",
        position: "left",
      },
      {
        id: "event-input",
        type: "input",
        label: "Event In",
        position: "left",
      },
      {
        id: "action-output",
        type: "output",
        label: "Action",
        position: "right",
      },
    ],
  });
};

const createRendererDefinition = () => {
  return createNodeDefinition({
    type: "renderer",
    displayName: "Renderer",
    description: "Renders visual representation of the object.",
    category: "Unity",
    defaultData: { title: "Renderer" },
    defaultSize: { width: 220, height: 140 },
    ports: [
      {
        id: "action-input",
        type: "input",
        label: "Action",
        position: "left",
      },
    ],
  });
};

export const createNodeDefinitions = () => {
  return [createGameObjectDefinition(), createScriptDefinition(), createRendererDefinition()];
};

export const createInitialData = (): NodeEditorData => ({
  nodes: {
    "node-gameobject": {
      id: "node-gameobject",
      type: "game-object",
      position: { x: 60, y: 180 },
      data: { title: "Game Object" },
    },
    "node-script": {
      id: "node-script",
      type: "script",
      position: { x: 360, y: 120 },
      data: { title: "Script Component" },
    },
    "node-renderer": {
      id: "node-renderer",
      type: "renderer",
      position: { x: 680, y: 200 },
      data: { title: "Renderer" },
    },
  },
  connections: {
    "connection-transform": {
      id: "connection-transform",
      fromNodeId: "node-gameobject",
      fromPortId: "transform-output",
      toNodeId: "node-script",
      toPortId: "transform-input",
    },
    "connection-event": {
      id: "connection-event",
      fromNodeId: "node-gameobject",
      fromPortId: "event-output",
      toNodeId: "node-script",
      toPortId: "event-input",
    },
    "connection-action": {
      id: "connection-action",
      fromNodeId: "node-script",
      fromPortId: "action-output",
      toNodeId: "node-renderer",
      toPortId: "action-input",
    },
  },
});

export const getUntypedNodeDefinitions = () => {
  return createNodeDefinitions().map(toUntypedDefinition);
};
