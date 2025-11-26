/**
 * @file Node search menu component
 */
import * as React from "react";
import { Input } from "../elements/Input";
import type { NodeDefinition } from "../../types/NodeDefinition";
import type { Position } from "../../types/core";
import styles from "./NodeSearchMenu.module.css";
import { ContextMenuOverlay } from "../layout/ContextMenuOverlay";
import { NodeDefinitionCard } from "./node-library/NodeDefinitionCard";
import {
  flattenGroupedNodeDefinitions,
  groupNodeDefinitions,
  filterGroupedNodeDefinitions,
  type NodeDefinitionCategory,
} from "./node-library/nodeDefinitionCatalog";

export type NodeSearchMenuProps = {
  position: Position;
  nodeDefinitions: NodeDefinition[];
  onCreateNode: (nodeType: string, position: Position) => void;
  onClose: () => void;
  visible: boolean;
  /** Node types that should be shown disabled due to per-flow limits */
  disabledNodeTypes?: string[];
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

  // Group node definitions for display reuse with inspector palette
  const groupedDefinitions = React.useMemo<NodeDefinitionCategory[]>(() => {
    return groupNodeDefinitions(nodeDefinitions);
  }, [nodeDefinitions]);

  // Filter nodes based on search query and optional category selection
  const filteredResults = React.useMemo<NodeDefinitionCategory[]>(() => {
    if (!searchQuery.trim()) {
      return selectedCategory
        ? groupedDefinitions.filter((category) => category.name === selectedCategory)
        : groupedDefinitions;
    }
    return filterGroupedNodeDefinitions(groupedDefinitions, searchQuery);
  }, [groupedDefinitions, searchQuery, selectedCategory]);

  // Get all nodes in flat list for keyboard navigation
  const allNodes = React.useMemo(() => flattenGroupedNodeDefinitions(filteredResults), [filteredResults]);
  const nodeIndexByType = React.useMemo(() => {
    return allNodes.reduce<Map<string, number>>((map, entry, index) => {
      map.set(entry.node.type, index);
      return map;
    }, new Map());
  }, [allNodes]);

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
          const currentCategoryIndex = groupedDefinitions.findIndex((cat) => cat.name === selectedCategory);
          const nextIndex = (currentCategoryIndex + 1) % groupedDefinitions.length;
          setSelectedCategory(groupedDefinitions[nextIndex]?.name || null);
          setSelectedIndex(0);
          break;
        }
      }
    },
    [allNodes, selectedIndex, onCreateNode, position, onClose, groupedDefinitions, selectedCategory, disabledSet],
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
      dataAttributes={{ "node-search-menu": true }}
    >
      <div className={styles.nodeSearchMenu}>
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
                      const globalIndex = nodeIndexByType.get(node.type) ?? -1;
                      const isSelected = globalIndex === selectedIndex;
                      const isDisabled = disabledSet.has(node.type);

                      return (
                        <NodeDefinitionCard
                          key={node.type}
                          node={node}
                          variant="list"
                          isSelected={isSelected}
                          disabled={isDisabled}
                          onClick={() => !isDisabled && handleNodeSelect(node.type)}
                          onPointerEnter={() => {
                            if (globalIndex >= 0) {
                              setSelectedIndex(globalIndex);
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
          )}
        </div>

        {allNodes.length > 0 && (
          <div className={styles.searchFooter}>
            <div className={styles.selectionInfo}>
              {selectedIndex + 1} of {allNodes.length} • {filteredResults.length} categories
            </div>
          </div>
        )}
      </div>
    </ContextMenuOverlay>
  );
};

NodeSearchMenu.displayName = "NodeSearchMenu";

/**
 * Debug notes:
 * - Reviewed src/components/inspector/renderers/NodePalettePanel.tsx to align shared grouping helpers and ensure search results stay consistent across inspector and context menu.
 */
