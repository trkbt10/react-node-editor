/**
 * @file Preview of NodeCard variants for design verification
 */
import * as React from "react";
import type { NodeDefinition } from "../../../../types/NodeDefinition";
import { NodeCard, type NodeCardVariant } from "../../../../components/node/cards/NodeCard";
import { H2 } from "../../../../components/elements/Heading";
import { PropertySection } from "../../../../components/inspector/parts/PropertySection";
import styles from "./NodeCardsExample.module.css";

/**
 * Sample node definitions for preview
 */
const sampleNodes: NodeDefinition[] = [
  {
    type: "data-source",
    displayName: "Data Source",
    description: "Load data from external sources like APIs, databases, or files",
    category: "Data",
    icon: "📥",
  },
  {
    type: "logic-if",
    displayName: "If/Else",
    description: "Conditional branching based on boolean expression",
    category: "Logic",
    icon: "❓",
  },
  {
    type: "math-add",
    displayName: "Add",
    description: "Add two numbers together",
    category: "Math",
    icon: "➕",
  },
  {
    type: "output-display",
    displayName: "Display",
    description: "Display data on screen",
    category: "Output",
    icon: "🖥️",
  },
];

const variants: NodeCardVariant[] = ["list", "grid", "menu", "compact"];

/**
 * Preview of all NodeCard variants and states
 */
export function NodeCardsExample(): React.ReactElement {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <H2 size="lg" weight="semibold">
          Node Card Variants
        </H2>
        <p className={styles.subtitle}>
          Preview of NodeCard component in different variants and states. Switch themes to see how they adapt.
        </p>
      </div>

      <div className={styles.content}>
        {/* Variant comparison */}
        {variants.map((variant) => (
          <PropertySection key={variant} title={`Variant: ${variant}`}>
            <div className={styles.variantSection} data-variant={variant}>
              {sampleNodes.map((node) => (
                <NodeCard
                  key={node.type}
                  node={node}
                  variant={variant}
                />
              ))}
            </div>
          </PropertySection>
        ))}

        {/* State comparison */}
        <PropertySection title="States (list variant)">
          <div className={styles.statesGrid}>
            <div className={styles.stateColumn}>
              <span className={styles.stateLabel}>Normal</span>
              <NodeCard node={sampleNodes[0]} variant="list" />
            </div>
            <div className={styles.stateColumn}>
              <span className={styles.stateLabel}>Selected</span>
              <NodeCard node={sampleNodes[0]} variant="list" isSelected />
            </div>
            <div className={styles.stateColumn}>
              <span className={styles.stateLabel}>Disabled</span>
              <NodeCard node={sampleNodes[0]} variant="list" disabled />
            </div>
            <div className={styles.stateColumn}>
              <span className={styles.stateLabel}>Non-Matching</span>
              <NodeCard node={sampleNodes[0]} variant="list" isNonMatching />
            </div>
          </div>
        </PropertySection>

        <PropertySection title="States (grid variant)">
          <div className={styles.statesGrid}>
            <div className={styles.stateColumn}>
              <span className={styles.stateLabel}>Normal</span>
              <NodeCard node={sampleNodes[0]} variant="grid" />
            </div>
            <div className={styles.stateColumn}>
              <span className={styles.stateLabel}>Selected</span>
              <NodeCard node={sampleNodes[0]} variant="grid" isSelected />
            </div>
            <div className={styles.stateColumn}>
              <span className={styles.stateLabel}>Disabled</span>
              <NodeCard node={sampleNodes[0]} variant="grid" disabled />
            </div>
            <div className={styles.stateColumn}>
              <span className={styles.stateLabel}>Non-Matching</span>
              <NodeCard node={sampleNodes[0]} variant="grid" isNonMatching />
            </div>
          </div>
        </PropertySection>

        {/* Options comparison */}
        <PropertySection title="Options">
          <div className={styles.optionsGrid}>
            <div className={styles.optionItem}>
              <span className={styles.stateLabel}>With Description</span>
              <NodeCard node={sampleNodes[0]} variant="list" showDescription />
            </div>
            <div className={styles.optionItem}>
              <span className={styles.stateLabel}>Without Description</span>
              <NodeCard node={sampleNodes[0]} variant="list" showDescription={false} />
            </div>
            <div className={styles.optionItem}>
              <span className={styles.stateLabel}>With Type Badge</span>
              <NodeCard node={sampleNodes[0]} variant="list" showTypeBadge />
            </div>
            <div className={styles.optionItem}>
              <span className={styles.stateLabel}>Without Type Badge</span>
              <NodeCard node={sampleNodes[0]} variant="list" showTypeBadge={false} />
            </div>
            <div className={styles.optionItem}>
              <span className={styles.stateLabel}>With Title Suffix</span>
              <NodeCard
                node={sampleNodes[0]}
                variant="list"
                titleSuffix={<span className={styles.badge}>NEW</span>}
              />
            </div>
          </div>
        </PropertySection>

        {/* Draggable demonstration */}
        <PropertySection title="Draggable Cards">
          <p className={styles.hint}>Try dragging these cards:</p>
          <div className={styles.draggableRow}>
            {sampleNodes.slice(0, 3).map((node) => (
              <NodeCard
                key={node.type}
                node={node}
                variant="grid"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", node.type);
                }}
              />
            ))}
          </div>
        </PropertySection>
      </div>
    </div>
  );
}
