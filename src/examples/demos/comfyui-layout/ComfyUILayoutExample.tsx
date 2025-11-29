/**
 * @file ComfyUI-style port layout demonstration
 * Shows how to use computePortPositions for custom region-based port placement
 * similar to ComfyUI's node layout where ports are grouped at the top
 */
import * as React from "react";
import { NodeEditor } from "../../../NodeEditor";
import type { NodeDefinition, NodeRenderProps, ComputePortPositionsContext, ComputedPortPosition } from "../../../types/NodeDefinition";
import type { NodeEditorData, Port, Size } from "../../../types/core";
import { ExampleLayout } from "../parts/ExampleLayout";
import { ExampleHeader } from "../parts/ExampleHeader";
import { ExampleWrapper } from "../parts/ExampleWrapper";
import { getNodeBoundingBox } from "../../../utils/boundingBoxUtils";
import styles from "./ComfyUILayoutExample.module.css";

type ComfyNodeData = {
  title?: string;
  previewImage?: string;
  parameters?: Record<string, string>;
};

/**
 * Layout configuration for ComfyUI-style nodes
 */
const COMFY_LAYOUT = {
  titleHeight: 28,
  headerHeight: 50,
};

/**
 * Calculate port position within a region
 */
function calculateRegionPosition(
  port: Port,
  regionPorts: Port[],
  region: { top: number; height: number },
  nodeSize: Size,
  nodePosition: { x: number; y: number },
  side: "left" | "right",
): ComputedPortPosition {
  const portIndex = regionPorts.indexOf(port);
  const totalPorts = regionPorts.length;

  // Calculate relative offset within the region (0-1)
  const relativeOffset = totalPorts === 1
    ? 0.5
    : (portIndex + 1) / (totalPorts + 1);

  // Calculate Y position within the region
  const y = region.top + region.height * relativeOffset;

  // Connection margin
  const connectionMargin = 4;

  return {
    renderPosition: {
      x: side === "left" ? -6 : nodeSize.width - 6,
      y,
      transform: "translateY(-50%)",
    },
    connectionPoint: {
      x: nodePosition.x + (side === "left" ? -connectionMargin : nodeSize.width + connectionMargin),
      y: nodePosition.y + y,
    },
  };
}

/**
 * Custom port position computation for ComfyUI-style layouts
 * Groups ports into header and body regions
 */
function computeComfyPortPositions(context: ComputePortPositionsContext): Map<string, ComputedPortPosition> {
  const { node, ports, nodeSize } = context;
  const result = new Map<string, ComputedPortPosition>();

  const { left: nodeX, top: nodeY } = getNodeBoundingBox(node);

  // Define regions
  const headerRegion = {
    top: COMFY_LAYOUT.titleHeight,
    height: COMFY_LAYOUT.headerHeight,
  };
  const bodyRegion = {
    top: COMFY_LAYOUT.titleHeight + COMFY_LAYOUT.headerHeight,
    height: Math.max(0, nodeSize.height - COMFY_LAYOUT.titleHeight - COMFY_LAYOUT.headerHeight),
  };

  // Separate ports by region (based on align value)
  // Ports with align < 0.5 are considered header ports
  // We use the segment field to indicate region: "header" or "body"
  const leftHeaderPorts: Port[] = [];
  const leftBodyPorts: Port[] = [];
  const rightHeaderPorts: Port[] = [];
  const rightBodyPorts: Port[] = [];

  for (const port of ports) {
    const side = port.placement?.side ?? port.position;
    const segment = port.placement?.segment;
    const isHeader = segment === "header";

    if (side === "left") {
      if (isHeader) {
        leftHeaderPorts.push(port);
      } else {
        leftBodyPorts.push(port);
      }
    } else {
      if (isHeader) {
        rightHeaderPorts.push(port);
      } else {
        rightBodyPorts.push(port);
      }
    }
  }

  // Calculate positions for each group
  for (const port of leftHeaderPorts) {
    result.set(port.id, calculateRegionPosition(
      port, leftHeaderPorts, headerRegion, nodeSize, { x: nodeX, y: nodeY }, "left"
    ));
  }
  for (const port of leftBodyPorts) {
    result.set(port.id, calculateRegionPosition(
      port, leftBodyPorts, bodyRegion, nodeSize, { x: nodeX, y: nodeY }, "left"
    ));
  }
  for (const port of rightHeaderPorts) {
    result.set(port.id, calculateRegionPosition(
      port, rightHeaderPorts, headerRegion, nodeSize, { x: nodeX, y: nodeY }, "right"
    ));
  }
  for (const port of rightBodyPorts) {
    result.set(port.id, calculateRegionPosition(
      port, rightBodyPorts, bodyRegion, nodeSize, { x: nodeX, y: nodeY }, "right"
    ));
  }

  return result;
}

