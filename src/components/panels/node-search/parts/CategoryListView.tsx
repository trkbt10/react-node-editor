/**
 * @file Category list view - vertical scrollable list with sticky category headers
 */
import * as React from "react";
import type { NodeDefinition } from "../../../../types/NodeDefinition";
import type { NodeDefinitionCategory } from "../../../../contexts/node-definitions/category/nodeDefinitionCatalog";
import { NodeCard } from "../../../node/cards/NodeCard";
import styles from "./CategoryListView.module.css";

export type CategoryListViewProps = {
  categories: NodeDefinitionCategory[];
  selectedCategory: string | null;
  onCategoryClick: (categoryName: string | null) => void;
  selectedIndex: number;
  onNodeSelect: (nodeType: string) => void;
  onNodeHover: (index: number) => void;
  disabledNodeTypes: Set<string>;
  nodeIndexByType: Map<string, number>;
  /** When provided, nodes NOT in this set are shown as non-matching (dimmed) */
  matchingNodeTypes?: Set<string>;
};

export const CategoryListView: React.FC<CategoryListViewProps> = ({
  categories,
  selectedCategory,
  onCategoryClick,
  selectedIndex,
  onNodeSelect,
  onNodeHover,
  disabledNodeTypes,
  nodeIndexByType,
  matchingNodeTypes,
}) => {
  const handleCategoryHeaderClick = React.useCallback(
    (categoryName: string) => {
      onCategoryClick(selectedCategory === categoryName ? null : categoryName);
    },
    [selectedCategory, onCategoryClick],
  );

  const handleNodeClick = React.useCallback(
    (node: NodeDefinition) => {
      if (!disabledNodeTypes.has(node.type)) {
        onNodeSelect(node.type);
      }
    },
    [disabledNodeTypes, onNodeSelect],
  );

  return (
    <div className={styles.categoryList}>
      {categories.map((category) => (
        <div key={category.name} className={styles.categoryGroup}>
          <div
            className={styles.categoryHeader}
            onClick={() => handleCategoryHeaderClick(category.name)}
            data-is-selected={selectedCategory === category.name}
          >
            <span className={styles.categoryName}>{category.name}</span>
            <span className={styles.nodeCount}>{category.nodes.length}</span>
          </div>

          <div className={styles.nodeList}>
            {category.nodes.map((node) => {
              const globalIndex = nodeIndexByType.get(node.type) ?? -1;
              const isSelected = globalIndex === selectedIndex;
              const isDisabled = disabledNodeTypes.has(node.type);
              const isNonMatching = matchingNodeTypes !== undefined && !matchingNodeTypes.has(node.type);

              return (
                <NodeCard
                  key={node.type}
                  node={node}
                  variant="list"
                  isSelected={isSelected}
                  disabled={isDisabled}
                  isNonMatching={isNonMatching}
                  onClick={() => handleNodeClick(node)}
                  onPointerEnter={() => {
                    if (globalIndex >= 0) {
                      onNodeHover(globalIndex);
                    }
                  }}
                  role="menuitem"
                  tabIndex={-1}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

CategoryListView.displayName = "CategoryListView";
