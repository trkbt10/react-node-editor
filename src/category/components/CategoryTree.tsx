/**
 * @file Category tree component for hierarchical category navigation
 */
import * as React from "react";
import type { NestedNodeDefinitionCategory } from "../types";
import { CategoryIcon } from "./CategoryIcon";
import styles from "./CategoryTree.module.css";

export type CategoryTreeProps = {
  categories: NestedNodeDefinitionCategory[];
  selectedPath: string | null;
  onSelect: (path: string | null) => void;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
};

type CategoryTreeItemProps = {
  category: NestedNodeDefinitionCategory;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
  selectedPath: string | null;
  expandedPaths: Set<string>;
};

const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({
  category,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
  selectedPath,
  expandedPaths,
}) => {
  const hasChildren = category.children.length > 0;

  const handleClick = React.useCallback(() => {
    onSelect(category.path);
  }, [category.path, onSelect]);

  const handleToggle = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle(category.path);
    },
    [category.path, onToggle],
  );

  return (
    <div className={styles.treeItem}>
      <div
        className={styles.treeItemHeader}
        data-is-selected={isSelected}
        data-depth={category.depth}
        onClick={handleClick}
        style={{ paddingLeft: `calc(var(--node-editor-space-md) + ${category.depth * 16}px)` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className={styles.expandButton}
            onClick={handleToggle}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <span className={styles.expandIcon} data-expanded={isExpanded}>
              ▶
            </span>
          </button>
        ) : (
          <span className={styles.expandPlaceholder} />
        )}
        {category.icon != null && <CategoryIcon icon={category.icon} />}
        <span className={styles.categoryLabel}>{category.name}</span>
        <span className={styles.categoryCount}>{category.totalNodeCount}</span>
      </div>

      {hasChildren && isExpanded ? (
        <div className={styles.treeChildren}>
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child.path}
              category={child}
              isSelected={selectedPath === child.path}
              isExpanded={expandedPaths.has(child.path)}
              onSelect={onSelect}
              onToggle={onToggle}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

CategoryTreeItem.displayName = "CategoryTreeItem";

export const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  selectedPath,
  onSelect,
  expandedPaths,
  onToggle,
}) => {
  const totalNodeCount = React.useMemo(() => {
    return categories.reduce((sum, c) => sum + c.totalNodeCount, 0);
  }, [categories]);

  return (
    <div className={styles.categoryTree}>
      <div
        className={styles.treeItemHeader}
        data-is-selected={selectedPath === null}
        data-depth={0}
        onClick={() => onSelect(null)}
      >
        <span className={styles.expandPlaceholder} />
        <span className={styles.categoryLabel}>All</span>
        <span className={styles.categoryCount}>{totalNodeCount}</span>
      </div>
      {categories.map((category) => (
        <CategoryTreeItem
          key={category.path}
          category={category}
          isSelected={selectedPath === category.path}
          isExpanded={expandedPaths.has(category.path)}
          onSelect={onSelect}
          onToggle={onToggle}
          selectedPath={selectedPath}
          expandedPaths={expandedPaths}
        />
      ))}
    </div>
  );
};

CategoryTree.displayName = "CategoryTree";
