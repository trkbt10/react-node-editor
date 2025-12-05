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
} from "../../../../../types/NodeDefinition";
import { ThreeSceneCanvas } from "./ThreeSceneCanvas";
import {
  getMaterialPreset,
  mergeMaterialConfig,
  type MaterialConfig,
  type MaterialMode,
} from "./materialConfig";
import { useNodeEditor } from "../../../../../contexts/composed/node-editor/context";
import classes from "./ThreeJsNodes.module.css";
import { calculateConnectionPath } from "../../../../../core/connection/path";
import { getOppositeSide } from "../../../../../core/port/side";
import { NodeResizer } from "../../../../../components/node/resize/NodeResizer";

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

type WireframeControlData = {
  title: string;
  description: string;
  wireframe: boolean;
};

type MaterialControlData = {
  title: string;
  material: MaterialConfig;
};

type ThreePreviewData = {
  title: string;
  background: string;
  color?: string;
  scale?: number;
  wireframe?: boolean;
  material?: MaterialConfig;
};

const MATERIAL_MODE_LABELS: Record<MaterialMode, string> = {
  standard: "Sculpted Alloy",
  glass: "Prismatic Glass",
  hologram: "Nebula Hologram",
};

const MATERIAL_MODE_GRADIENTS: Record<MaterialMode, [string, string, string]> = {
  standard: ["#22d3ee", "#38bdf8", "#2563eb"],
  glass: ["#f0f9ff", "#7dd3fc", "#1e3a8a"],
  hologram: ["#f472b6", "#22d3ee", "#818cf8"],
};

type NumericMaterialField =
  | "metalness"
  | "roughness"
  | "transmission"
  | "emissiveIntensity"
  | "pulseStrength";

const MATERIAL_SLIDER_FIELDS: Array<{
  key: NumericMaterialField;
  label: string;
  min: number;
  max: number;
  step: number;
  formatter?: (value: number) => string;
}> = [
  {
    key: "metalness",
    label: "Metalness",
    min: 0,
    max: 1,
    step: 0.01,
    formatter: (value) => `${Math.round(value * 100)}%`,
  },
  {
    key: "roughness",
    label: "Roughness",
    min: 0,
    max: 1,
    step: 0.01,
    formatter: (value) => `${Math.round(value * 100)}%`,
  },
  {
    key: "transmission",
    label: "Transmission",
    min: 0,
    max: 1,
    step: 0.01,
    formatter: (value) => `${Math.round(value * 100)}%`,
  },
  {
    key: "emissiveIntensity",
    label: "Glow Intensity",
    min: 0,
    max: 3,
    step: 0.05,
    formatter: (value) => `${value.toFixed(2)}×`,
  },
  {
    key: "pulseStrength",
    label: "Pulse Strength",
    min: 0,
    max: 2,
    step: 0.05,
    formatter: (value) => `${value.toFixed(2)}×`,
  },
];

const MATERIAL_OVERRIDE_FACTORIES: Record<NumericMaterialField, (value: number) => Partial<MaterialConfig>> = {
  metalness: (value) => ({ metalness: value }),
  roughness: (value) => ({ roughness: value }),
  transmission: (value) => ({ transmission: value }),
  emissiveIntensity: (value) => ({ emissiveIntensity: value }),
  pulseStrength: (value) => ({ pulseStrength: value }),
};

const isMaterialConfig = (value: unknown): value is MaterialConfig => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<MaterialConfig>;
  if (candidate.mode !== "standard" && candidate.mode !== "glass" && candidate.mode !== "hologram") {
    return false;
  }
  return typeof candidate.metalness === "number" && typeof candidate.roughness === "number";
};

/**
 * Custom connection renderer for color output port
 * Uses the color value from the source node to render the connection
 */
