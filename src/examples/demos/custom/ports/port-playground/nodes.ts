/**
 * @file Node definitions and initial data for the custom port example.
 */
import { asNodeDefinition, createNodeDefinition } from "../../../../../types/NodeDefinition";
import type { NodeEditorData } from "../../../../../types/core";
import { customPortRenderer } from "./portRenderer";
import { createConnectionRenderer } from "./connectionRenderer";

export const createDataSourceNodeDefinition = () => {
  return createNodeDefinition({
    type: "data-source",
    displayName: "Data Source",
    description: "Structured capture stream with paired telemetry",
    category: "Custom",
    defaultData: {
      title: "Data Source",
    },
    defaultSize: { width: 220, height: 140 },
    ports: [
      {
        id: "output-frame",
        type: "output",
        label: "Frames",
        position: "right",
        dataType: "image",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("image"),
      },
      {
        id: "output-telemetry",
        type: "output",
        label: "Telemetry",
        position: "bottom",
        dataType: "data",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("data"),
      },
    ],
  });
};

export const createImageProcessorNodeDefinition = () => {
  return createNodeDefinition({
    type: "image-processor",
    displayName: "Image Processor",
    description: "Applies inference and enhancement to image streams",
    category: "Custom",
    defaultData: {
      title: "Image Processor",
    },
    defaultSize: { width: 240, height: 170 },
    ports: [
      {
        id: "input-image",
        type: "input",
        label: "Image In",
        position: "left",
        dataType: "image",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("image"),
      },
      {
        id: "input-settings",
        type: "input",
        label: "Settings",
        position: "top",
        dataType: "data",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("data"),
      },
      {
        id: "output-image",
        type: "output",
        label: "Enhanced Image",
        position: "right",
        dataType: "image",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("image"),
      },
      {
        id: "output-data",
        type: "output",
        label: "Metadata",
        position: "bottom",
        dataType: "data",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("data"),
      },
    ],
  });
};

export const createAudioProcessorNodeDefinition = () => {
  return createNodeDefinition({
    type: "audio-processor",
    displayName: "Audio Processor",
    description: "Synthesizes and routes audio channels",
    category: "Custom",
    defaultData: {
      title: "Audio Processor",
    },
    defaultSize: { width: 220, height: 140 },
    ports: [
      {
        id: "input-audio",
        type: "input",
        label: "Audio In",
        position: "left",
        dataType: "audio",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("audio"),
      },
      {
        id: "output-audio",
        type: "output",
        label: "Spatial Audio",
        position: "right",
        dataType: "audio",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("audio"),
      },
    ],
  });
};

export const createVideoMixerNodeDefinition = () => {
  return createNodeDefinition({
    type: "video-mixer",
    displayName: "Video Mixer",
    description: "Merges multiple channels into synchronized composites",
    category: "Custom",
    defaultData: {
      title: "Video Mixer",
    },
    defaultSize: { width: 280, height: 180 },
    ports: [
      {
        id: "input-video-primary",
        type: "input",
        label: "Primary Feed",
        position: "left",
        dataType: "image",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("image"),
      },
      {
        id: "input-video-secondary",
        type: "input",
        label: "Overlay Feed",
        position: "left",
        dataType: "image",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("image"),
      },
      {
        id: "input-audio-bed",
        type: "input",
        label: "Audio Bed",
        position: "bottom",
        dataType: "audio",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("audio"),
      },
      {
        id: "input-telemetry",
        type: "input",
        label: "Telemetry",
        position: "top",
        dataType: "data",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("data"),
      },
      {
        id: "output-video",
        type: "output",
        label: "Composite Stream",
        position: "right",
        dataType: "video",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("video"),
      },
      {
        id: "monitor-metadata",
        type: "output",
        label: "Monitoring",
        position: "right",
        dataType: "data",
        renderPort: customPortRenderer,
        renderConnection: createConnectionRenderer("data"),
      },
    ],
  });
};

export const createNodeDefinitions = () => {
  return [
    createDataSourceNodeDefinition(),
    createImageProcessorNodeDefinition(),
    createAudioProcessorNodeDefinition(),
    createVideoMixerNodeDefinition(),
  ];
};

export const createInitialData = (): NodeEditorData => ({
  nodes: {
    "node-data-source": {
      id: "node-data-source",
      type: "data-source",
      position: { x: 60, y: 140 },
      data: { title: "Capture Source" },
    },
    "node-image": {
      id: "node-image",
      type: "image-processor",
      position: { x: 380, y: 60 },
      data: { title: "Vision Enhancer" },
    },
    "node-audio": {
      id: "node-audio",
      type: "audio-processor",
      position: { x: 380, y: 260 },
      data: { title: "Spatial Audio" },
    },
    "node-video": {
      id: "node-video",
      type: "video-mixer",
      position: { x: 720, y: 150 },
      data: { title: "Live Mixer" },
    },
  },
  connections: {
    "connection-frame-feed": {
      id: "connection-frame-feed",
      fromNodeId: "node-data-source",
      fromPortId: "output-frame",
      toNodeId: "node-image",
      toPortId: "input-image",
    },
    "connection-calibration": {
      id: "connection-calibration",
      fromNodeId: "node-data-source",
      fromPortId: "output-telemetry",
      toNodeId: "node-image",
      toPortId: "input-settings",
    },
    "connection-vision-to-mixer": {
      id: "connection-vision-to-mixer",
      fromNodeId: "node-image",
      fromPortId: "output-image",
      toNodeId: "node-video",
      toPortId: "input-video-primary",
    },
    "connection-telemetry": {
      id: "connection-telemetry",
      fromNodeId: "node-image",
      fromPortId: "output-data",
      toNodeId: "node-video",
      toPortId: "input-telemetry",
    },
    "connection-audio-bed": {
      id: "connection-audio-bed",
      fromNodeId: "node-audio",
      fromPortId: "output-audio",
      toNodeId: "node-video",
      toPortId: "input-audio-bed",
    },
  },
});

export const getUntypedNodeDefinitions = () => {
  return createNodeDefinitions().map(asNodeDefinition);
};
