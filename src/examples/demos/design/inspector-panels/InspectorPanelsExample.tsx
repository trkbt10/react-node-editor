/**
 * @file Preview of all inspector panel components for design verification
 */
import * as React from "react";
import type { NodeDefinition } from "../../../../types/NodeDefinition";
import { H2 } from "../../../../components/elements/Heading";
import { PropertySection } from "../../../../components/inspector/parts/PropertySection";
import { InspectorFieldRow } from "../../../../components/inspector/parts/InspectorFieldRow";
import { InspectorInput } from "../../../../components/inspector/parts/InspectorInput";
import { InspectorSelect } from "../../../../components/inspector/parts/InspectorSelect";
import { InspectorButtonGroup } from "../../../../components/inspector/parts/InspectorButtonGroup";
import { InspectorIconButton } from "../../../../components/inspector/parts/InspectorIconButton";
import { InspectorButton } from "../../../../components/inspector/parts/InspectorButton";
import { NodeCard } from "../../../../components/node/cards/NodeCard";
import { HistoryControls } from "../../../../components/controls/history/HistoryControls";
import { CategoryIcon } from "../../../../category/components/CategoryIcon";
import styles from "./InspectorPanelsExample.module.css";

// Icons
const ResetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
  </svg>
);

// Sample data
const sampleNodeDefinitions: NodeDefinition[] = [
  {
    type: "data-source",
    displayName: "Data Source",
    description: "Load data from external sources",
    category: "Data",
    icon: "📥",
  },
  {
    type: "data-filter",
    displayName: "Filter",
    description: "Filter data based on conditions",
    category: "Data",
    icon: "🔍",
  },
  {
    type: "logic-if",
    displayName: "If/Else",
    description: "Conditional branching",
    category: "Logic",
    icon: "❓",
  },
  {
    type: "math-add",
    displayName: "Add",
    description: "Add two numbers",
    category: "Math",
    icon: "➕",
  },
];

// HistoryEntry requires `action` and `data` properties - we use a simplified mock for display
type MockHistoryEntry = {
  id: string;
  timestamp: number;
  action: string;
};

const sampleHistoryEntries: MockHistoryEntry[] = [
  { id: "1", action: "Add node: Data Source", timestamp: Date.now() - 300000 },
  { id: "2", action: "Add node: Filter", timestamp: Date.now() - 240000 },
  { id: "3", action: "Connect nodes", timestamp: Date.now() - 180000 },
  { id: "4", action: "Move node: Data Source", timestamp: Date.now() - 120000 },
  { id: "5", action: "Update node properties", timestamp: Date.now() - 60000 },
];

const sampleCategories = [
  { name: "Data", icon: "📊", nodes: sampleNodeDefinitions.filter((n) => n.category === "Data") },
  { name: "Logic", icon: "🔀", nodes: sampleNodeDefinitions.filter((n) => n.category === "Logic") },
  { name: "Math", icon: "🔢", nodes: sampleNodeDefinitions.filter((n) => n.category === "Math") },
];

/**
 * Showcase of all inspector panels
 */
