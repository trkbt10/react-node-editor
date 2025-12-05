/**
 * @file Interactive playground for exercising advanced port definition options:
 * - Multiple data types per port
 * - Segment-aware port placement and ordering
 * - Dynamic port instance counts with custom ids/labels
 * - Port-level canConnect predicates
 */
import * as React from "react";
import { NodeEditor } from "../../../../../NodeEditor";
import type {
  ConnectionRenderContext,
  NodeDefinition,
  PortConnectionContext,
  PortInstanceContext,
  PortRenderContext,
} from "../../../../../types/NodeDefinition";
import type { NodeEditorData, PortPosition, PortPlacement } from "../../../../../types/core";
import { getPlacementSegment } from "../../../../../core/port/placement";
import { ExampleLayout } from "../../../shared/parts/ExampleLayout";
import { ExampleWrapper } from "../../../shared/parts/ExampleWrapper";
import styles from "./DynamicPortPlaygroundExample.module.css";
import { InspectorSection } from "../../../../../components/inspector/parts/InspectorSection";
import { InspectorSectionTitle } from "../../../../../components/inspector/parts/InspectorSectionTitle";
import { InspectorField } from "../../../../../components/inspector/parts/InspectorField";
import { InspectorInput } from "../../../../../components/inspector/parts/InspectorInput";
import { SwitchInput } from "../../../../../components/elements/SwitchInput";
import { calculateConnectionControlPoints, calculateConnectionPath } from "../../../../../core/connection/path";
import { cubicBezierPoint } from "../../../../../core/geometry/curve";
import { getOppositePortPosition } from "../../../../../core/port/position";
import { normalizePortDataTypes } from "../../../../../core/port/dataType";

type PortGroupConfig = {
  label: string;
  dataTypes: string;
  side: PortPosition;
  segment: string;
  order: number;
  span: number;
  align: number;
  count: number;
};

type PlaygroundConfig = {
  requireSegmentMatch: boolean;
  source: {
    main: PortGroupConfig;
    optional: PortGroupConfig;
  };
  target: {
    main: PortGroupConfig;
    optional: PortGroupConfig;
  };
};

type PortStyleVars = {
  "--port-accent": string;
  "--port-glow": string;
  "--port-surface": string;
  "--port-text": string;
};

const clampCount = (value: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(12, Math.max(0, Math.floor(value)));
};

