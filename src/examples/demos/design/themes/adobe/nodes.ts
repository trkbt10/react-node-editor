/**
 * @file Node definitions and initial data for the Adobe theme example.
 */
import { createNodeDefinition, asNodeDefinition } from "../../../../../types/NodeDefinition";
import type { NodeEditorData } from "../../../../../types/core";

const createImageSourceDefinition = () => {
  return createNodeDefinition({
    type: "image-source",
    displayName: "Image Source",
    description: "Input image or layer for editing.",
    category: "Adobe",
    defaultData: { title: "Image Source" },
    defaultSize: { width: 220, height: 140 },
    ports: [
      {
        id: "image-output",
        type: "output",
        label: "Image",
        position: "right",
      },
      {
        id: "mask-output",
        type: "output",
        label: "Mask",
        position: "bottom",
      },
    ],
  });
};

const createEffectDefinition = () => {
  return createNodeDefinition({
    type: "effect",
    displayName: "Effect Layer",
    description: "Apply effects and filters to the image.",
    category: "Adobe",
    defaultData: { title: "Effect Layer" },
    defaultSize: { width: 240, height: 160 },
    ports: [
      {
        id: "image-input",
        type: "input",
        label: "Image In",
        position: "left",
      },
      {
        id: "mask-input",
        type: "input",
        label: "Mask",
        position: "left",
      },
      {
        id: "image-output",
        type: "output",
        label: "Result",
        position: "right",
      },
    ],
  });
};

const createCompositionDefinition = () => {
  return createNodeDefinition({
    type: "composition",
    displayName: "Composition Output",
    description: "Final composition and render output.",
    category: "Adobe",
    defaultData: { title: "Composition Output" },
    defaultSize: { width: 220, height: 140 },
    ports: [
      {
        id: "image-input",
        type: "input",
        label: "Final Image",
        position: "left",
      },
    ],
  });
};

export const createNodeDefinitions = () => {
  return [createImageSourceDefinition(), createEffectDefinition(), createCompositionDefinition()];
};

export const createInitialData = (): NodeEditorData => ({
  nodes: {
    "node-source": {
      id: "node-source",
      type: "image-source",
      position: { x: 60, y: 180 },
      data: { title: "Image Source" },
    },
    "node-effect": {
      id: "node-effect",
      type: "effect",
      position: { x: 360, y: 120 },
      data: { title: "Effect Layer" },
    },
    "node-composition": {
      id: "node-composition",
      type: "composition",
      position: { x: 680, y: 200 },
      data: { title: "Composition Output" },
    },
  },
  connections: {
    "connection-image": {
      id: "connection-image",
      fromNodeId: "node-source",
      fromPortId: "image-output",
      toNodeId: "node-effect",
      toPortId: "image-input",
    },
    "connection-mask": {
      id: "connection-mask",
      fromNodeId: "node-source",
      fromPortId: "mask-output",
      toNodeId: "node-effect",
      toPortId: "mask-input",
    },
    "connection-result": {
      id: "connection-result",
      fromNodeId: "node-effect",
      fromPortId: "image-output",
      toNodeId: "node-composition",
      toPortId: "image-input",
    },
  },
});

export const getUntypedNodeDefinitions = () => {
  return createNodeDefinitions().map(asNodeDefinition);
};