export function InspectorPanelsExample(): React.ReactElement {
  const [showGrid, setShowGrid] = React.useState(true);
  const [snapToGrid, setSnapToGrid] = React.useState(true);
  const [gridSize, setGridSize] = React.useState("20");
  const [autoSave, setAutoSave] = React.useState(true);
  const [layoutStrategy, setLayoutStrategy] = React.useState("auto");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <H2 size="lg" weight="semibold">
          Inspector Panels
        </H2>
        <p className={styles.subtitle}>
          Preview of all inspector panel components. These panels appear in the inspector sidebar.
        </p>
      </div>

      <div className={styles.panelsGrid}>
        {/* Node Palette Panel */}
        <div className={styles.panelCard}>
          <div className={styles.panelTitle}>NodePalettePanel</div>
          <div className={styles.panelPreview}>
            <PropertySection title="Node Library">
              <div className={styles.searchRow}>
                <InspectorInput
                  value=""
                  onChange={() => {}}
                  placeholder="Search nodes…"
                />
              </div>
              <div className={styles.categoryList}>
                {sampleCategories.map((category) => (
                  <div key={category.name} className={styles.categorySection}>
                    <div className={styles.categoryHeader}>
                      <div className={styles.categoryHeaderRow}>
                        <CategoryIcon icon={category.icon} />
                        <span>{category.name}</span>
                      </div>
                      <span className={styles.categoryCount}>{category.nodes.length}</span>
                    </div>
                    <div className={styles.nodeList}>
                      {category.nodes.map((node) => (
                        <NodeCard key={node.type} node={node} variant="list" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PropertySection>
          </div>
        </div>

        {/* History Panel */}
        <div className={styles.panelCard}>
          <div className={styles.panelTitle}>HistoryPanel</div>
          <div className={styles.panelPreview}>
            <PropertySection
              title="History"
              headerRight={
                <HistoryControls canUndo canRedo onUndo={() => {}} onRedo={() => {}} />
              }
            >
              <ul className={styles.historyList}>
                {sampleHistoryEntries.map((entry, idx) => (
                  <li
                    key={entry.id}
                    className={`${styles.historyItem} ${idx === 4 ? styles.historyItemCurrent : ""}`}
                  >
                    <span className={styles.historyAction}>{entry.action}</span>
                    <span className={styles.historyTime}>
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            </PropertySection>
          </div>
        </div>

        {/* Grid Settings Panel */}
        <div className={styles.panelCard}>
          <div className={styles.panelTitle}>GridSettingsPanel</div>
          <div className={styles.panelPreview}>
            <PropertySection title="Grid Visibility">
              <div className={styles.sectionContent}>
                <InspectorFieldRow label="Show Grid">
                  <InspectorButtonGroup
                    options={[
                      { value: "on", label: "On" },
                      { value: "off", label: "Off" },
                    ]}
                    value={showGrid ? "on" : "off"}
                    onChange={(v) => setShowGrid(v === "on")}
                    aria-label="Show grid"
                  />
                </InspectorFieldRow>
                <InspectorFieldRow label="Snap to Grid">
                  <InspectorButtonGroup
                    options={[
                      { value: "on", label: "On" },
                      { value: "off", label: "Off" },
                    ]}
                    value={snapToGrid ? "on" : "off"}
                    onChange={(v) => setSnapToGrid(v === "on")}
                    aria-label="Snap to grid"
                  />
                </InspectorFieldRow>
              </div>
            </PropertySection>
            <PropertySection title="Grid Size">
              <div className={styles.sectionContent}>
                <InspectorFieldRow label="Size">
                  <InspectorInput
                    type="number"
                    value={gridSize}
                    onChange={(e) => setGridSize(e.target.value)}
                  />
                </InspectorFieldRow>
                <InspectorFieldRow label="Snap Threshold">
                  <InspectorInput type="number" value="10" onChange={() => {}} />
                </InspectorFieldRow>
              </div>
            </PropertySection>
          </div>
        </div>

        {/* General Settings Panel */}
        <div className={styles.panelCard}>
          <div className={styles.panelTitle}>GeneralSettingsPanel</div>
          <div className={styles.panelPreview}>
            <PropertySection title="Auto Save">
              <div className={styles.sectionContent}>
                <InspectorFieldRow label="Enable Auto Save">
                  <InspectorButtonGroup
                    options={[
                      { value: "on", label: "On" },
                      { value: "off", label: "Off" },
                    ]}
                    value={autoSave ? "on" : "off"}
                    onChange={(v) => setAutoSave(v === "on")}
                    aria-label="Enable auto save"
                  />
                </InspectorFieldRow>
                <InspectorFieldRow label="Interval (sec)">
                  <InspectorInput type="number" value="30" onChange={() => {}} disabled={!autoSave} />
                </InspectorFieldRow>
              </div>
            </PropertySection>
            <PropertySection title="Auto Layout">
              <div className={styles.sectionContent}>
                <InspectorFieldRow label="Strategy">
                  <InspectorSelect
                    value={layoutStrategy}
                    onChange={(e) => setLayoutStrategy(e.target.value)}
                  >
                    <option value="auto">Auto</option>
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                    <option value="radial">Radial</option>
                  </InspectorSelect>
                </InspectorFieldRow>
                <InspectorButton variant="secondary">Run Auto Layout</InspectorButton>
              </div>
            </PropertySection>
            <PropertySection title="Connection Pruning">
              <div className={styles.sectionContent}>
                <p className={styles.infoText}>0 invalid connections found</p>
                <InspectorButton variant="secondary" disabled>Prune Invalid</InspectorButton>
              </div>
            </PropertySection>
          </div>
        </div>

        {/* Node Tree List Panel */}
        <div className={styles.panelCard}>
          <div className={styles.panelTitle}>NodeTreeListPanel</div>
          <div className={styles.panelPreview}>
            <PropertySection
              title="Layers"
              headerRight={<span className={styles.nodeCount}>4 nodes</span>}
            >
              <div className={styles.treeContainer}>
                <div className={styles.treeItem} data-level="0">
                  <span className={styles.treeIcon}>📁</span>
                  <span className={styles.treeName}>Group 1</span>
                </div>
                <div className={styles.treeItem} data-level="1">
                  <span className={styles.treeIcon}>📥</span>
                  <span className={styles.treeName}>Data Source</span>
                </div>
                <div className={styles.treeItem} data-level="1">
                  <span className={styles.treeIcon}>🔍</span>
                  <span className={styles.treeName}>Filter</span>
                </div>
                <div className={styles.treeItem} data-level="0" data-selected="true">
                  <span className={styles.treeIcon}>❓</span>
                  <span className={styles.treeName}>If/Else</span>
                </div>
              </div>
            </PropertySection>
          </div>
        </div>

        {/* Interaction Help Panel */}
        <div className={styles.panelCard}>
          <div className={styles.panelTitle}>InteractionHelpPanel</div>
          <div className={styles.panelPreview}>
            <PropertySection
              title="Pointer"
              headerRight={
                <InspectorIconButton
                  icon={<ResetIcon />}
                  aria-label="Reset section"
                  variant="ghost"
                  size="small"
                />
              }
            >
              <div className={styles.shortcutList}>
                <div className={styles.shortcutItem}>
                  <span className={styles.shortcutLabel}>Select node</span>
                  <span className={styles.shortcutKey}>Click</span>
                </div>
                <div className={styles.shortcutItem}>
                  <span className={styles.shortcutLabel}>Multi-select</span>
                  <span className={styles.shortcutKey}>⇧ Click</span>
                </div>
                <div className={styles.shortcutItem}>
                  <span className={styles.shortcutLabel}>Pan canvas</span>
                  <span className={styles.shortcutKey}>Middle Drag</span>
                </div>
              </div>
            </PropertySection>
            <PropertySection
              title="Clipboard"
              headerRight={
                <InspectorIconButton
                  icon={<ResetIcon />}
                  aria-label="Reset section"
                  variant="ghost"
                  size="small"
                />
              }
            >
              <div className={styles.shortcutList}>
                <div className={styles.shortcutItem}>
                  <span className={styles.shortcutLabel}>Copy</span>
                  <span className={styles.shortcutKey}>⌘ C</span>
                </div>
                <div className={styles.shortcutItem}>
                  <span className={styles.shortcutLabel}>Paste</span>
                  <span className={styles.shortcutKey}>⌘ V</span>
                </div>
                <div className={styles.shortcutItem}>
                  <span className={styles.shortcutLabel}>Delete</span>
                  <span className={styles.shortcutKey}>⌫</span>
                </div>
              </div>
            </PropertySection>
          </div>
        </div>
      </div>
    </div>
  );
}
