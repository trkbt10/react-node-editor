/**
 * @file Node search menu component
 */
import * as React from "react";
import { Input } from "../elements/Input";
import type { NodeDefinition } from "../../types/NodeDefinition";
import type { Position } from "../../types/core";
import { getNodeIcon } from "../../contexts/node-definitions/utils/iconUtils";
import styles from "./NodeSearchMenu.module.css";
import { ContextMenuOverlay } from "../layout/ContextMenuOverlay";

export type NodeSearchMenuProps = {
  position: Position;
  nodeDefinitions: NodeDefinition[];
  onCreateNode: (nodeType: string, position: Position) => void;
  onClose: () => void;
  visible: boolean;
  /** Node types that should be shown disabled due to per-flow limits */
  disabledNodeTypes?: string[];
};

type NodeCategory = {
  name: string;
  nodes: NodeDefinition[];
};

/**
 * NodeSearchMenu - QuickLook-style searchable context menu for creating nodes
 */
export const NodeSearchMenu: React.FC<NodeSearchMenuProps> = ({
  position,
  nodeDefinitions,
  onCreateNode,
  onClose,
  visible,
  disabledNodeTypes = [],
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Group nodes by category
  const categories = React.useMemo(() => {
    const categoryMap = new Map<string, NodeDefinition[]>();

    nodeDefinitions.forEach((def) => {
      const category = def.category || "Other";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(def);
    });

    return Array.from(categoryMap.entries()).map(([name, nodes]) => ({
      name,
      nodes: nodes.sort((a, b) => a.displayName.localeCompare(b.displayName)),
    }));
  }, [nodeDefinitions]);

  // Filter nodes based on search query
  const filteredResults = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return selectedCategory ? categories.filter((cat) => cat.name === selectedCategory) : categories;
    }

    const query = searchQuery.toLowerCase();
    const results: NodeCategory[] = [];

    categories.forEach((category) => {
      const matchingNodes = category.nodes.filter(
        (node) =>
          node.displayName.toLowerCase().includes(query) ||
          node.description?.toLowerCase().includes(query) ||
          node.type.toLowerCase().includes(query) ||
          category.name.toLowerCase().includes(query),
      );

      if (matchingNodes.length > 0) {
        results.push({
          name: category.name,
          nodes: matchingNodes,
        });
      }
    });

    return results;
  }, [searchQuery, categories, selectedCategory]);

  // Get all nodes in flat list for keyboard navigation
  const allNodes = React.useMemo(() => {
    const nodes: Array<{ category: string; node: NodeDefinition }> = [];
    filteredResults.forEach((category) => {
      category.nodes.forEach((node) => {
        nodes.push({ category: category.name, node });
      });
    });
    return nodes;
  }, [filteredResults]);

  // Focus search input when menu becomes visible
  React.useEffect(() => {
    if (visible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [visible]);

  // Reset state when menu becomes visible and calculate position
  React.useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setSelectedIndex(0);
      setSelectedCategory(null);
    }
  }, [visible, position]);

  const disabledSet = React.useMemo(() => new Set(disabledNodeTypes), [disabledNodeTypes]);

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, allNodes.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (allNodes[selectedIndex]) {
            const selectedNode = allNodes[selectedIndex].node;
            if (!disabledSet.has(selectedNode.type)) {
              onCreateNode(selectedNode.type, position);
              onClose();
            }
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "Tab": {
          e.preventDefault();
          // Cycle through categories
          const currentCategoryIndex = categories.findIndex((cat) => cat.name === selectedCategory);
          const nextIndex = (currentCategoryIndex + 1) % categories.length;
          setSelectedCategory(categories[nextIndex]?.name || null);
          setSelectedIndex(0);
          break;
        }
      }
    },
    [allNodes, selectedIndex, onCreateNode, position, onClose, categories, selectedCategory, disabledSet],
  );

  // Handle node selection
  const handleNodeSelect = React.useCallback(
    (nodeType: string) => {
      if (disabledSet.has(nodeType)) {
        return;
      } // Block selection when disabled
      onCreateNode(nodeType, position);
      onClose();
    },
    [onCreateNode, position, onClose, disabledSet],
  );

  if (!visible) {
    return null;
  }

  return (
    <ContextMenuOverlay
      anchor={position}
      visible={visible}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      contentClassName={`${styles.nodeSearchMenu} ${styles.nodeSearchMenuContainer}`}
      dataAttributes={{ "node-search-menu": true }}
    >
      <div className={styles.searchHeader}>
        <Input
          ref={searchInputRef}
          id="node-search"
          name="nodeSearch"
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
          aria-label="Search for nodes"
          aria-describedby="search-hint"
        />
        <div id="search-hint" className={styles.searchHint}>
          <kbd>↑↓</kbd> Navigate • <kbd>⏎</kbd> Create • <kbd>⇥</kbd> Category • <kbd>⎋</kbd> Close
        </div>
      </div>

      <div className={styles.searchResults}>
        {filteredResults.length === 0 ? (
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>🔍</div>
            <div>No nodes found for "{searchQuery}"</div>
          </div>
        ) : (
          <div className={styles.categoryList}>
            {filteredResults.map((category) => (
              <div key={category.name} className={styles.categoryGroup}>
                <div
                  className={styles.categoryHeader}
                  onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                  data-is-selected={selectedCategory === category.name}
                >
                  <span className={styles.categoryName}>{category.name}</span>
                  <span className={styles.nodeCount}>{category.nodes.length}</span>
                </div>

                <div className={styles.nodeList}>
                  {category.nodes.map((node) => {
                    const globalIndex = allNodes.findIndex((item) => item.node.type === node.type);
                    const isSelected = globalIndex === selectedIndex;
                    const isDisabled = disabledSet.has(node.type);

                    return (
                      <div
                        key={node.type}
                        className={styles.nodeItem}
                        onClick={() => !isDisabled && handleNodeSelect(node.type)}
                        onPointerEnter={() => setSelectedIndex(globalIndex)}
                        aria-disabled={isDisabled}
                        data-is-selected={isSelected}
                        data-is-disabled={isDisabled}
                      >
                        <div className={styles.nodeIcon}>{getNodeIcon(node.type, nodeDefinitions)}</div>
                        <div className={styles.nodeInfo}>
                          <div className={styles.nodeName}>{node.displayName}</div>
                          {node.description && <div className={styles.nodeDescription}>{node.description}</div>}
                        </div>
                        <div className={styles.nodeType}>{node.type}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {allNodes.length > 0 && (
        <div className={styles.searchFooter}>
          <div className={styles.selectionInfo}>
            {selectedIndex + 1} of {allNodes.length} • {filteredResults.length} categories
          </div>
        </div>
      )}
    </ContextMenuOverlay>
  );
};

NodeSearchMenu.displayName = "NodeSearchMenu";
