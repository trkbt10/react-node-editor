/**
 * @file Node definitions and initial data for the Figma theme example.
 */
import { createNodeDefinition, toUntypedDefinition } from "../../../../../types/NodeDefinition";
import type { NodeEditorData } from "../../../../../types/core";

const createFrameDefinition = () => {
  return createNodeDefinition({
    type: "frame",
    displayName: "Frame",
    description: "Container frame for design elements.",
    category: "Figma",
    defaultData: { title: "Frame" },
    defaultSize: { width: 220, height: 140 },
    ports: [
      {
        id: "content-output",
        type: "output",
        label: "Content",
        position: "right",
      },
      {
        id: "layout-output",
        type: "output",
        label: "Layout",
        position: "bottom",
      },
    ],
  });
};

const createComponentDefinition = () => {
  return createNodeDefinition({
    type: "component",
    displayName: "Component",
    description: "Reusable design component instance.",
    category: "Figma",
    defaultData: { title: "Component" },
    defaultSize: { width: 240, height: 160 },
    ports: [
      {
        id: "content-input",
        type: "input",
        label: "Content",
        position: "left",
      },
      {
        id: "layout-input",
        type: "input",
        label: "Layout",
        position: "left",
      },
      {
        id: "instance-output",
        type: "output",
        label: "Instance",
        position: "right",
      },
    ],
  });
};

const createPrototypeDefinition = () => {
  return createNodeDefinition({
    type: "prototype",
    displayName: "Prototype Link",
    description: "Interactive prototype connection.",
    category: "Figma",
    defaultData: { title: "Prototype Link" },
    defaultSize: { width: 220, height: 140 },
    ports: [
      {
        id: "instance-input",
        type: "input",
        label: "From",
        position: "left",
      },
    ],
  });
};

export const createNodeDefinitions = () => {
  return [createFrameDefinition(), createComponentDefinition(), createPrototypeDefinition()];
};

export const createInitialData = (): NodeEditorData => ({
  nodes: {
    "node-frame": {
      id: "node-frame",
      type: "frame",
      position: { x: 60, y: 180 },
      data: { title: "Frame" },
    },
    "node-component": {
      id: "node-component",
      type: "component",
      position: { x: 360, y: 120 },
      data: { title: "Component" },
    },
    "node-prototype": {
      id: "node-prototype",
      type: "prototype",
      position: { x: 680, y: 200 },
      data: { title: "Prototype Link" },
    },
  },
  connections: {
    "connection-content": {
      id: "connection-content",
      fromNodeId: "node-frame",
      fromPortId: "content-output",
      toNodeId: "node-component",
      toPortId: "content-input",
    },
    "connection-layout": {
      id: "connection-layout",
      fromNodeId: "node-frame",
      fromPortId: "layout-output",
      toNodeId: "node-component",
      toPortId: "layout-input",
    },
    "connection-instance": {
      id: "connection-instance",
      fromNodeId: "node-component",
      fromPortId: "instance-output",
      toNodeId: "node-prototype",
      toPortId: "instance-input",
    },
  },
});

export const getUntypedNodeDefinitions = () => {
  return createNodeDefinitions().map(toUntypedDefinition);
};