const ColorConnectionRenderer = (context: ConnectionRenderContext, defaultRender: () => React.ReactElement) => {
  const { fromPosition, toPosition, fromPort, toPort, fromConnectionDirection, toConnectionDirection, connection, fromNode } = context;

  // Get color from source node
  const nodeColor = (fromNode.data as ColorControlData).color || "#60a5fa";

  // Use connectionDirection from context (source of truth for absolute ports)
  const pathData = calculateConnectionPath(fromPosition, toPosition, fromConnectionDirection, toConnectionDirection);
  const connectionId = connection?.id ?? `preview-${context.phase}-${fromPort.id}-${toPort?.id ?? "floating"}`;

  // Render default connection for interaction, then overlay custom colored visuals
  return (
    <g>
      {/* Render default connection (invisible but interactive) */}
      <g style={{ opacity: 0, pointerEvents: "auto" }}>{defaultRender()}</g>

      {/* Custom colored connection visual */}
      <g data-connection-id={connectionId} style={{ pointerEvents: "none" }}>
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
            id={`arrow-color-${connectionId}`}
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
          markerEnd={`url(#arrow-color-${connectionId})`}
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

const WireframeConnectionRenderer = (context: ConnectionRenderContext, defaultRender: () => React.ReactElement) => {
  const { fromPosition, toPosition, fromPort, toPort, fromConnectionDirection, toConnectionDirection, connection } = context;
  // Use connectionDirection from context (source of truth for absolute ports)
  const pathData = calculateConnectionPath(fromPosition, toPosition, fromConnectionDirection, toConnectionDirection);
  const connectionId = connection?.id ?? `preview-${context.phase}-${fromPort.id}-${toPort?.id ?? "floating"}`;

  return (
    <g>
      <g style={{ opacity: 0, pointerEvents: "auto" }}>{defaultRender()}</g>
      <g data-connection-id={connectionId} style={{ pointerEvents: "none" }}>
        <path
          d={pathData}
          fill="none"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth={6}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ filter: "blur(6px)" }}
        />
        <path
          d={pathData}
          fill="none"
          stroke="#f97316"
          strokeWidth={2.5}
          strokeDasharray="6 6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </g>
  );
};

const MaterialConnectionRenderer = (context: ConnectionRenderContext, defaultRender: () => React.ReactElement) => {
  const { fromPosition, toPosition, fromPort, toPort, fromConnectionDirection, toConnectionDirection, connection, fromNode } = context;
  // Use connectionDirection from context (source of truth for absolute ports)
  const pathData = calculateConnectionPath(fromPosition, toPosition, fromConnectionDirection, toConnectionDirection);
  const materialData = fromNode.data as MaterialControlData;
  const connectionId = connection?.id ?? `preview-${context.phase}-${fromPort.id}-${toPort?.id ?? "floating"}`;
  const gradientId = `material-gradient-${connectionId}`;
  const colors = MATERIAL_MODE_GRADIENTS[materialData.material.mode];

  return (
    <g>
      <g style={{ opacity: 0, pointerEvents: "auto" }}>{defaultRender()}</g>
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="50%" stopColor={colors[1]} />
          <stop offset="100%" stopColor={colors[2]} />
        </linearGradient>
        <filter id={`material-glow-${connectionId}`}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g data-connection-id={connectionId} style={{ pointerEvents: "none" }}>
        <path
          d={pathData}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{ filter: `url(#material-glow-${connectionId})` }}
        />
      </g>
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

const WireframeControlNodeRenderer = ({ node, onUpdateNode }: NodeRenderProps<WireframeControlData>) => {
  const handleToggle = () => {
    onUpdateNode({ data: { ...node.data, wireframe: !node.data.wireframe } });
  };

  return (
    <div className={classes.controlNode}>
      <h3 className={classes.nodeTitle}>{node.data.title}</h3>
      <p className={classes.nodeDescription}>{node.data.description}</p>
      <button
        type="button"
        className={classes.toggleButton}
        data-active={node.data.wireframe}
        onClick={handleToggle}
        aria-pressed={node.data.wireframe}
      >
        {node.data.wireframe ? "Wireframe Enabled" : "Wireframe Disabled"}
      </button>
      <span className={classes.nodeHint}>Tap to reveal the teapot&apos;s luminous skeleton.</span>
    </div>
  );
};

const WireframeControlInspector = ({ node, onUpdateNode }: InspectorRenderProps<WireframeControlData>) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateNode({ data: { ...node.data, wireframe: event.target.checked } });
  };

  return (
    <div className={classes.inspectorSection}>
      <label className={classes.inspectorLabel} htmlFor={`${node.id}-wireframe`}>
        Wireframe Overlay
      </label>
      <input
        id={`${node.id}-wireframe`}
        className={classes.inspectorCheckbox}
        type="checkbox"
        checked={node.data.wireframe}
        onChange={handleChange}
      />
      <p className={classes.inspectorHint}>Holographic outlines help spotlight motion and silhouette.</p>
    </div>
  );
};

