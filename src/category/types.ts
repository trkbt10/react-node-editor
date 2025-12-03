/**
 * @file Category type definitions for grouping nodes
 */
import type { ReactNode } from "react";
import type { NodeDefinition } from "../types/NodeDefinition";

/**
 * Category metadata for grouping nodes.
 * Can be shared as a reference across multiple NodeDefinitions.
 */
export type CategoryInfo = {
  /** Category name (should match NodeDefinition.category string) */
  name: string;
  /** Icon to display for this category in menus */
  icon?: ReactNode;
  /** Sort priority (lower values appear first) */
  priority?: number;
};

/**
 * Flat category structure for simple displays.
 */
export type NodeDefinitionCategory = {
  name: string;
  nodes: NodeDefinition[];
  /** Lower values appear first; undefined categories fall back to alphabetical ordering */
  sortOrder: number | null;
  /** Icon from categoryInfo (if provided) */
  icon?: ReactNode;
};

/**
 * Nested category structure for hierarchical displays (e.g., split pane).
 * Categories can contain both nodes and subcategories.
 */
export type NestedNodeDefinitionCategory = {
  name: string;
  /** Full path from root (e.g., "Parent/Child/Grandchild") */
  path: string;
  /** Depth level (0 = root) */
  depth: number;
  /** Direct nodes in this category (not in subcategories) */
  nodes: NodeDefinition[];
  /** Nested subcategories */
  children: NestedNodeDefinitionCategory[];
  /** Total node count including all descendants */
  totalNodeCount: number;
  /** Sort order inherited from nodes */
  sortOrder: number | null;
  /** Icon from categoryInfo (if provided) */
  icon?: ReactNode;
};

/**
 * Flattened node with category metadata for keyboard navigation.
 */
export type FlattenedNodeDefinition = {
  category: string;
  node: NodeDefinition;
};

/**
 * Flattened nested node with full category path.
 */
export type FlattenedNestedNodeDefinition = {
  /** Full category path */
  categoryPath: string;
  /** Immediate parent category name */
  categoryName: string;
  node: NodeDefinition;
};
