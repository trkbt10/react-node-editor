/**
 * @file Node list pane component for displaying nodes in a category
 */
import * as React from "react";
import type { NodeDefinition } from "../../../../types/NodeDefinition";
import { NodeDefinitionCard } from "./NodeDefinitionCard";
import styles from "./NodeListPane.module.css";

export type NodeListPaneProps = {
  title: string;
  nodes: NodeDefinition[];
  selectedNodeIndex: number;
  onNodeSelect: (nodeType: string) => void;
  onNodeHover: (index: number) => void;
  disabledNodeTypes: Set<string>;
  nodeIndexByType: Map<string, number>;
};

export const NodeListPane: React.FC<NodeListPaneProps> = ({
  title,
  nodes,
  selectedNodeIndex,
  onNodeSelect,
  onNodeHover,
  disabledNodeTypes,
  nodeIndexByType,
}) => {
  const handleNodeClick = React.useCallback(
    (node: NodeDefinition) => {
      if (!disabledNodeTypes.has(node.type)) {
        onNodeSelect(node.type);
      }
    },
    [disabledNodeTypes, onNodeSelect],
  );

  return (
    <div className={styles.nodePane}>
      <div className={styles.nodePaneHeader}>
        {title}
        <span className={styles.nodeCountBadge}>{nodes.length}</span>
      </div>
      <div className={styles.nodeList}>
        {nodes.map((node) => {
          const globalIndex = nodeIndexByType.get(node.type) ?? -1;
          const isSelected = globalIndex === selectedNodeIndex;
          const isDisabled = disabledNodeTypes.has(node.type);

          return (
            <NodeDefinitionCard
              key={node.type}
              node={node}
              variant="list"
              isSelected={isSelected}
              disabled={isDisabled}
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
        {nodes.length === 0 ? (
          <div className={styles.emptyState}>No nodes in this category</div>
        ) : null}
      </div>
    </div>
  );
};

NodeListPane.displayName = "NodeListPane";
