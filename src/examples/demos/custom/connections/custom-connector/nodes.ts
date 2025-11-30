/**
 * @file Node definitions and initial data for the custom connector example.
 */
import { createNodeDefinition, toUntypedDefinition } from "../../../../../types/NodeDefinition";
import type { NodeEditorData } from "../../../../../types/core";
import { bezierConnectionRenderer } from "./connectionRenderer";

const createSignalGeneratorDefinition = () => {
  return createNodeDefinition({
    type: "signal-generator",
    displayName: "Signal Generator",
    description: "Creates layered modulation envelopes and waveforms.",
    category: "Custom",
    defaultData: { title: "Signal Generator" },
    defaultSize: { width: 240, height: 156 },
    ports: [
      {
        id: "mod-a",
        type: "output",
        label: "Mod A",
        position: "right",
        renderConnection: bezierConnectionRenderer,
      },
      {
        id: "mod-b",
        type: "output",
        label: "Mod B",
        position: "bottom",
        renderConnection: bezierConnectionRenderer,
      },
    ],
  });
};

const createSplineMixerDefinition = () => {
  return createNodeDefinition({
    type: "spline-mixer",
    displayName: "Spline Mixer",
    description: "Blends incoming envelopes and computes modifier tangents.",
    category: "Custom",
    defaultData: { title: "Spline Mixer" },
    defaultSize: { width: 260, height: 180 },
    ports: [
      {
        id: "input-a",
        type: "input",
        label: "Shape A",
        position: "left",
        renderConnection: bezierConnectionRenderer,
      },
      {
        id: "input-b",
        type: "input",
        label: "Shape B",
        position: "left",
        renderConnection: bezierConnectionRenderer,
      },
      {
        id: "output-spline",
        type: "output",
        label: "Spline",
        position: "right",
        renderConnection: bezierConnectionRenderer,
      },
    ],
  });
};

const createShaderBridgeDefinition = () => {
  return createNodeDefinition({
    type: "shader-bridge",
    displayName: "Shader Bridge",
    description: "Routes spline data to shader uniforms and preview.",
    category: "Custom",
    defaultData: { title: "Shader Bridge" },
    defaultSize: { width: 260, height: 160 },
    ports: [
      {
        id: "input-spline",
        type: "input",
        label: "Spline Input",
        position: "left",
        renderConnection: bezierConnectionRenderer,
      },
      {
        id: "output-preview",
        type: "output",
        label: "Preview",
        position: "right",
        renderConnection: bezierConnectionRenderer,
      },
    ],
  });
};

export const createNodeDefinitions = () => {
  return [createSignalGeneratorDefinition(), createSplineMixerDefinition(), createShaderBridgeDefinition()];
};

export const createInitialData = (): NodeEditorData => ({
  nodes: {
    "node-generator": {
      id: "node-generator",
      type: "signal-generator",
      position: { x: 80, y: 200 },
      data: { title: "Orbit Generator" },
    },
    "node-mixer": {
      id: "node-mixer",
      type: "spline-mixer",
      position: { x: 380, y: 140 },
      data: { title: "Curvature Mixer" },
    },
    "node-bridge": {
      id: "node-bridge",
      type: "shader-bridge",
      position: { x: 720, y: 220 },
      data: { title: "Shader Bridge" },
    },
  },
  connections: {
    "connection-mod-a": {
      id: "connection-mod-a",
      fromNodeId: "node-generator",
      fromPortId: "mod-a",
      toNodeId: "node-mixer",
      toPortId: "input-a",
    },
    "connection-mod-b": {
      id: "connection-mod-b",
      fromNodeId: "node-generator",
      fromPortId: "mod-b",
      toNodeId: "node-mixer",
      toPortId: "input-b",
    },
    "connection-spline": {
      id: "connection-spline",
      fromNodeId: "node-mixer",
      fromPortId: "output-spline",
      toNodeId: "node-bridge",
      toPortId: "input-spline",
    },
  },
});

export const getUntypedNodeDefinitions = () => {
  return createNodeDefinitions().map(toUntypedDefinition);
};
