/**
 * @file Node search menu component with multiple view modes
 */
import * as React from "react";
import type { NodeDefinition } from "../../../types/NodeDefinition";
import type { Position } from "../../../types/core";
import styles from "./NodeSearchMenu.module.css";
import { ContextMenuOverlay } from "../../layout/ContextMenuOverlay";
import { SearchHeader } from "./parts/SearchHeader";
import { SearchFooter } from "./parts/SearchFooter";
import { NoResults } from "./parts/NoResults";
import { CategoryListView } from "./parts/CategoryListView";
import { SplitPaneView } from "./parts/SplitPaneView";
import {
  flattenGroupedNodeDefinitions,
  groupNodeDefinitions,
  filterGroupedNodeDefinitions,
  groupNodeDefinitionsNested,
  filterNestedNodeDefinitions,
  flattenNestedNodeDefinitions,
  type NodeDefinitionCategory,
  type NestedNodeDefinitionCategory,
} from "../../../contexts/node-definitions/category/nodeDefinitionCatalog";

export type NodeSearchMenuViewMode = "list" | "split";

export type NodeSearchMenuProps = {
  position: Position;
  nodeDefinitions: NodeDefinition[];
  onCreateNode: (nodeType: string, position: Position) => void;
  onClose: () => void;
  visible: boolean;
  /** Node types that should be shown disabled due to per-flow limits */
  disabledNodeTypes?: string[];
  /** View mode: "list" (default vertical list) or "split" (split pane) */
  viewMode?: NodeSearchMenuViewMode;
};

const DEFAULT_HINTS = (
  <>
    <kbd>↑↓</kbd> Navigate • <kbd>⏎</kbd> Create • <kbd>⇥</kbd> Category • <kbd>⎋</kbd> Close
  </>
);

/**
 * NodeSearchMenu - Searchable context menu for creating nodes with multiple view modes
 */
export const NodeSearchMenu: React.FC<NodeSearchMenuProps> = ({
  position,
  nodeDefinitions,
  onCreateNode,
  onClose,
  visible,
  disabledNodeTypes = [],
  viewMode = "list",
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Group node definitions based on view mode
  const groupedDefinitions = React.useMemo<NodeDefinitionCategory[]>(() => {
    return groupNodeDefinitions(nodeDefinitions);
  }, [nodeDefinitions]);

  const nestedDefinitions = React.useMemo<NestedNodeDefinitionCategory[]>(() => {
    return groupNodeDefinitionsNested(nodeDefinitions);
  }, [nodeDefinitions]);

  // Filter nodes based on search query and view mode
  const filteredListResults = React.useMemo<NodeDefinitionCategory[]>(() => {
    if (!searchQuery.trim()) {
      return selectedCategory && viewMode === "list"
        ? groupedDefinitions.filter((category) => category.name === selectedCategory)
        : groupedDefinitions;
    }
    return filterGroupedNodeDefinitions(groupedDefinitions, searchQuery);
  }, [groupedDefinitions, searchQuery, selectedCategory, viewMode]);

  const filteredNestedResults = React.useMemo<NestedNodeDefinitionCategory[]>(() => {
    if (!searchQuery.trim()) {
      return nestedDefinitions;
    }
    return filterNestedNodeDefinitions(nestedDefinitions, searchQuery);
  }, [nestedDefinitions, searchQuery]);

  // Get all nodes in flat list for keyboard navigation
  const allNodes = React.useMemo(() => {
    if (viewMode === "split") {
      return flattenNestedNodeDefinitions(filteredNestedResults).map((item) => ({
        category: item.categoryName,
        node: item.node,
      }));
    }
    return flattenGroupedNodeDefinitions(filteredListResults);
  }, [viewMode, filteredListResults, filteredNestedResults]);

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

  // Reset state when menu becomes visible
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
          if (viewMode === "list") {
            // Cycle through categories in list mode
            const currentCategoryIndex = groupedDefinitions.findIndex((cat) => cat.name === selectedCategory);
            const nextIndex = (currentCategoryIndex + 1) % groupedDefinitions.length;
            setSelectedCategory(groupedDefinitions[nextIndex]?.name || null);
            setSelectedIndex(0);
          }
          break;
        }
      }
    },
    [
      allNodes,
      selectedIndex,
      onCreateNode,
      position,
      onClose,
      groupedDefinitions,
      selectedCategory,
      disabledSet,
      viewMode,
    ],
  );

  // Handle node selection
  const handleNodeSelect = React.useCallback(
    (nodeType: string) => {
      if (disabledSet.has(nodeType)) {
        return;
      }
      onCreateNode(nodeType, position);
      onClose();
    },
    [onCreateNode, position, onClose, disabledSet],
  );

  const handleNodeHover = React.useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  if (!visible) {
    return null;
  }

  const hasResults = viewMode === "split" ? filteredNestedResults.length > 0 : filteredListResults.length > 0;
  const categoryCount = viewMode === "split" ? filteredNestedResults.length : filteredListResults.length;

  return (
    <ContextMenuOverlay
      anchor={position}
      visible={visible}
      onClose={onClose}
      onKeyDown={handleKeyDown}
      dataAttributes={{ "node-search-menu": true }}
    >
      <div className={styles.nodeSearchMenu} data-view-mode={viewMode}>
        <SearchHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          inputRef={searchInputRef}
          hints={DEFAULT_HINTS}
        />

        <div className={styles.searchResults}>
          {!hasResults && searchQuery.trim() ? (
            <NoResults searchQuery={searchQuery} />
          ) : viewMode === "split" ? (
            <SplitPaneView
              categories={filteredNestedResults}
              selectedCategoryPath={selectedCategory}
              onCategorySelect={setSelectedCategory}
              selectedNodeIndex={selectedIndex}
              onNodeSelect={handleNodeSelect}
              onNodeHover={handleNodeHover}
              disabledNodeTypes={disabledSet}
              nodeIndexByType={nodeIndexByType}
            />
          ) : (
            <CategoryListView
              categories={filteredListResults}
              selectedCategory={selectedCategory}
              onCategoryClick={setSelectedCategory}
              selectedIndex={selectedIndex}
              onNodeSelect={handleNodeSelect}
              onNodeHover={handleNodeHover}
              disabledNodeTypes={disabledSet}
              nodeIndexByType={nodeIndexByType}
            />
          )}
        </div>

        <SearchFooter selectedIndex={selectedIndex} totalCount={allNodes.length} categoryCount={categoryCount} />
      </div>
    </ContextMenuOverlay>
  );
};

NodeSearchMenu.displayName = "NodeSearchMenu";
