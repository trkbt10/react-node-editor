/**
 * @file Shared node definition card component for menus, search panels, and inspector palettes.
 *
 * Variants:
 * - list: Horizontal layout with icon, title, description, and type badge (for search menus)
 * - grid: Card layout for palette grids
 * - menu: Compact horizontal layout for submenu items (icon, title, type badge only)
 * - compact: Minimal layout for inspector or tight spaces
 */
import * as React from "react";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import { getNodeIcon } from "../../../contexts/node-definitions/utils/iconUtils";
import styles from "./NodeCard.module.css";

export type NodeCardVariant = "list" | "grid" | "menu" | "compact";

export type NodeCardProps = {
  node: NodeDefinition;
  variant?: NodeCardVariant;
  disabled?: boolean;
  isSelected?: boolean;
  /** Node does not match current search query (used in highlight filter mode) */
  isNonMatching?: boolean;
  /** Show description text (default: true for list/grid, false for menu/compact) */
  showDescription?: boolean;
  /** Show type badge (default: true) */
  showTypeBadge?: boolean;
  /** Custom content to append after the title */
  titleSuffix?: React.ReactNode;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "className">;

/**
 * Renders a concise node definition preview that can appear within menus,
 * search panels, or inspector palettes.
 */
export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  variant = "list",
  disabled = false,
  isSelected = false,
  isNonMatching = false,
  showDescription,
  showTypeBadge = true,
  titleSuffix,
  ...divProps
}) => {
  // Default showDescription based on variant
  const shouldShowDescription = showDescription ?? (variant === "list" || variant === "grid");

  return (
    <div
      {...divProps}
      className={styles.card}
      data-variant={variant}
      data-is-disabled={disabled}
      data-is-selected={isSelected}
      data-is-non-matching={isNonMatching}
      data-has-description={shouldShowDescription && !!node.description}
      aria-disabled={disabled}
    >
      <div className={styles.icon} aria-hidden="true">
        {node.icon ?? getNodeIcon(node.type, [])}
      </div>
      <div className={styles.title}>{node.displayName}</div>
      {titleSuffix ? <div className={styles.titleSuffix}>{titleSuffix}</div> : null}
      {showTypeBadge ? <div className={styles.typeBadge}>{node.type}</div> : null}
      {shouldShowDescription && node.description ? (
        <div className={styles.description}>{node.description}</div>
      ) : null}
    </div>
  );
};

NodeCard.displayName = "NodeCard";