const parseDataTypes = (value: string): string[] => {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const placementFromConfig = (config: PortGroupConfig): PortPlacement => ({
  side: config.side,
  segment: config.segment || undefined,
  segmentOrder: config.order,
  segmentSpan: config.span,
  align: config.align,
});

type DataTypeTokens = {
  accent: string;
  glow: string;
  surface: string;
  surfaceMuted?: string;
  text: string;
};

const DATA_TYPE_TOKENS: Record<string, DataTypeTokens> = {
  text: {
    accent: "#2563eb",
    glow: "rgba(37, 99, 235, 0.28)",
    surface: "rgba(37, 99, 235, 0.12)",
    surfaceMuted: "rgba(37, 99, 235, 0.08)",
    text: "#0f172a",
  },
  html: {
    accent: "#7c3aed",
    glow: "rgba(124, 58, 237, 0.32)",
    surface: "rgba(124, 58, 237, 0.14)",
    surfaceMuted: "rgba(124, 58, 237, 0.08)",
    text: "#0f172a",
  },
  markdown: {
    accent: "#0ea5e9",
    glow: "rgba(14, 165, 233, 0.28)",
    surface: "rgba(14, 165, 233, 0.12)",
    surfaceMuted: "rgba(14, 165, 233, 0.08)",
    text: "#0f172a",
  },
  image: {
    accent: "#22c55e",
    glow: "rgba(34, 197, 94, 0.28)",
    surface: "rgba(34, 197, 94, 0.12)",
    surfaceMuted: "rgba(34, 197, 94, 0.08)",
    text: "#0f172a",
  },
  audio: {
    accent: "#f97316",
    glow: "rgba(249, 115, 22, 0.3)",
    surface: "rgba(249, 115, 22, 0.12)",
    surfaceMuted: "rgba(249, 115, 22, 0.08)",
    text: "#0f172a",
  },
  video: {
    accent: "#a855f7",
    glow: "rgba(168, 85, 247, 0.3)",
    surface: "rgba(168, 85, 247, 0.12)",
    surfaceMuted: "rgba(168, 85, 247, 0.08)",
    text: "#0f172a",
  },
  data: {
    accent: "#0d9488",
    glow: "rgba(13, 148, 136, 0.28)",
    surface: "rgba(13, 148, 136, 0.12)",
    surfaceMuted: "rgba(13, 148, 136, 0.08)",
    text: "#0f172a",
  },
};

const DEFAULT_DATA_TYPE_TOKEN: DataTypeTokens = {
  accent: "var(--node-editor-accent-color, #2563eb)",
  glow: "rgba(37, 99, 235, 0.26)",
  surface: "rgba(37, 99, 235, 0.08)",
  surfaceMuted: "rgba(37, 99, 235, 0.06)",
  text: "var(--node-editor-label-color, #0f172a)",
};

const resolveDataTypeTokens = (types: string[], tone: "primary" | "secondary"): DataTypeTokens => {
  const key = types[0]?.toLowerCase() ?? "";
  const baseTokens = DATA_TYPE_TOKENS[key] ?? DEFAULT_DATA_TYPE_TOKEN;
  if (tone === "secondary") {
    return {
      accent: baseTokens.accent,
      glow: baseTokens.glow,
      surface: baseTokens.surfaceMuted ?? baseTokens.surface,
      text: baseTokens.text,
    };
  }
  return baseTokens;
};

const formatDataTypeLabel = (types: string[]): string => {
  if (types.length === 0) {
    return "any";
  }
  if (types.length <= 2) {
    return types.join(" | ");
  }
  return `${types[0]} +${types.length - 1}`;
};

const formatSegmentLabel = (segment?: string): string => {
  if (!segment) {
    return "default";
  }
  return segment;
};

const buildSegmentSummary = (fromSegment?: string, toSegment?: string): string | null => {
  if (!fromSegment && !toSegment) {
    return null;
  }
  const fromLabel = formatSegmentLabel(fromSegment);
  const toLabel = formatSegmentLabel(toSegment);
  if (fromLabel === toLabel) {
    return `segment ${fromLabel}`;
  }
  return `segment ${fromLabel} → ${toLabel}`;
};

const calculateBadgeWidth = (primaryLabel: string, secondaryLabel?: string | null): number => {
  const longestLength = Math.max(primaryLabel.length, secondaryLabel?.length ?? 0);
  const approximateWidth = Math.round(longestLength * 6.2 + 16);
  return Math.max(120, Math.min(240, approximateWidth));
};

const defaultConfig: PlaygroundConfig = {
  requireSegmentMatch: true,
  source: {
    main: {
      label: "Main Output",
      dataTypes: "text,html",
      side: "right",
      segment: "main",
      order: 0,
      span: 2,
      align: 0.25,
      count: 2,
    },
    optional: {
      label: "Optional Output",
      dataTypes: "image,audio",
      side: "right",
      segment: "aux",
      order: 1,
      span: 1,
      align: 0.78,
      count: 1,
    },
  },
  target: {
    main: {
      label: "Main Input",
      dataTypes: "text,markdown,html",
      side: "left",
      segment: "main",
      order: 0,
      span: 2,
      align: 0.25,
      count: 2,
    },
    optional: {
      label: "Optional Input",
      dataTypes: "image,audio,video",
      side: "left",
      segment: "aux",
      order: 1,
      span: 1,
      align: 0.8,
      count: 2,
    },
  },
};

const buildInitialData = (config: PlaygroundConfig): NodeEditorData => ({
  nodes: {
    source: {
      id: "source",
      type: "dynamic-source",
      position: { x: 160, y: 200 },
      size: { width: 220, height: 200 },
      data: {
        mainCount: config.source.main.count,
        optionalCount: config.source.optional.count,
        title: "Source",
      },
    },
    target: {
      id: "target",
      type: "dynamic-target",
      position: { x: 520, y: 200 },
      size: { width: 220, height: 200 },
      data: {
        mainCount: config.target.main.count,
        optionalCount: config.target.optional.count,
        title: "Target",
      },
    },
  },
  connections: {},
});

const makePortGroupDefinition = (
  baseId: string,
  type: "input" | "output",
  group: PortGroupConfig,
  requireSegmentMatch: boolean,
  countKey: "mainCount" | "optionalCount",
) => ({
  id: baseId,
  type,
  label: group.label,
  position: placementFromConfig(group),
  dataTypes: parseDataTypes(group.dataTypes),
  instances: ({ node }: PortInstanceContext) => clampCount(Number(node.data?.[countKey] ?? group.count)),
  createPortId: ({ index }: { index: number }) => `${baseId}-${index + 1}`,
  createPortLabel: ({ index }: { index: number }) => `${group.label} ${index + 1}`,
  canConnect: requireSegmentMatch
    ? ({ fromPort, toPort }: PortConnectionContext) => {
        const fromSegment = getPlacementSegment(fromPort.placement);
        const toSegment = getPlacementSegment(toPort?.placement);
        if (!fromSegment || !toSegment) {
          return false;
        }
        return fromSegment === toSegment;
      }
    : undefined,
});

export const DynamicPortPlaygroundExample: React.FC = () => {
  const [config, setConfig] = React.useState<PlaygroundConfig>(defaultConfig);
  const [data, setData] = React.useState<NodeEditorData>(() => buildInitialData(defaultConfig));

  const updateCount = React.useCallback((nodeKey: "source" | "target", groupKey: "main" | "optional", value: number) => {
    const nextCount = clampCount(value);
    setConfig((prev) => ({
      ...prev,
      [nodeKey]: {
        ...prev[nodeKey],
        [groupKey]: { ...prev[nodeKey][groupKey], count: nextCount },
      },
    }));

    setData((prev) => {
      const nodeId = nodeKey === "source" ? "source" : "target";
      const countKey = groupKey === "main" ? "mainCount" : "optionalCount";
      const node = prev.nodes[nodeId];
      if (!node) {
        return prev;
      }
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [nodeId]: { ...node, data: { ...node.data, [countKey]: nextCount } },
        },
      };
    });
  }, []);

  const updateGroup = React.useCallback(
    (nodeKey: "source" | "target", groupKey: "main" | "optional", patch: Partial<PortGroupConfig>) => {
      setConfig((prev) => ({
        ...prev,
        [nodeKey]: {
          ...prev[nodeKey],
          [groupKey]: { ...prev[nodeKey][groupKey], ...patch },
        },
      }));
    },
    [],
  );

  const handleReset = React.useCallback(() => {
    setConfig(defaultConfig);
    setData(buildInitialData(defaultConfig));
  }, []);

  const resolvePortState = (
    context: PortRenderContext,
  ): "candidate" | "connectable" | "connecting" | "hovered" | "connected" | "idle" => {
    if (context.isCandidate) {
      return "candidate";
    }
    if (context.isConnectable) {
      return "connectable";
    }
    if (context.isConnecting) {
      return "connecting";
    }
    if (context.isHovered) {
      return "hovered";
    }
    if (context.isConnected) {
      return "connected";
    }
    return "idle";
  };

  const createPortRenderer =
    (role: string, tone: "primary" | "secondary") =>
    (context: PortRenderContext, defaultRender: () => React.ReactElement) => {
      const position = context.position;
      if (!position) {
        return defaultRender();
      }

      const portState = resolvePortState(context);
      const portTypes = normalizePortDataTypes(context.port.dataType);
      const dataTokens = resolveDataTypeTokens(portTypes, tone);
      const typeLabel = formatDataTypeLabel(portTypes);
      const portStyle: React.CSSProperties & PortStyleVars = {
        left: position.x,
        top: position.y,
        transform: position.transform || "translate(-50%, -50%)",
        "--port-accent": dataTokens.accent,
        "--port-glow": dataTokens.glow,
        "--port-surface": dataTokens.surface,
        "--port-text": dataTokens.text,
      };

      return (
        <div
          className={styles.portAnchor}
          style={portStyle}
          data-port-type={context.port.type}
          data-port-position={context.port.position}
          data-port-state={portState}
          title={`${role} (${typeLabel})`}
          onPointerDown={context.handlers.onPointerDown}
          onPointerUp={context.handlers.onPointerUp}
          onPointerEnter={context.handlers.onPointerEnter}
          onPointerMove={context.handlers.onPointerMove}
          onPointerLeave={context.handlers.onPointerLeave}
          onPointerCancel={context.handlers.onPointerCancel}
        >
          <div className={styles.portHandle} aria-hidden />
          <div className={styles.portInfo}>
            <span className={styles.portRole}>{role}</span>
            <span className={styles.portTypeBadge} aria-label="Accepted data types">
              {typeLabel}
            </span>
          </div>
        </div>
      );
    };

  const renderConnectionDetails = (
    context: ConnectionRenderContext,
    defaultRender: () => React.ReactElement,
  ): React.ReactElement => {
    const defaultElement = defaultRender();
    // Use connectionDirection from context (source of truth for absolute ports)
    const fromDirection = context.fromConnectionDirection;
    const toDirection = context.toConnectionDirection;
    const pathData = calculateConnectionPath(context.fromPosition, context.toPosition, fromDirection, toDirection);
    const { cp1, cp2 } = calculateConnectionControlPoints(
      context.fromPosition,
      context.toPosition,
      fromDirection,
      toDirection,
    );
    const midpoint = cubicBezierPoint(context.fromPosition, cp1, cp2, context.toPosition, 0.5);

    const fromTypes = normalizePortDataTypes(context.fromPort.dataType);
    const toTypes = normalizePortDataTypes(context.toPort?.dataType ?? context.fromPort.dataType);
    const primaryLabel = `${formatDataTypeLabel(fromTypes)} → ${formatDataTypeLabel(toTypes)}`;
    const fromSegment = getPlacementSegment(context.fromPort.placement);
    const toSegment = getPlacementSegment(context.toPort?.placement);
    const segmentLabel = buildSegmentSummary(fromSegment, toSegment);
    const badgeWidth = calculateBadgeWidth(primaryLabel, segmentLabel);
    const badgeHeight = segmentLabel ? 34 : 22;
    const dataTokens = resolveDataTypeTokens(fromTypes, "primary");
    const strokeWidth = context.isSelected ? 3.2 : context.isHovered ? 2.8 : 2.2;
    const haloWidth = strokeWidth + 6;
    const dashArray = context.phase === "connecting" ? "8 6" : undefined;

    return (
      <>
        {defaultElement}
        <g className={styles.connectionOverlay} pointerEvents="none">
          <path
            className={styles.connectionHalo}
            d={pathData}
            stroke={dataTokens.glow}
            strokeWidth={haloWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={0.22 + (context.isAdjacentToSelectedNode ? 0.08 : 0)}
          />
          <path
            className={styles.connectionLine}
            d={pathData}
            stroke={dataTokens.accent}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={dashArray}
            opacity={0.95}
          />
          <g className={styles.connectionBadge} transform={`translate(${midpoint.x}, ${midpoint.y})`}>
            <rect
              x={-badgeWidth / 2}
              y={-(badgeHeight / 2)}
              width={badgeWidth}
              height={badgeHeight}
              rx={8}
              fill={dataTokens.surface}
              stroke={dataTokens.accent}
              strokeWidth={1}
              opacity={0.95}
            />
            <text
              className={styles.connectionBadgeText}
              x={0}
              y={segmentLabel ? -2 : 1}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {primaryLabel}
            </text>
            {segmentLabel ? (
              <text className={styles.connectionBadgeSubtext} x={0} y={12} textAnchor="middle" dominantBaseline="middle">
                {segmentLabel}
              </text>
            ) : null}
          </g>
        </g>
      </>
    );
  };

  const renderCountInspector = (
    label: string,
    key: "mainCount" | "optionalCount",
    nodeData: Record<string, unknown>,
    onUpdateNode: (updates: Partial<NodeEditorData["nodes"][number]>) => void,
  ) => (
    <InspectorField>
      <InspectorInput
        aria-label={label}
        type="number"
        min={0}
        max={12}
        value={Number(nodeData[key] ?? 0)}
        onChange={(event) => {
          const next = clampCount(Number(event.target.value));
          onUpdateNode({ data: { ...nodeData, [key]: next } });
        }}
      />
    </InspectorField>
  );

  const nodeDefinitions = React.useMemo<NodeDefinition[]>(() => {
    const sharedCanConnect = config.requireSegmentMatch;
    return [
      {
        type: "dynamic-source",
        displayName: "Dynamic Source",
        defaultSize: { width: 220, height: 200 },
        ports: [
          {
            ...makePortGroupDefinition("main-output", "output", config.source.main, sharedCanConnect, "mainCount"),
            renderPort: createPortRenderer(config.source.main.label, "primary"),
            renderConnection: renderConnectionDetails,
          },
          {
            ...makePortGroupDefinition("optional-output", "output", config.source.optional, sharedCanConnect, "optionalCount"),
            renderPort: createPortRenderer(config.source.optional.label, "secondary"),
            renderConnection: renderConnectionDetails,
          },
        ],
        renderInspector: ({ node, onUpdateNode }) => {
          const nodeData = node.data || {};
          return (
            <InspectorSection>
              <InspectorSectionTitle>Source Ports</InspectorSectionTitle>
              {renderCountInspector("Primary outputs", "mainCount", nodeData, onUpdateNode)}
              {renderCountInspector("Aux outputs", "optionalCount", nodeData, onUpdateNode)}
            </InspectorSection>
          );
        },
      },
      {
        type: "dynamic-target",
        displayName: "Dynamic Target",
        defaultSize: { width: 220, height: 200 },
        ports: [
          {
            ...makePortGroupDefinition("main-input", "input", config.target.main, sharedCanConnect, "mainCount"),
            renderPort: createPortRenderer(config.target.main.label, "primary"),
            renderConnection: renderConnectionDetails,
          },
          {
            ...makePortGroupDefinition("optional-input", "input", config.target.optional, sharedCanConnect, "optionalCount"),
            renderPort: createPortRenderer(config.target.optional.label, "secondary"),
            renderConnection: renderConnectionDetails,
          },
        ],
        renderInspector: ({ node, onUpdateNode }) => {
          const nodeData = node.data || {};
          return (
            <InspectorSection>
              <InspectorSectionTitle>Target Ports</InspectorSectionTitle>
              {renderCountInspector("Primary inputs", "mainCount", nodeData, onUpdateNode)}
              {renderCountInspector("Aux inputs", "optionalCount", nodeData, onUpdateNode)}
            </InspectorSection>
          );
        },
      },
    ];
  }, [config]);

  const renderGroupControls = (
    title: string,
    nodeKey: "source" | "target",
    groupKey: "main" | "optional",
    group: PortGroupConfig,
  ) => (
    <InspectorSection>
      <InspectorSectionTitle>{title}</InspectorSectionTitle>
      <InspectorField label="Data types (comma separated)">
        <InspectorInput
          value={group.dataTypes}
          onChange={(event) => updateGroup(nodeKey, groupKey, { dataTypes: event.target.value })}
        />
      </InspectorField>
      <InspectorField label="Port count">
        <InspectorInput
          type="number"
          min={0}
          max={12}
          value={group.count}
          onChange={(event) => updateCount(nodeKey, groupKey, Number(event.target.value))}
        />
      </InspectorField>
      <InspectorField label="Side">
        <select
          className={styles.select}
          value={group.side}
          onChange={(event) => updateGroup(nodeKey, groupKey, { side: event.target.value as PortPosition })}
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
        </select>
      </InspectorField>
      <InspectorField label="Segment key">
        <InspectorInput
          value={group.segment}
          onChange={(event) => updateGroup(nodeKey, groupKey, { segment: event.target.value })}
        />
      </InspectorField>
      <InspectorField label="Segment order">
        <InspectorInput
          type="number"
          value={group.order}
          onChange={(event) => updateGroup(nodeKey, groupKey, { order: Number(event.target.value) })}
        />
      </InspectorField>
      <InspectorField label="Segment span">
        <InspectorInput
          type="number"
          min={0.1}
          max={4}
          step={0.1}
          value={group.span}
          onChange={(event) => updateGroup(nodeKey, groupKey, { span: Number(event.target.value) })}
        />
      </InspectorField>
      <InspectorField label="Align within segment (0–1)">
        <InspectorInput
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={group.align}
          onChange={(event) => updateGroup(nodeKey, groupKey, { align: Number(event.target.value) })}
        />
      </InspectorField>
      <InspectorField label="Label">
        <InspectorInput
          value={group.label}
          onChange={(event) => updateGroup(nodeKey, groupKey, { label: event.target.value })}
        />
      </InspectorField>
      {renderGroupSummary(group)}
    </InspectorSection>
  );

  const renderGroupSummary = (group: PortGroupConfig) => {
    const types = parseDataTypes(group.dataTypes);
    return (
      <div className={styles.summaryCard} aria-label="Port definition summary">
        <div className={styles.summaryRow}>
          <span className={styles.badgeLabel}>Side</span>
          <span className={styles.badgePrimary}>{group.side}</span>
          <span className={styles.badgeLabel}>Segment</span>
          <span className={styles.badgeNeutral}>{group.segment || "default"}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.badgeLabel}>Count</span>
          <span className={styles.badgeInfo}>{group.count}</span>
          <span className={styles.badgeLabel}>Align</span>
          <span className={styles.badgeInfo}>{group.align.toFixed(2)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.badgeLabel}>Data types</span>
          <div className={styles.typeChips}>
            {types.length === 0 ? <span className={styles.badgeMuted}>any</span> : null}
            {types.map((type) => (
              <span key={type} className={styles.typeChip}>
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderLegend = () => {
    const entries: Array<{ title: string; group: PortGroupConfig }> = [
      { title: "Source - Primary Outputs", group: config.source.main },
      { title: "Source - Aux Outputs", group: config.source.optional },
      { title: "Target - Primary Inputs", group: config.target.main },
      { title: "Target - Aux Inputs", group: config.target.optional },
    ];
    return (
      <div className={styles.legend}>
        <h4 className={styles.legendTitle}>Port Roles</h4>
        <div className={styles.legendGrid}>
          {entries.map((entry) => (
            <div key={entry.title} className={styles.legendCard}>
              <div className={styles.legendHeader}>
                <span className={styles.legendDot} aria-hidden />
                <span className={styles.legendLabel}>{entry.title}</span>
              </div>
              {renderGroupSummary(entry.group)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ExampleLayout>
      <ExampleWrapper>
        <div className={styles.layout}>
          <div className={styles.controls}>
            <div className={styles.controlHeader}>
              <span className={styles.controlTitle}>Port Definition Controls</span>
              <span className={styles.pill}>Live</span>
            </div>
            <InspectorSection>
              <InspectorField label="Segment match gate">
                <SwitchInput
                  checked={config.requireSegmentMatch}
                  onChange={(checked) => setConfig((prev) => ({ ...prev, requireSegmentMatch: checked }))}
                  label="Only allow connections when segment keys match (canConnect)"
                />
              </InspectorField>
            </InspectorSection>

            <div className={styles.controlHeader}>
              <span className={styles.controlTitle}>Source Outputs</span>
            </div>
            {renderGroupControls("Primary outputs", "source", "main", config.source.main)}
            {renderGroupControls("Auxiliary outputs", "source", "optional", config.source.optional)}

            <div className={styles.controlHeader}>
              <span className={styles.controlTitle}>Target Inputs</span>
            </div>
            {renderGroupControls("Primary inputs", "target", "main", config.target.main)}
            {renderGroupControls("Auxiliary inputs", "target", "optional", config.target.optional)}

            <button type="button" className={styles.input} onClick={handleReset}>
              Reset configuration
            </button>
          </div>
          <div className={styles.editorPanel}>
            <div className={styles.editorSurface}>
              <NodeEditor data={data} onDataChange={setData} nodeDefinitions={nodeDefinitions} />
            </div>
            {renderLegend()}
          </div>
        </div>
      </ExampleWrapper>
    </ExampleLayout>
  );
};

export default DynamicPortPlaygroundExample;