/**
 * Custom node renderer that positions content below the header port region
 */
function ComfyUINodeRenderer(props: NodeRenderProps<ComfyNodeData>): React.ReactElement {
  const { node, isSelected } = props;
  const nodeData = node.data;

  // Calculate content area (after header region)
  const contentTop = COMFY_LAYOUT.titleHeight + COMFY_LAYOUT.headerHeight;
  const nodeHeight = node.size?.height ?? 180;
  const contentHeight = Math.max(0, nodeHeight - contentTop);

  return (
    <div className={styles.comfyNode} data-selected={isSelected}>
      {/* Header region - ports are rendered here by the framework */}
      <div className={styles.nodeTitle}>
        {nodeData.title || node.type}
      </div>

      {/* Content area - positioned after header region */}
      <div
        className={styles.nodeContent}
        style={{
          position: "absolute",
          left: 0,
          top: contentTop,
          width: "100%",
          height: contentHeight,
        }}
      >
        {nodeData.previewImage && (
          <div className={styles.previewArea}>
            <div className={styles.previewPlaceholder}>
              Preview: {nodeData.previewImage}
            </div>
          </div>
        )}
        {nodeData.parameters && (
          <div className={styles.parameterList}>
            {Object.entries(nodeData.parameters).map(([key, value]) => (
              <div key={key} className={styles.parameterRow}>
                <span className={styles.parameterLabel}>{key}:</span>
                <span className={styles.parameterValue}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Node definitions with ComfyUI-style port layout using computePortPositions
 */
const nodeDefinitions: NodeDefinition[] = [
  {
    type: "load-image",
    displayName: "Load Image",
    defaultSize: { width: 200, height: 180 },
    disableOutline: true,
    computePortPositions: computeComfyPortPositions,
    ports: [
      {
        id: "image-out",
        type: "output",
        label: "IMAGE",
        position: { side: "right", segment: "header", align: 0.5 },
        dataType: "image",
      },
      {
        id: "mask-out",
        type: "output",
        label: "MASK",
        position: { side: "right", segment: "body", align: 0.3 },
        dataType: "mask",
      },
    ],
    defaultData: {
      title: "Load Image",
      previewImage: "example.png",
      parameters: {
        "upload": "Choose file...",
      },
    },
    renderNode: ComfyUINodeRenderer,
  },
  {
    type: "ksampler",
    displayName: "KSampler",
    defaultSize: { width: 240, height: 280 },
    disableOutline: true,
    computePortPositions: computeComfyPortPositions,
    ports: [
      // Header region inputs (left side)
      {
        id: "model-in",
        type: "input",
        label: "model",
        position: { side: "left", segment: "header", align: 0.25 },
        dataType: "model",
      },
      {
        id: "positive-in",
        type: "input",
        label: "positive",
        position: { side: "left", segment: "header", align: 0.5 },
        dataType: "conditioning",
      },
      {
        id: "negative-in",
        type: "input",
        label: "negative",
        position: { side: "left", segment: "header", align: 0.75 },
        dataType: "conditioning",
      },
      // Body region inputs
      {
        id: "latent-in",
        type: "input",
        label: "latent_image",
        position: { side: "left", segment: "body", align: 0.3 },
        dataType: "latent",
      },
      // Header region output (right side)
      {
        id: "latent-out",
        type: "output",
        label: "LATENT",
        position: { side: "right", segment: "header", align: 0.5 },
        dataType: "latent",
      },
    ],
    defaultData: {
      title: "KSampler",
      parameters: {
        "seed": "42",
        "steps": "20",
        "cfg": "7.0",
        "sampler": "euler",
        "scheduler": "normal",
        "denoise": "1.0",
      },
    },
    renderNode: ComfyUINodeRenderer,
  },
  {
    type: "vae-decode",
    displayName: "VAE Decode",
    defaultSize: { width: 180, height: 160 },
    disableOutline: true,
    computePortPositions: computeComfyPortPositions,
    ports: [
      {
        id: "samples-in",
        type: "input",
        label: "samples",
        position: { side: "left", segment: "header", align: 0.4 },
        dataType: "latent",
      },
      {
        id: "vae-in",
        type: "input",
        label: "vae",
        position: { side: "left", segment: "header", align: 0.7 },
        dataType: "vae",
      },
      {
        id: "image-out",
        type: "output",
        label: "IMAGE",
        position: { side: "right", segment: "header", align: 0.5 },
        dataType: "image",
      },
    ],
    defaultData: {
      title: "VAE Decode",
      previewImage: "output.png",
    },
    renderNode: ComfyUINodeRenderer,
  },
  {
    type: "clip-encode",
    displayName: "CLIP Text Encode",
    defaultSize: { width: 220, height: 200 },
    disableOutline: true,
    computePortPositions: computeComfyPortPositions,
    ports: [
      {
        id: "clip-in",
        type: "input",
        label: "clip",
        position: { side: "left", segment: "header", align: 0.5 },
        dataType: "clip",
      },
      {
        id: "conditioning-out",
        type: "output",
        label: "CONDITIONING",
        position: { side: "right", segment: "header", align: 0.5 },
        dataType: "conditioning",
      },
    ],
    defaultData: {
      title: "CLIP Text Encode",
      parameters: {
        "text": "a beautiful landscape",
      },
    },
    renderNode: ComfyUINodeRenderer,
  },
  {
    type: "checkpoint-loader",
    displayName: "Load Checkpoint",
    defaultSize: { width: 200, height: 160 },
    disableOutline: true,
    computePortPositions: computeComfyPortPositions,
    ports: [
      // Multiple outputs in header region
      {
        id: "model-out",
        type: "output",
        label: "MODEL",
        position: { side: "right", segment: "header", align: 0.25 },
        dataType: "model",
      },
      {
        id: "clip-out",
        type: "output",
        label: "CLIP",
        position: { side: "right", segment: "header", align: 0.5 },
        dataType: "clip",
      },
      {
        id: "vae-out",
        type: "output",
        label: "VAE",
        position: { side: "right", segment: "header", align: 0.75 },
        dataType: "vae",
      },
    ],
    defaultData: {
      title: "Load Checkpoint",
      parameters: {
        "ckpt_name": "v1-5-pruned.safetensors",
      },
    },
    renderNode: ComfyUINodeRenderer,
  },
  {
    type: "save-image",
    displayName: "Save Image",
    defaultSize: { width: 180, height: 180 },
    disableOutline: true,
    computePortPositions: computeComfyPortPositions,
    ports: [
      {
        id: "images-in",
        type: "input",
        label: "images",
        position: { side: "left", segment: "header", align: 0.5 },
        dataType: "image",
      },
    ],
    defaultData: {
      title: "Save Image",
      previewImage: "output_00001.png",
      parameters: {
        "filename_prefix": "ComfyUI",
      },
    },
    renderNode: ComfyUINodeRenderer,
  },
];

/**
 * Initial editor data with a simple workflow
 */
const initialData: NodeEditorData = {
  nodes: {
    "checkpoint": {
      id: "checkpoint",
      type: "checkpoint-loader",
      position: { x: 100, y: 200 },
      size: { width: 200, height: 160 },
      data: {
        title: "Load Checkpoint",
        parameters: {
          "ckpt_name": "v1-5-pruned.safetensors",
        },
      },
    },
    "clip-positive": {
      id: "clip-positive",
      type: "clip-encode",
      position: { x: 350, y: 100 },
      size: { width: 220, height: 200 },
      data: {
        title: "CLIP Text Encode (Positive)",
        parameters: {
          "text": "a beautiful mountain landscape, sunset",
        },
      },
    },
    "clip-negative": {
      id: "clip-negative",
      type: "clip-encode",
      position: { x: 350, y: 320 },
      size: { width: 220, height: 200 },
      data: {
        title: "CLIP Text Encode (Negative)",
        parameters: {
          "text": "blurry, low quality",
        },
      },
    },
    "ksampler": {
      id: "ksampler",
      type: "ksampler",
      position: { x: 620, y: 180 },
      size: { width: 240, height: 280 },
      data: {
        title: "KSampler",
        parameters: {
          "seed": "42",
          "steps": "20",
          "cfg": "7.0",
          "sampler": "euler",
          "scheduler": "normal",
          "denoise": "1.0",
        },
      },
    },
    "vae-decode": {
      id: "vae-decode",
      type: "vae-decode",
      position: { x: 900, y: 220 },
      size: { width: 180, height: 160 },
      data: {
        title: "VAE Decode",
        previewImage: "output.png",
      },
    },
    "save-image": {
      id: "save-image",
      type: "save-image",
      position: { x: 1120, y: 200 },
      size: { width: 180, height: 180 },
      data: {
        title: "Save Image",
        previewImage: "output_00001.png",
        parameters: {
          "filename_prefix": "ComfyUI",
        },
      },
    },
  },
  connections: {
    "conn-model": {
      id: "conn-model",
      fromNodeId: "checkpoint",
      fromPortId: "model-out",
      toNodeId: "ksampler",
      toPortId: "model-in",
    },
    "conn-clip-positive": {
      id: "conn-clip-positive",
      fromNodeId: "checkpoint",
      fromPortId: "clip-out",
      toNodeId: "clip-positive",
      toPortId: "clip-in",
    },
    "conn-clip-negative": {
      id: "conn-clip-negative",
      fromNodeId: "checkpoint",
      fromPortId: "clip-out",
      toNodeId: "clip-negative",
      toPortId: "clip-in",
    },
    "conn-positive": {
      id: "conn-positive",
      fromNodeId: "clip-positive",
      fromPortId: "conditioning-out",
      toNodeId: "ksampler",
      toPortId: "positive-in",
    },
    "conn-negative": {
      id: "conn-negative",
      fromNodeId: "clip-negative",
      fromPortId: "conditioning-out",
      toNodeId: "ksampler",
      toPortId: "negative-in",
    },
    "conn-latent": {
      id: "conn-latent",
      fromNodeId: "ksampler",
      fromPortId: "latent-out",
      toNodeId: "vae-decode",
      toPortId: "samples-in",
    },
    "conn-vae": {
      id: "conn-vae",
      fromNodeId: "checkpoint",
      fromPortId: "vae-out",
      toNodeId: "vae-decode",
      toPortId: "vae-in",
    },
    "conn-image": {
      id: "conn-image",
      fromNodeId: "vae-decode",
      fromPortId: "image-out",
      toNodeId: "save-image",
      toPortId: "images-in",
    },
  },
};

export const ComfyUILayoutExample: React.FC = () => {
  const [data, setData] = React.useState<NodeEditorData>(initialData);

  return (
    <ExampleLayout
      header={
        <ExampleHeader
          title="ComfyUI-Style Port Layout"
          description="Demonstrates custom port position computation where ports are grouped in header/body regions using computePortPositions."
        />
      }
    >
      <ExampleWrapper>
        <div className={styles.layout}>
          <div className={styles.info}>
            <h3>Custom Port Positioning</h3>
            <ul>
              <li><strong>computePortPositions:</strong> Custom function on NodeDefinition for full control over port placement</li>
              <li><strong>Header/Body Regions:</strong> Use <code>segment: "header"</code> or <code>segment: "body"</code> in placement</li>
              <li><strong>Custom Renderer:</strong> Position content based on known layout dimensions</li>
            </ul>
            <h3>Configuration</h3>
            <pre className={styles.codeBlock}>
{`// Define on NodeDefinition
computePortPositions: (context) => {
  const { node, ports, nodeSize } = context;
  const result = new Map();

  // Custom logic to position ports
  for (const port of ports) {
    result.set(port.id, {
      renderPosition: { x, y, transform },
      connectionPoint: { x, y },
    });
  }

  return result;
}`}
            </pre>
          </div>
          <div className={styles.editorPanel}>
            <NodeEditor
              data={data}
              onDataChange={setData}
              nodeDefinitions={nodeDefinitions}
            />
          </div>
        </div>
      </ExampleWrapper>
    </ExampleLayout>
  );
};

export default ComfyUILayoutExample;
