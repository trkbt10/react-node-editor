/**
 * @file Shared node definition summary card component used by context menus and inspector palettes.
 */
import * as React from "react";
import type { NodeDefinition } from "../../../../types/NodeDefinition";
import { getNodeIcon } from "../../../../contexts/node-definitions/utils/iconUtils";
import styles from "./NodeDefinitionCard.module.css";

export type NodeDefinitionCardVariant = "list" | "grid";

export type NodeDefinitionCardProps = {
  node: NodeDefinition;
  variant?: NodeDefinitionCardVariant;
  disabled?: boolean;
  isSelected?: boolean;
  /** Node does not match current search query (used in highlight filter mode) */
  isNonMatching?: boolean;
  className?: string;
  showDescription?: boolean;
  titleSuffix?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * Renders a concise node definition preview that can appear within menus or palette cards.
 * Shared between right-click search menus and inspector drag-and-drop palettes.
 */
export const NodeDefinitionCard: React.FC<NodeDefinitionCardProps> = ({
  node,
  variant = "list",
  disabled = false,
  isSelected = false,
  isNonMatching = false,
  className,
  showDescription = true,
  titleSuffix,
  ...divProps
}) => {
  const mergedClassName = React.useMemo(() => {
    return [styles.card, className].filter((value) => Boolean(value)).join(" ");
  }, [className]);

  return (
    <div
      {...divProps}
      className={mergedClassName}
      data-variant={variant}
      data-is-disabled={disabled ? "true" : undefined}
      data-is-selected={isSelected ? "true" : undefined}
      data-is-non-matching={isNonMatching ? "true" : undefined}
      aria-disabled={disabled}
    >
      <div className={styles.icon} aria-hidden="true">
        {node.icon ?? getNodeIcon(node.type, [])}
      </div>
      <div className={styles.content}>
        <div>
          <div className={styles.title}>{node.displayName}</div>
          {showDescription && node.description ? (
            <div className={styles.description}>{node.description}</div>
          ) : null}
        </div>
        {titleSuffix}
      </div>
      <div className={styles.typeBadge}>{node.type}</div>
    </div>
  );
};

NodeDefinitionCard.displayName = "NodeDefinitionCard";
