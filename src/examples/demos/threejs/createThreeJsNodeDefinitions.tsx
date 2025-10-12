/**
 * @file Three.js node definitions with custom connection renderers
 * Demonstrates custom connection styling and label overlays for color and scale nodes
 */
import * as React from "react";
import {
  createNodeDefinition,
  toUntypedDefinition,
  type InspectorRenderProps,
  type NodeDefinition,
  type NodeRenderProps,
  type ConnectionRenderContext,
} from "../../../types/NodeDefinition";
import { ThreeSceneCanvas } from "./ThreeSceneCanvas";
import { useNodeEditor } from "../../../contexts/node-editor";
import classes from "./ThreeJsNodes.module.css";
import { calculateBezierPath } from "../../../components/connection/utils/connectionUtils";

type ColorControlData = {
  title: string;
  color: string;
};

type SliderControlData = {
  title: string;
  value: number;
  min: number;
  max: number;
  step: number;
};

type ThreePreviewData = {
  title: string;
  background: string;
  color?: string;
  scale?: number;
};

/**
 * Custom connection renderer for color output port
 * Uses the color value from the source node to render the connection
 */
const ColorConnectionRenderer = (context: ConnectionRenderContext, defaultRender: () => React.ReactElement) => {
  const { fromPosition, toPosition, fromPort, toPort, connection, fromNode } = context;

  // Get color from source node
  const nodeColor = (fromNode.data as ColorControlData).color || "#60a5fa";

  const pathData = calculateBezierPath(fromPosition, toPosition, fromPort.position, toPort.position);

  // Render default connection for interaction, then overlay custom colored visuals
  return (
    <g>
      {/* Render default connection (invisible but interactive) */}
      <g style={{ opacity: 0, pointerEvents: "auto" }}>{defaultRender()}</g>

      {/* Custom colored connection visual */}
      <g data-connection-id={connection.id} style={{ pointerEvents: "none" }}>
        <path
          d={pathData}
          fill="none"
          stroke={nodeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Arrow marker at the end */}
        <defs>
          <marker
            id={`arrow-color-${connection.id}`}
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="10"
            markerHeight="10"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={nodeColor} />
          </marker>
        </defs>
        <path
          d={pathData}
          fill="none"
          stroke="transparent"
          markerEnd={`url(#arrow-color-${connection.id})`}
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </g>
  );
};

/**
 * Custom connection renderer for scale output port - renders label on connection
 */
const ScaleConnectionRenderer = (context: ConnectionRenderContext, defaultRender: () => React.ReactElement) => {
  const { fromPosition, toPosition, fromNode } = context;

  // Get scale value from the source node
  const scaleValue = (fromNode.data as SliderControlData).value;

  // Calculate midpoint for label placement
  const midX = (fromPosition.x + toPosition.x) / 2;
  const midY = (fromPosition.y + toPosition.y) / 2;

  return (
    <g>
      {defaultRender()}
      {/* Label text */}
      <text
        x={midX}
        y={midY - 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--node-editor-text-color, #ffffff)"
        fontSize={11}
        fontWeight="600"
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {scaleValue.toFixed(1)}×
      </text>
    </g>
  );
};

const ColorControlNodeRenderer = ({ node, onUpdateNode }: NodeRenderProps<ColorControlData>) => {
  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNode({ data: { ...node.data, color: event.target.value } });
  };

  return (
    <div className={classes.controlNode}>
      <h3 className={classes.nodeTitle}>{node.data.title}</h3>
      <div className={classes.colorPreview} style={{ background: node.data.color }} />
      <div className={classes.colorInfo}>
        <span>{node.data.color.toUpperCase()}</span>
        <input
          type="color"
          value={node.data.color}
          onChange={handleColorChange}
          aria-label="Pick color"
          className={classes.inspectorInput}
        />
      </div>
    </div>
  );
};

const ColorControlInspector = ({ node, onUpdateNode }: InspectorRenderProps<ColorControlData>) => {
  return (
    <div className={classes.inspectorSection}>
      <label className={classes.inspectorLabel} htmlFor={`${node.id}-color`}>
        Base Color
      </label>
      <input
        id={`${node.id}-color`}
        className={classes.inspectorInput}
        type="color"
        value={node.data.color}
        onChange={(event) => onUpdateNode({ data: { ...node.data, color: event.target.value } })}
      />
    </div>
  );
};

const SliderControlNodeRenderer = ({ node, onUpdateNode }: NodeRenderProps<SliderControlData>) => {
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(event.target.value);
    onUpdateNode({ data: { ...node.data, value: newValue } });
  };

  return (
    <div className={classes.controlNode}>
      <h3 className={classes.nodeTitle}>{node.data.title}</h3>
      <div className={classes.sliderValue}>{node.data.value.toFixed(2)}</div>
      <input
        type="range"
        min={node.data.min}
        max={node.data.max}
        step={node.data.step}
        value={node.data.value}
        onChange={handleSliderChange}
        className={classes.sliderTrack}
      />
    </div>
  );
};

