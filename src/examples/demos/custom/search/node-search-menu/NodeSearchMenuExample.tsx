/**
 * @file Example demonstrating NodeSearchMenu with split pane view mode (UI)
 */
import * as React from "react";
import type { NodeDefinition } from "../../../../../types/NodeDefinition";
import { NodeSearchMenu, type NodeSearchMenuViewMode } from "../../../../../components/panels/node-search/NodeSearchMenu";
import { I18nProvider } from "../../../../../i18n/context";
import { enMessages } from "../../../../../i18n/en";
import styles from "./NodeSearchMenuExample.module.css";

/**
 * Sample node definitions with nested categories using "/" separator
 */
const sampleNodeDefinitions: NodeDefinition[] = [
  // Data category with subcategories
  {
    type: "data-source",
    displayName: "Data Source",
    description: "Load data from external sources",
    category: "Data",
    icon: "📥",
    priority: 1,
  },
  {
    type: "data-filter",
    displayName: "Filter",
    description: "Filter data based on conditions",
    category: "Data/Transform",
    icon: "🔍",
    priority: 1,
  },
  {
    type: "data-map",
    displayName: "Map",
    description: "Transform each element in a collection",
    category: "Data/Transform",
    icon: "🔄",
    priority: 1,
  },
  {
    type: "data-reduce",
    displayName: "Reduce",
    description: "Aggregate data into a single value",
    category: "Data/Transform",
    icon: "📊",
    priority: 1,
  },
  {
    type: "data-sort",
    displayName: "Sort",
    description: "Sort data by specified criteria",
    category: "Data/Transform/Order",
    icon: "↕️",
    priority: 1,
  },
  {
    type: "data-reverse",
    displayName: "Reverse",
    description: "Reverse the order of elements",
    category: "Data/Transform/Order",
    icon: "🔃",
    priority: 1,
  },
  {
    type: "data-join",
    displayName: "Join",
    description: "Combine multiple data sources",
    category: "Data/Combine",
    icon: "🔗",
    priority: 1,
  },
  {
    type: "data-split",
    displayName: "Split",
    description: "Split data into multiple streams",
    category: "Data/Combine",
    icon: "✂️",
    priority: 1,
  },

  // Logic category
  {
    type: "logic-if",
    displayName: "If/Else",
    description: "Conditional branching",
    category: "Logic",
    icon: "❓",
    priority: 2,
  },
  {
    type: "logic-switch",
    displayName: "Switch",
    description: "Multi-way branching",
    category: "Logic",
    icon: "🔀",
    priority: 2,
  },
  {
    type: "logic-and",
    displayName: "AND Gate",
    description: "Logical AND operation",
    category: "Logic/Gates",
    icon: "∧",
    priority: 2,
  },
  {
    type: "logic-or",
    displayName: "OR Gate",
    description: "Logical OR operation",
    category: "Logic/Gates",
    icon: "∨",
    priority: 2,
  },
  {
    type: "logic-not",
    displayName: "NOT Gate",
    description: "Logical NOT operation",
    category: "Logic/Gates",
    icon: "¬",
    priority: 2,
  },

  // Math category
  {
    type: "math-add",
    displayName: "Add",
    description: "Add two numbers",
    category: "Math/Arithmetic",
    icon: "➕",
    priority: 3,
  },
  {
    type: "math-subtract",
    displayName: "Subtract",
    description: "Subtract two numbers",
    category: "Math/Arithmetic",
    icon: "➖",
    priority: 3,
  },
  {
    type: "math-multiply",
    displayName: "Multiply",
    description: "Multiply two numbers",
    category: "Math/Arithmetic",
    icon: "✖️",
    priority: 3,
  },
  {
    type: "math-divide",
    displayName: "Divide",
    description: "Divide two numbers",
    category: "Math/Arithmetic",
    icon: "➗",
    priority: 3,
  },
  {
    type: "math-sin",
    displayName: "Sine",
    description: "Calculate sine of an angle",
    category: "Math/Trigonometry",
    icon: "〰️",
    priority: 3,
  },
  {
    type: "math-cos",
    displayName: "Cosine",
    description: "Calculate cosine of an angle",
    category: "Math/Trigonometry",
    icon: "〰️",
    priority: 3,
  },
  {
    type: "math-random",
    displayName: "Random",
    description: "Generate a random number",
    category: "Math/Random",
    icon: "🎲",
    priority: 3,
  },

  // Output category
  {
    type: "output-display",
    displayName: "Display",
    description: "Display data on screen",
    category: "Output",
    icon: "🖥️",
    priority: 4,
  },
  {
    type: "output-log",
    displayName: "Log",
    description: "Log data to console",
    category: "Output",
    icon: "📝",
    priority: 4,
  },
  {
    type: "output-export",
    displayName: "Export",
    description: "Export data to file",
    category: "Output/File",
    icon: "💾",
    priority: 4,
  },

  // Utilities
  {
    type: "util-delay",
    displayName: "Delay",
    description: "Add a time delay",
    category: "Utilities",
    icon: "⏱️",
    priority: 5,
  },
  {
    type: "util-comment",
    displayName: "Comment",
    description: "Add a comment node",
    category: "Utilities",
    icon: "💬",
    priority: 5,
  },
];

