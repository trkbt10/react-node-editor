/**
 * @file Interactive playground for exercising advanced port definition options:
 * - Multiple data types per port
 * - Segment-aware port placement and ordering
 * - Dynamic port instance counts with custom ids/labels
 * - Port-level canConnect predicates
 */
import * as React from "react";
import { NodeEditor } from "../../../NodeEditor";
import type { NodeDefinition, PortConnectionContext, PortInstanceContext } from "../../../types/NodeDefinition";
import type { NodeEditorData, PortPlacement, PortPosition } from "../../../types/core";
import { ExampleLayout } from "../parts/ExampleLayout";
import { ExampleHeader } from "../parts/ExampleHeader";
import { ExampleWrapper } from "../parts/ExampleWrapper";
import styles from "./DynamicPortPlaygroundExample.module.css";

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
        if (!fromPort.placement?.segment || !toPort?.placement?.segment) {
          return false;
        }
        return fromPort.placement.segment === toPort.placement.segment;
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

  const nodeDefinitions = React.useMemo<NodeDefinition[]>(() => {
    const sharedCanConnect = config.requireSegmentMatch;
    return [
      {
        type: "dynamic-source",
        displayName: "Dynamic Source",
        defaultSize: { width: 220, height: 200 },
        ports: [
          makePortGroupDefinition("main-output", "output", config.source.main, sharedCanConnect, "mainCount"),
          makePortGroupDefinition("optional-output", "output", config.source.optional, sharedCanConnect, "optionalCount"),
        ],
      },
      {
        type: "dynamic-target",
        displayName: "Dynamic Target",
        defaultSize: { width: 220, height: 200 },
        ports: [
          makePortGroupDefinition("main-input", "input", config.target.main, sharedCanConnect, "mainCount"),
          makePortGroupDefinition("optional-input", "input", config.target.optional, sharedCanConnect, "optionalCount"),
        ],
      },
    ];
  }, [config]);

  const renderGroupControls = (
    title: string,
    nodeKey: "source" | "target",
    groupKey: "main" | "optional",
    group: PortGroupConfig,
  ) => (
    <div className={styles.controlGroup}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{title}</span>
        <span className={styles.hint}>Comma-separated data types</span>
      </div>
      <input
        className={styles.input}
        value={group.dataTypes}
        onChange={(event) => updateGroup(nodeKey, groupKey, { dataTypes: event.target.value })}
      />
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Port count</span>
          <span className={styles.hint}>0-12</span>
        </div>
        <input
          type="number"
          className={styles.number}
          min={0}
          max={12}
          value={group.count}
          onChange={(event) => updateCount(nodeKey, groupKey, Number(event.target.value))}
        />
      </div>
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Side</span>
          <span className={styles.hint}>Edge placement</span>
        </div>
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
      </div>
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Segment key</span>
          <span className={styles.hint}>Groups ports on the same side</span>
        </div>
        <input
          className={styles.input}
          value={group.segment}
          onChange={(event) => updateGroup(nodeKey, groupKey, { segment: event.target.value })}
        />
      </div>
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Segment order</span>
          <span className={styles.hint}>Lower comes first</span>
        </div>
        <input
          type="number"
          className={styles.number}
          value={group.order}
          onChange={(event) => updateGroup(nodeKey, groupKey, { order: Number(event.target.value) })}
        />
      </div>
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Segment span</span>
          <span className={styles.hint}>Relative height</span>
        </div>
        <input
          type="number"
          className={styles.number}
          min={0.1}
          max={4}
          step={0.1}
          value={group.span}
          onChange={(event) => updateGroup(nodeKey, groupKey, { span: Number(event.target.value) })}
        />
      </div>
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Align within segment</span>
          <span className={styles.hint}>0 = start, 1 = end</span>
        </div>
        <input
          type="range"
          className={styles.range}
          min={0}
          max={1}
          step={0.05}
          value={group.align}
          onChange={(event) => updateGroup(nodeKey, groupKey, { align: Number(event.target.value) })}
        />
      </div>
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <span className={styles.label}>Label</span>
          <span className={styles.hint}>Shown beside each port</span>
        </div>
        <input
          className={styles.input}
          value={group.label}
          onChange={(event) => updateGroup(nodeKey, groupKey, { label: event.target.value })}
        />
      </div>
    </div>
  );

  return (
    <ExampleLayout
      header={
        <ExampleHeader
          title="Dynamic Port Playground"
          description="Interactively tune port placement, data types, and instance counts to validate compatibility rules."
        />
      }
    >
      <ExampleWrapper>
        <div className={styles.layout}>
          <div className={styles.controls}>
            <div className={styles.controlHeader}>
              <span className={styles.controlTitle}>Port Definition Controls</span>
              <span className={styles.pill}>Live</span>
            </div>
            <div className={styles.toggleRow}>
              <input
                id="segment-match-toggle"
                type="checkbox"
                checked={config.requireSegmentMatch}
                onChange={(event) => setConfig((prev) => ({ ...prev, requireSegmentMatch: event.target.checked }))}
              />
              <label className={styles.toggleLabel} htmlFor="segment-match-toggle">
                Only allow connections when segment keys match (uses canConnect)
              </label>
            </div>

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
          </div>
        </div>
      </ExampleWrapper>
    </ExampleLayout>
  );
};

export default DynamicPortPlaygroundExample;
