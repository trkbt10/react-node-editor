/**
 * @file Inspector node palette panel with drag-and-drop support for creating nodes.
 */
import * as React from "react";
import { CategoryIcon } from "../../../category/components/CategoryIcon";
import { Input } from "../../elements/Input";
import { PropertySection } from "../parts/PropertySection";
import { useI18n } from "../../../i18n/context";
import { useNodeDefinitionList } from "../../../contexts/node-definitions/hooks/useNodeDefinitionList";
import { useNodeEditor } from "../../../contexts/composed/node-editor/context";
import { countNodesByType, getDisabledNodeTypes } from "../../../contexts/node-definitions/utils/nodeTypeLimits";
import { NodeCard } from "../../node/cards/NodeCard";
import { groupNodeDefinitions, filterGroupedNodeDefinitions } from "../../../category/catalog";
import type { NodeDefinitionCategory } from "../../../category/types";
import { NODE_DRAG_MIME } from "../../../constants/dnd";
import styles from "./NodePalettePanel.module.css";

export const NodePalettePanel: React.FC = () => {
  const { t } = useI18n();
  const nodeDefinitions = useNodeDefinitionList();
  const { state: editorState } = useNodeEditor();

  const [searchQuery, setSearchQuery] = React.useState("");

  const nodeTypeCounts = React.useMemo(() => countNodesByType(editorState), [editorState]);

  const disabledNodeTypes = React.useMemo(
    () => getDisabledNodeTypes(nodeDefinitions, nodeTypeCounts),
    [nodeDefinitions, nodeTypeCounts],
  );

  const groupedDefinitions = React.useMemo<NodeDefinitionCategory[]>(
    () => groupNodeDefinitions(nodeDefinitions),
    [nodeDefinitions],
  );

  const filteredCategories = React.useMemo<NodeDefinitionCategory[]>(() => {
    if (!searchQuery.trim()) {
      return groupedDefinitions;
    }
    return filterGroupedNodeDefinitions(groupedDefinitions, searchQuery);
  }, [groupedDefinitions, searchQuery]);

  const disabledSet = React.useMemo(() => new Set(disabledNodeTypes), [disabledNodeTypes]);

  const paletteTitleKey = t("inspectorNodeLibrary");
  const paletteTitle = paletteTitleKey === "inspectorNodeLibrary" ? "Node Library" : paletteTitleKey;
  const searchPlaceholderKey = t("inspectorNodeLibrarySearchPlaceholder");
  const searchPlaceholder =
    searchPlaceholderKey === "inspectorNodeLibrarySearchPlaceholder" ? "Search nodes…" : searchPlaceholderKey;
  const emptyStateKey = t("inspectorNodeLibraryEmptyState");
  const emptyStateLabel =
    emptyStateKey === "inspectorNodeLibraryEmptyState" ? "No nodes match your search" : emptyStateKey;
  const limitReachedKey = t("inspectorNodeLibraryLimitReached");
  const limitReachedLabel =
    limitReachedKey === "inspectorNodeLibraryLimitReached" ? "Limit reached" : limitReachedKey;

  const handleDragStart = React.useCallback((event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(NODE_DRAG_MIME, nodeType);
    event.dataTransfer.setData("text/plain", nodeType);
  }, []);

  const handleDragEnd = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
    // Clear payloads to keep text inputs clean when dropping into external targets.
    try {
      event.dataTransfer.clearData();
    } catch (error) {
      void error;
    }
  }, []);

  return (
    <PropertySection title={paletteTitle} bodyClassName={styles.paletteBody}>
      <div className={styles.searchRow}>
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={searchPlaceholder}
          className={styles.searchInput}
          aria-label={searchPlaceholder}
        />
      </div>

      <div className={styles.categoryList}>
        {filteredCategories.length === 0 ? (
          <div className={styles.emptyState}>{emptyStateLabel}</div>
        ) : (
          filteredCategories.map((category) => (
            <div key={category.name} className={styles.categorySection}>
              <div className={styles.categoryHeader}>
                <div className={styles.categoryHeaderRow}>
                  {category.icon != null && <CategoryIcon icon={category.icon} />}
                  <span>{category.name}</span>
                </div>
                <span className={styles.categoryCount}>{category.nodes.length}</span>
              </div>

              <div className={styles.cardGrid}>
                {category.nodes.map((nodeDefinition) => {
                  const disabled = disabledSet.has(nodeDefinition.type);
                  return (
                    <NodeCard
                      key={nodeDefinition.type}
                      node={nodeDefinition}
                      variant="grid"
                      disabled={disabled}
                      draggable={!disabled}
                      onDragStart={(event) => {
                        if (disabled) {
                          event.preventDefault();
                          return;
                        }
                        handleDragStart(event, nodeDefinition.type);
                      }}
                      onPointerDown={(event) => {
                        // Prevent palette layer drag when interacting with draggable cards.
                        event.stopPropagation();
                      }}
                      onDragEnd={handleDragEnd}
                      title={disabled ? limitReachedLabel : undefined}
                      titleSuffix={disabled ? <span className={styles.limitBadge}>{limitReachedLabel}</span> : null}
                      tabIndex={-1}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </PropertySection>
  );
};

NodePalettePanel.displayName = "NodePalettePanel";

/**
 * Debug notes:
 * - Reviewed src/components/shared/NodeSearchMenu.tsx to mirror category filtering and search semantics for inspector drag-and-drop.
 * - Reviewed src/contexts/node-definitions/utils/nodeTypeLimits.ts to apply existing per-flow node limit rules when disabling palette cards.
 */
