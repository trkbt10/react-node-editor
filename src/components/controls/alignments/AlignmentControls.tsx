import * as React from "react";
import type { Node } from "../../../types/core";
import { InspectorLabel } from "../../inspector/parts";
import { ALIGNMENT_ACTIONS, ALIGNMENT_GROUPS } from "./constants";
import type { AlignmentActionConfig, AlignmentActionGroup, AlignmentActionType } from "./types";
import styles from "./AlignmentControls.module.css";

export type AlignmentControlsProps = {
  selectedNodes: Node[];
  onAlign: (type: AlignmentActionType) => void;
}

/**
 * Alignment controls component for selected nodes
 * Provides UI for aligning and distributing multiple nodes
 */
export const AlignmentControls = React.memo<AlignmentControlsProps>(
  ({ selectedNodes, onAlign }) => {
    const isDisabled = selectedNodes.length < 2;
    const groupedActions = React.useMemo(() => {
      return ALIGNMENT_GROUPS.reduce<Record<AlignmentActionGroup, AlignmentActionConfig[]>>(
        (acc, group) => {
          acc[group] = ALIGNMENT_ACTIONS.filter((action) => action.group === group);
          return acc;
        },
        { horizontal: [], vertical: [] }
      );
    }, []);

    return (
      <div className={styles.alignmentControls}>
        <InspectorLabel>
          Alignment {selectedNodes.length > 1 ? `(${selectedNodes.length} nodes)` : "(select 2+ nodes)"}
        </InspectorLabel>
        <div className={styles.alignmentGrid}>
          {ALIGNMENT_GROUPS.map((group) => (
            <div key={group} className={styles.alignmentRow}>
              {groupedActions[group]?.map((button) => {
                const IconComponent = button.icon;
                return (
                  <button
                    key={button.type}
                    type="button"
                    onClick={() => !isDisabled && onAlign(button.type)}
                    className={styles.alignmentButton}
                    title={isDisabled ? "Select 2 or more nodes to enable alignment" : button.title}
                    aria-label={button.title}
                    disabled={isDisabled}
                  >
                    <IconComponent size={14} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

AlignmentControls.displayName = "AlignmentControls";
