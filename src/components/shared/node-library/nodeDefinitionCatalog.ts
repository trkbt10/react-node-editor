/**
 * @file Helpers for grouping and filtering node definitions for palette displays.
 */
import type { NodeDefinition } from "../../../types/NodeDefinition";

export const DEFAULT_NODE_CATEGORY = "Other";

export type NodeDefinitionCategory = {
  name: string;
  nodes: NodeDefinition[];
  /** Lower values appear first; undefined categories fall back to alphabetical ordering */
  sortOrder: number | null;
};

/**
 * Group node definitions by category. Categories honor the lowest provided priority
 * before falling back to alphabetical ordering for the remaining groups.
 */
export const groupNodeDefinitions = (nodeDefinitions: NodeDefinition[]): NodeDefinitionCategory[] => {
  const categoryMap = new Map<string, NodeDefinition[]>();
  const categoryOrder = new Map<string, number | null>();

  nodeDefinitions.forEach((definition) => {
    const category = definition.category || DEFAULT_NODE_CATEGORY;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
      categoryOrder.set(category, null);
    }

    categoryMap.get(category)!.push(definition);

    const definitionOrder = definition.priority;
    if (typeof definitionOrder === "number" && Number.isFinite(definitionOrder)) {
      const current = categoryOrder.get(category) ?? null;
      if (current === null || definitionOrder < current) {
        categoryOrder.set(category, definitionOrder);
      }
    }
  });

  return Array.from(categoryMap.entries())
    .map<NodeDefinitionCategory>(([name, nodes]) => ({
      name,
      nodes: [...nodes].sort((a, b) => a.displayName.localeCompare(b.displayName)),
      sortOrder: categoryOrder.get(name) ?? null,
    }))
    .sort((a, b) => {
      const orderA = a.sortOrder ?? Number.POSITIVE_INFINITY;
      const orderB = b.sortOrder ?? Number.POSITIVE_INFINITY;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    });
};

/**
 * Filter grouped node definitions by search query. Matches on display name, description, type, or category.
 */
export const filterGroupedNodeDefinitions = (
  categories: NodeDefinitionCategory[],
  query: string,
): NodeDefinitionCategory[] => {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return categories;
  }

  const lower = trimmed.toLowerCase();

  return categories
    .map<NodeDefinitionCategory | null>((category) => {
      const matchingNodes = category.nodes.filter((node) => {
        return (
          node.displayName.toLowerCase().includes(lower) ||
          node.type.toLowerCase().includes(lower) ||
          (node.description ? node.description.toLowerCase().includes(lower) : false) ||
          category.name.toLowerCase().includes(lower)
        );
      });

      if (matchingNodes.length === 0) {
        return null;
      }

      return {
        name: category.name,
        nodes: matchingNodes,
        sortOrder: category.sortOrder,
      };
    })
    .filter((category): category is NodeDefinitionCategory => Boolean(category));
};

export type FlattenedNodeDefinition = {
  category: string;
  node: NodeDefinition;
};

/**
 * Create a flat list with category metadata to aid keyboard/focus navigation.
 */
export const flattenGroupedNodeDefinitions = (categories: NodeDefinitionCategory[]): FlattenedNodeDefinition[] => {
  const flattened: FlattenedNodeDefinition[] = [];
  categories.forEach((category) => {
    category.nodes.forEach((node) => {
      flattened.push({
        category: category.name,
        node,
      });
    });
  });
  return flattened;
};
