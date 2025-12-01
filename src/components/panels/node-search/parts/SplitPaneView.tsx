/**
 * @file split pane view with category tree on left and node list on right
 */
import * as React from "react";
import type { NodeDefinition } from "../../../../types/NodeDefinition";
import type { NestedNodeDefinitionCategory } from "../../../../contexts/node-definitions/category/nodeDefinitionCatalog";
import { useI18n } from "../../../../i18n/context";
import { CategoryTree } from "./CategoryTree";
import { NodeListPane } from "./NodeListPane";
import { PaneHeader } from "./PaneHeader";
import styles from "./SplitPaneView.module.css";

export type SplitPaneViewProps = {
  categories: NestedNodeDefinitionCategory[];
  selectedCategoryPath: string | null;
  onCategorySelect: (categoryPath: string | null) => void;
  selectedNodeIndex: number;
  onNodeSelect: (nodeType: string) => void;
  onNodeHover: (index: number) => void;
  disabledNodeTypes: Set<string>;
  nodeIndexByType: Map<string, number>;
  /** When provided, nodes NOT in this set are shown as non-matching (dimmed) */
  matchingNodeTypes?: Set<string>;
};

/**
 * Get all nodes from a category and its descendants
 */
const getAllNodesFromCategory = (category: NestedNodeDefinitionCategory): NodeDefinition[] => {
  const nodes: NodeDefinition[] = [...category.nodes];
  category.children.forEach((child) => {
    nodes.push(...getAllNodesFromCategory(child));
  });
  return nodes;
};

/**
 * Find a category by its path
 */
const findCategoryByPath = (
  categories: NestedNodeDefinitionCategory[],
  path: string,
): NestedNodeDefinitionCategory | null => {
  for (const category of categories) {
    if (category.path === path) {
      return category;
    }
    const found = findCategoryByPath(category.children, path);
    if (found) {
      return found;
    }
  }
  return null;
};

export const SplitPaneView: React.FC<SplitPaneViewProps> = ({
  categories,
  selectedCategoryPath,
  onCategorySelect,
  selectedNodeIndex,
  onNodeSelect,
  onNodeHover,
  disabledNodeTypes,
  nodeIndexByType,
  matchingNodeTypes,
}) => {
  const { t } = useI18n();
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(() => {
    return new Set(categories.map((c) => c.path));
  });

  const handleToggle = React.useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const selectedCategory = selectedCategoryPath ? findCategoryByPath(categories, selectedCategoryPath) : null;

  const displayNodes = React.useMemo(() => {
    if (!selectedCategory) {
      const allNodes: NodeDefinition[] = [];
      const collectNodes = (cats: NestedNodeDefinitionCategory[]) => {
        cats.forEach((cat) => {
          allNodes.push(...cat.nodes);
          collectNodes(cat.children);
        });
      };
      collectNodes(categories);
      return allNodes.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return getAllNodesFromCategory(selectedCategory);
  }, [categories, selectedCategory]);

  const paneTitle = selectedCategory ? selectedCategory.name : t("nodeSearchAllNodes");

  return (
    <div className={styles.splitPane}>
      <div className={styles.categoryPane}>
        <PaneHeader>{t("nodeSearchCategoriesHeader")}</PaneHeader>
        <CategoryTree
          categories={categories}
          selectedPath={selectedCategoryPath}
          onSelect={onCategorySelect}
          expandedPaths={expandedPaths}
          onToggle={handleToggle}
        />
      </div>

      <NodeListPane
        title={paneTitle}
        nodes={displayNodes}
        selectedNodeIndex={selectedNodeIndex}
        onNodeSelect={onNodeSelect}
        onNodeHover={onNodeHover}
        disabledNodeTypes={disabledNodeTypes}
        nodeIndexByType={nodeIndexByType}
        matchingNodeTypes={matchingNodeTypes}
      />
    </div>
  );
};

SplitPaneView.displayName = "SplitPaneView";
