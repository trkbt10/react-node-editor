/**
 * @file Renderer component for group nodes
 */
import * as React from "react";
import type { Node } from "../../types/core";
import styles from "./group.module.css";

export type GroupContentProps = {
  node: Node;
  childCount: number;
};

export const GroupNodeRenderer: React.FC<GroupContentProps> = ({ node, childCount }) => {
  if (!node.expanded) {
    return (
      <div className={styles.groupCollapsed}>
        {childCount > 0 ? `${childCount} nodes - Click to expand` : "Empty group - Drop nodes here"}
      </div>
    );
  }

  return (
    <div className={styles.groupExpanded}>
      {childCount > 0 ? `Contains ${childCount} nodes` : "Empty group - Drop nodes here"}
    </div>
  );
};

GroupNodeRenderer.displayName = "GroupNodeRenderer";