const MaterialControlNodeRenderer = ({ node, onUpdateNode }: NodeRenderProps<MaterialControlData>) => {
  const material = React.useMemo(() => {
    const source = node.data.material ?? getMaterialPreset("standard");
    return mergeMaterialConfig(source);
  }, [node.data.material]);

  const commitMaterial = React.useCallback(
    (input: Partial<MaterialConfig> & { mode?: MaterialMode }) => {
      const base = material;
      const merged = mergeMaterialConfig({ ...base, ...input });
      onUpdateNode({ data: { ...node.data, material: merged } });
    },
    [material, node.data, onUpdateNode],
  );

  const handleModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextMode = event.target.value as MaterialMode;
    commitMaterial(getMaterialPreset(nextMode));
  };

  const handleEmissiveChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    commitMaterial({ emissive: event.target.value });
  };

  const handleSliderChange = (field: NumericMaterialField) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const numericValue = Number(event.target.value);
    commitMaterial(MATERIAL_OVERRIDE_FACTORIES[field](numericValue));
  };

  const modeGradient = MATERIAL_MODE_GRADIENTS[material.mode];

  return (
    <div className={classes.controlNode}>
      <h3 className={classes.nodeTitle}>{node.data.title}</h3>
      <div
        className={classes.materialBadge}
        style={{ background: `linear-gradient(90deg, ${modeGradient[0]}, ${modeGradient[1]}, ${modeGradient[2]})` }}
      >
        {MATERIAL_MODE_LABELS[material.mode]}
      </div>
      <label className={classes.materialLabel} htmlFor={`${node.id}-mode`}>
        Material Style
      </label>
      <select id={`${node.id}-mode`} className={classes.selectInput} value={material.mode} onChange={handleModeChange}>
        <option value="standard">Sculpted Alloy</option>
        <option value="glass">Prismatic Glass</option>
        <option value="hologram">Nebula Hologram</option>
      </select>
      <div className={classes.sliderList}>
        {MATERIAL_SLIDER_FIELDS.map((field) => {
          const sliderValue = material[field.key];
          const formatted = field.formatter ? field.formatter(sliderValue) : sliderValue.toFixed(2);
          return (
            <div key={field.key} className={classes.sliderRow}>
              <div className={classes.sliderHeader}>
                <span>{field.label}</span>
                <span className={classes.sliderValueLabel}>{formatted}</span>
              </div>
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={sliderValue}
                onChange={handleSliderChange(field.key)}
                className={classes.sliderTrack}
              />
            </div>
          );
        })}
      </div>
      <label className={classes.materialLabel} htmlFor={`${node.id}-emissive`}>
        Glow Color
      </label>
      <input
        id={`${node.id}-emissive`}
        type="color"
        value={material.emissive}
        onChange={handleEmissiveChange}
        className={classes.inspectorInput}
        aria-label="Choose emissive color"
      />
    </div>
  );
};

const MaterialControlInspector = ({ node, onUpdateNode }: InspectorRenderProps<MaterialControlData>) => {
  const material = React.useMemo(() => {
    const source = node.data.material ?? getMaterialPreset("standard");
    return mergeMaterialConfig(source);
  }, [node.data.material]);

  const commitMaterial = (input: Partial<MaterialConfig> & { mode?: MaterialMode }) => {
    const base = material;
    const merged = mergeMaterialConfig({ ...base, ...input });
    onUpdateNode({ data: { ...node.data, material: merged } });
  };

  return (
    <div className={classes.inspectorSection}>
      <label className={classes.inspectorLabel} htmlFor={`${node.id}-mode-inspector`}>
        Material Style
      </label>
      <select
        id={`${node.id}-mode-inspector`}
        className={classes.selectInput}
        value={material.mode}
        onChange={(event) => commitMaterial(getMaterialPreset(event.target.value as MaterialMode))}
      >
        <option value="standard">Sculpted Alloy</option>
        <option value="glass">Prismatic Glass</option>
        <option value="hologram">Nebula Hologram</option>
      </select>
      <label className={classes.inspectorLabel} htmlFor={`${node.id}-inspector-emissive`}>
        Glow Color
      </label>
      <input
        id={`${node.id}-inspector-emissive`}
        type="color"
        value={material.emissive}
        onChange={(event) => commitMaterial({ emissive: event.target.value })}
        className={classes.inspectorInput}
      />
      <label className={classes.inspectorLabel} htmlFor={`${node.id}-inspector-emissiveIntensity`}>
        Glow Intensity
      </label>
      <input
        id={`${node.id}-inspector-emissiveIntensity`}
        type="range"
        min={0}
        max={3}
        step={0.05}
        value={material.emissiveIntensity}
        onChange={(event) => commitMaterial({ emissiveIntensity: Number(event.target.value) })}
        className={classes.sliderTrack}
      />
      <p className={classes.inspectorHint}>Blend modes and emissive glow combine to deliver a stage-worthy reveal.</p>
    </div>
  );
};