const SliderControlInspector = ({ node, onUpdateNode }: InspectorRenderProps<SliderControlData>) => {
  const handleUpdate = (key: keyof SliderControlData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericKeys: Array<keyof SliderControlData> = ["value", "min", "max", "step"];
    const value = numericKeys.includes(key) ? Number(event.target.value) : event.target.value;
    onUpdateNode({ data: { ...node.data, [key]: value } });
  };

  return (
    <div className={classes.inspectorSection}>
      <label className={classes.inspectorLabel} htmlFor={`${node.id}-value`}>
        Value
      </label>
      <input
        id={`${node.id}-value`}
        className={classes.inspectorInput}
        type="number"
        value={node.data.value}
        onChange={handleUpdate("value")}
        min={node.data.min}
        max={node.data.max}
        step={node.data.step}
      />
      <label className={classes.inspectorLabel} htmlFor={`${node.id}-min`}>
        Minimum
      </label>
      <input
        id={`${node.id}-min`}
        className={classes.inspectorInput}
        type="number"
        value={node.data.min}
        onChange={handleUpdate("min")}
      />
      <label className={classes.inspectorLabel} htmlFor={`${node.id}-max`}>
        Maximum
      </label>
      <input
        id={`${node.id}-max`}
        className={classes.inspectorInput}
        type="number"
        value={node.data.max}
        onChange={handleUpdate("max")}
      />
      <label className={classes.inspectorLabel} htmlFor={`${node.id}-step`}>
        Step
      </label>
      <input
        id={`${node.id}-step`}
        className={classes.inspectorInput}
        type="number"
        value={node.data.step}
        onChange={handleUpdate("step")}
      />
    </div>
  );
};

const ThreeSceneNodeRenderer = ({ node }: NodeRenderProps<ThreePreviewData>) => {
  const { state } = useNodeEditor();

  const resolveInputValue = React.useCallback(
    (portId: string): unknown => {
      const connections = Object.values(state.connections);
      const inbound = connections.find(
        (connection) => connection.toNodeId === node.id && connection.toPortId === portId,
      );
      if (!inbound) {
        return undefined;
      }
      const sourceNode = state.nodes[inbound.fromNodeId];
      if (!sourceNode) {
        return undefined;
      }
      const sourceData = sourceNode.data as Record<string, unknown>;
      if (portId === "color") {
        return sourceData.color;
      }
      if (portId === "scale") {
        return sourceData.value;
      }
      return sourceData[inbound.fromPortId];
    },
    [state.connections, state.nodes, node.id],
  );

  const color = React.useMemo(() => {
    const connected = resolveInputValue("color");
    if (typeof connected === "string") {
      return connected;
    }
    return node.data.color ?? "#60a5fa";
  }, [node.data.color, resolveInputValue]);

  const scale = React.useMemo(() => {
    const connected = resolveInputValue("scale");
    if (typeof connected === "number" && Number.isFinite(connected)) {
      return connected;
    }
    return typeof node.data.scale === "number" ? node.data.scale : 1;
  }, [node.data.scale, resolveInputValue]);

  return (
    <div
      className={classes.threeScene}
      style={{
        width: node.size?.width,
        height: node.size?.height,
      }}
    >
      <div className={classes.threeOverlay}>
        <span>Three.js Preview</span>
        <span>Color: {color.toUpperCase()}</span>
        <span>Scale: {scale.toFixed(2)}×</span>
      </div>
      <div className={classes.threeCanvasHost}>
        <ThreeSceneCanvas color={color} scale={scale} />
      </div>
    </div>
  );
};

const ThreeSceneInspector = (_props: InspectorRenderProps<ThreePreviewData>) => {
  return (
    <div className={classes.inspectorSection}>
      <p className={classes.inspectorLabel}>
        Connect color and slider nodes to drive this preview. Inspector settings are read-only while connected.
      </p>
    </div>
  );
};

const ColorControlDefinition = createNodeDefinition<ColorControlData>({
  type: "color-control",
  displayName: "Color Control",
  category: "Three.js",
  defaultData: {
    title: "Color Control",
    color: "#60a5fa",
  },
  defaultSize: { width: 220, height: 180 },
  renderNode: ColorControlNodeRenderer,
  renderInspector: ColorControlInspector,
  ports: [
    {
      id: "color",
      type: "output",
      label: "Color",
      position: "right",
      dataType: "color",
      renderConnection: ColorConnectionRenderer,
    },
  ],
});

const ScaleControlDefinition = createNodeDefinition<SliderControlData>({
  type: "scale-control",
  displayName: "Scale Control",
  category: "Three.js",
  defaultData: {
    title: "Scale Control",
    value: 1.5,
    min: 0.5,
    max: 3,
    step: 0.1,
  },
  defaultSize: { width: 220, height: 180 },
  renderNode: SliderControlNodeRenderer,
  renderInspector: SliderControlInspector,
  ports: [
    {
      id: "value",
      type: "output",
      label: "Value",
      position: "right",
      dataType: "number",
      renderConnection: ScaleConnectionRenderer,
    },
  ],
});

const ThreePreviewDefinition = createNodeDefinition<ThreePreviewData>({
  type: "three-preview",
  displayName: "Three.js Preview",
  category: "Three.js",
  defaultData: {
    title: "Three.js Preview",
    background: "space",
    color: "#60a5fa",
    scale: 1.5,
  },
  defaultSize: { width: 360, height: 380 },
  renderNode: ThreeSceneNodeRenderer,
  renderInspector: ThreeSceneInspector,
  ports: [
    {
      id: "color",
      type: "input",
      label: "Color",
      position: "left",
      dataType: "color",
    },
    {
      id: "scale",
      type: "input",
      label: "Scale",
      position: "left",
      dataType: "number",
    },
  ],
});

export const createThreeJsNodeDefinitions = (): NodeDefinition[] => [
  toUntypedDefinition(ColorControlDefinition),
  toUntypedDefinition(ScaleControlDefinition),
  toUntypedDefinition(ThreePreviewDefinition),
];
