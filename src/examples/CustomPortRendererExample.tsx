import * as React from "react";
import { NodeEditor } from "../NodeEditor";
import { createNodeDefinition, toUntypedDefinition, type ConnectionRenderContext } from "../types/NodeDefinition";
import type { NodeEditorData } from "../types/core";

/**
 * Custom Port Renderer Example
 *
 * This example demonstrates how to customize port and connection appearance
 * using the renderPort and renderConnection functions in PortDefinition.
 */

// Custom port renderer example - changes color based on data type
const customPortRenderer = (context: any, defaultRender: () => React.ReactElement) => {
  const { port, isConnected, isHovered } = context;

  // Define colors for different data types
  const colorMap: Record<string, string> = {
    data: "#4CAF50",
    image: "#2196F3",
    audio: "#FF9800",
    video: "#9C27B0",
  };

  const color = colorMap[port.dataType || ""] || "#999";
  const size = isHovered ? 14 : isConnected ? 12 : 10;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundColor: color,
        border: `2px solid ${isConnected ? color : "#fff"}`,
        boxShadow: isHovered ? `0 0 8px ${color}` : "none",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      title={port.label}
    />
  );
};

// Custom connection renderer example - animated dashed line
const customConnectionRenderer = (
  context: ConnectionRenderContext,
  defaultRender: () => React.ReactElement
) => {
  const { fromPort, fromPosition, toPosition, isSelected, isHovered } = context;

  // Define colors for different data types
  const colorMap: Record<string, string> = {
    data: "#4CAF50",
    image: "#2196F3",
    audio: "#FF9800",
    video: "#9C27B0",
  };

  const color = colorMap[fromPort.dataType || ""] || "#999";
  const strokeWidth = isSelected || isHovered ? 3 : 2;
  const distance = Math.hypot(toPosition.x - fromPosition.x, toPosition.y - fromPosition.y) || 1;
  const glowStrength = Math.min(distance / 120, 1);

  // For demonstration, we'll wrap the default renderer with custom styling
  // In a real implementation, you'd build the SVG from scratch
  return (
    <g
      style={{
        filter: isSelected ? `drop-shadow(0 0 ${4 + glowStrength * 4}px ${color})` : "none",
      }}
    >
      {defaultRender()}
      <circle
        cx={toPosition.x}
        cy={toPosition.y}
        r={4 + glowStrength * 4}
        fill={color}
        fillOpacity={0.2}
        stroke={color}
        strokeWidth={strokeWidth / 2}
      />
    </g>
  );
};

// Define custom node types with custom port renderers
const dataSourceNode = createNodeDefinition({
  type: "data-source",
  displayName: "Data Source",
  description: "Provides data output",
  category: "Custom",
  defaultData: {
    title: "Data Source",
  },
  defaultSize: { width: 180, height: 100 },
  ports: [
    {
      id: "output",
      type: "output",
      label: "Data",
      position: "right",
      dataType: "data",
      renderPort: customPortRenderer,
      renderConnection: customConnectionRenderer,
    },
  ],
});

const imageProcessorNode = createNodeDefinition({
  type: "image-processor",
  displayName: "Image Processor",
  description: "Processes image data",
  category: "Custom",
  defaultData: {
    title: "Image Processor",
  },
  defaultSize: { width: 200, height: 120 },
  ports: [
    {
      id: "input-image",
      type: "input",
      label: "Image In",
      position: "left",
      dataType: "image",
      renderPort: customPortRenderer,
      renderConnection: customConnectionRenderer,
    },
    {
      id: "output-image",
      type: "output",
      label: "Image Out",
      position: "right",
      dataType: "image",
      renderPort: customPortRenderer,
      renderConnection: customConnectionRenderer,
    },
    {
      id: "output-data",
      type: "output",
      label: "Metadata",
      position: "right",
      dataType: "data",
      renderPort: customPortRenderer,
      renderConnection: customConnectionRenderer,
    },
  ],
});

const audioProcessorNode = createNodeDefinition({
  type: "audio-processor",
  displayName: "Audio Processor",
  description: "Processes audio data",
  category: "Custom",
  defaultData: {
    title: "Audio Processor",
  },
  defaultSize: { width: 200, height: 120 },
  ports: [
    {
      id: "input-audio",
      type: "input",
      label: "Audio In",
      position: "left",
      dataType: "audio",
      renderPort: customPortRenderer,
      renderConnection: customConnectionRenderer,
    },
    {
      id: "output-audio",
      type: "output",
      label: "Audio Out",
      position: "right",
      dataType: "audio",
      renderPort: customPortRenderer,
      renderConnection: customConnectionRenderer,
    },
  ],
});

// Sample data
const initialData: NodeEditorData = {
  nodes: {
    "node-1": {
      id: "node-1",
      type: "data-source",
      position: { x: 100, y: 100 },
      data: { title: "Data Source" },
    },
    "node-2": {
      id: "node-2",
      type: "image-processor",
      position: { x: 400, y: 80 },
      data: { title: "Image Processor" },
    },
    "node-3": {
      id: "node-3",
      type: "audio-processor",
      position: { x: 400, y: 250 },
      data: { title: "Audio Processor" },
    },
  },
  connections: {},
};

export const CustomPortRendererExample: React.FC = () => {
  const [data, setData] = React.useState<NodeEditorData>(initialData);

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <h2>Custom Port Renderer Example</h2>
      <p>
        This example shows how to customize port and connection appearance using{" "}
        <code>renderPort</code> and <code>renderConnection</code>.
      </p>
      <ul>
        <li>Ports are colored based on their data type</li>
        <li>Ports change size when hovered or connected</li>
        <li>Connections inherit the color from their source port</li>
      </ul>
      <NodeEditor
        data={data}
        onDataChange={setData}
        nodeDefinitions={[
          toUntypedDefinition(dataSourceNode),
          toUntypedDefinition(imageProcessorNode),
          toUntypedDefinition(audioProcessorNode),
        ]}
      />
    </div>
  );
};

export default CustomPortRendererExample;