const ThreeSceneNodeRenderer = ({ node, isResizing }: NodeRenderProps<ThreePreviewData>) => {
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
      if (portId === "wireframe") {
        return sourceData.wireframe;
      }
      if (portId === "material") {
        return sourceData.material;
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

  const wireframeEnabled = React.useMemo(() => {
    const connected = resolveInputValue("wireframe");
    if (typeof connected === "boolean") {
      return connected;
    }
    if (typeof node.data.wireframe === "boolean") {
      return node.data.wireframe;
    }
    return false;
  }, [node.data.wireframe, resolveInputValue]);

  const materialConfigValue = React.useMemo(() => {
    const connected = resolveInputValue("material");
    if (isMaterialConfig(connected)) {
      return mergeMaterialConfig(connected);
    }
    if (node.data.material) {
      return mergeMaterialConfig(node.data.material);
    }
    return getMaterialPreset("standard");
  }, [node.data.material, resolveInputValue]);

  const overlayBackground = React.useMemo(() => {
    const [a, b, c] = MATERIAL_MODE_GRADIENTS[materialConfigValue.mode];
    return `linear-gradient(135deg, ${a}b3, ${b}99, ${c}b3)`;
  }, [materialConfigValue.mode]);

  return (
    <NodeResizer node={node} isResizing={isResizing}>
      {({ width, height }) => (
        <div
          className={classes.threeScene}
          style={{
            width,
            height,
          }}
        >
          <div className={classes.threeOverlay} style={{ background: overlayBackground }}>
            <span>Three.js Preview</span>
            <span>Color: {color.toUpperCase()}</span>
            <span>Scale: {scale.toFixed(2)}×</span>
            <span>Material: {MATERIAL_MODE_LABELS[materialConfigValue.mode]}</span>
            <span>Wireframe: {wireframeEnabled ? "ON" : "OFF"}</span>
            <span>Glow: {materialConfigValue.emissiveIntensity.toFixed(2)}×</span>
            {isResizing && (
              <span style={{ color: "#22d3ee", fontWeight: "bold" }}>
                Resizing: {width}×{height}
              </span>
            )}
          </div>
          <div className={classes.threeCanvasHost} style={{ width, height }}>
            <ThreeSceneCanvas
              color={color}
              scale={scale}
              wireframe={wireframeEnabled}
              materialConfig={materialConfigValue}
              width={width}
              height={height}
            />
          </div>
        </div>
      )}
    </NodeResizer>
  );
};

const ThreeSceneInspector = (_props: InspectorRenderProps<ThreePreviewData>) => {
  return (
    <div className={classes.inspectorSection}>
      <p className={classes.inspectorLabel}>
        Connect color, scale, wireframe, and material composers to orchestrate the preview. Inspector settings are read-only while connected.
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

const WireframeControlDefinition = createNodeDefinition<WireframeControlData>({
  type: "wireframe-control",
  displayName: "Wireframe Overlay",
  category: "Three.js",
  defaultData: {
    title: "Wireframe Overlay",
    description: "Reveal neon struts to spotlight the teapot's contours.",
    wireframe: false,
  },
  defaultSize: { width: 220, height: 200 },
  renderNode: WireframeControlNodeRenderer,
  renderInspector: WireframeControlInspector,
  ports: [
    {
      id: "wireframe",
      type: "output",
      label: "Wireframe",
      position: "right",
      dataType: "boolean",
      renderConnection: WireframeConnectionRenderer,
    },
  ],
});

const MaterialControlDefinition = createNodeDefinition<MaterialControlData>({
  type: "material-control",
  displayName: "Material Composer",
  category: "Three.js",
  defaultData: {
    title: "Material Composer",
    material: getMaterialPreset("standard"),
  },
  defaultSize: { width: 260, height: 360 },
  renderNode: MaterialControlNodeRenderer,
  renderInspector: MaterialControlInspector,
  ports: [
    {
      id: "material",
      type: "output",
      label: "Material",
      position: "right",
      dataType: "material",
      renderConnection: MaterialConnectionRenderer,
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
    wireframe: false,
    material: getMaterialPreset("standard"),
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
    {
      id: "wireframe",
      type: "input",
      label: "Wireframe",
      position: "left",
      dataType: "boolean",
      renderConnection: WireframeConnectionRenderer,
    },
    {
      id: "material",
      type: "input",
      label: "Material",
      position: "left",
      dataType: "material",
      renderConnection: MaterialConnectionRenderer,
    },
  ],
});

export const createThreeJsNodeDefinitions = (): NodeDefinition[] => [
  toUntypedDefinition(ColorControlDefinition),
  toUntypedDefinition(ScaleControlDefinition),
  toUntypedDefinition(WireframeControlDefinition),
  toUntypedDefinition(MaterialControlDefinition),
  toUntypedDefinition(ThreePreviewDefinition),
];

/*
debug-notes:
- Referenced src/components/connection/ConnectionView.tsx to ensure custom renderers wrap the default output for pointer interactions.
- Reviewed src/types/NodeDefinition.ts to confirm ConnectionRenderContext exposes fromNode data used for gradient styling.
*/