export const NodeSearchMenuExample: React.FC = () => {
  const [viewMode, setViewMode] = React.useState<NodeSearchMenuViewMode>("split");
  const [menuVisible, setMenuVisible] = React.useState(true);
  const [menuPosition, setMenuPosition] = React.useState({ x: 100, y: 100 });
  const [createdNodes, setCreatedNodes] = React.useState<string[]>([]);

  const handleCreateNode = React.useCallback((nodeType: string) => {
    setCreatedNodes((prev) => [...prev, nodeType]);
    setMenuVisible(false);
  }, []);

  const handleClose = React.useCallback(() => {
    setMenuVisible(false);
  }, []);

  const handleCanvasClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (!menuVisible) {
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setMenuVisible(true);
      }
    },
    [menuVisible],
  );

  const dictionaries = React.useMemo(() => ({ en: enMessages }), []);

  return (
    <I18nProvider dictionaries={dictionaries} initialLocale="en">
      <div className={styles.container}>
        <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.label}>View Mode:</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as NodeSearchMenuViewMode)}
            className={styles.select}
          >
            <option value="list">List (Classic)</option>
            <option value="split">Split Pane</option>
          </select>
        </div>
        <button type="button" className={styles.button} onClick={() => setMenuVisible(true)}>
          Open Menu
        </button>
        <button type="button" className={styles.buttonSecondary} onClick={() => setCreatedNodes([])}>
          Clear Log
        </button>
      </div>

      <div className={styles.content}>
        <div
          className={styles.canvas}
          onClick={handleCanvasClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setMenuVisible(true);
            }
          }}
        >
          <div className={styles.canvasHint}>Click anywhere to open the NodeSearchMenu</div>

          <NodeSearchMenu
            position={menuPosition}
            nodeDefinitions={sampleNodeDefinitions}
            onCreateNode={handleCreateNode}
            onClose={handleClose}
            visible={menuVisible}
            viewMode={viewMode}
          />
        </div>

        <div className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Created Nodes Log</h3>
          <div className={styles.log}>
            {createdNodes.length === 0 ? (
              <div className={styles.emptyLog}>No nodes created yet</div>
            ) : (
              createdNodes.map((nodeType, index) => (
                <div key={`${nodeType}-${index}`} className={styles.logEntry}>
                  <span className={styles.logIndex}>{index + 1}.</span>
                  <span className={styles.logType}>{nodeType}</span>
                </div>
              ))
            )}
          </div>

          <div className={styles.info}>
            <h4 className={styles.infoTitle}>Nested Categories</h4>
            <p className={styles.infoText}>This example demonstrates nested categories using "/" separator:</p>
            <ul className={styles.infoList}>
              <li>Data/Transform</li>
              <li>Data/Transform/Order</li>
              <li>Data/Combine</li>
              <li>Logic/Gates</li>
              <li>Math/Arithmetic</li>
              <li>Math/Trigonometry</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </I18nProvider>
  );
};
