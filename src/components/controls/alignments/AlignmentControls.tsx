/**
 * @file AlignmentControls component
 */
import * as React from "react";
import type { Node } from "../../../types/core";
import { useI18n } from "../../../i18n/context";
import { InspectorLabel } from "../../inspector/parts/InspectorLabel";
import { ALIGNMENT_ACTIONS, ALIGNMENT_GROUPS } from "./constants";
import type { AlignmentActionConfig, AlignmentActionGroup, AlignmentActionType } from "./types";
import styles from "./AlignmentControls.module.css";

export type AlignmentControlsProps = {
  selectedNodes: Node[];
  onAlign: (type: AlignmentActionType) => void;
};

/**
 * Alignment controls component for selected nodes
 * Provides UI for aligning and distributing multiple nodes
 */
export const AlignmentControls = React.memo<AlignmentControlsProps>(({ selectedNodes, onAlign }) => {
  const { t } = useI18n();
  const isDisabled = selectedNodes.length < 2;
  const groupedActions = React.useMemo(() => {
    return ALIGNMENT_GROUPS.reduce<Record<AlignmentActionGroup, AlignmentActionConfig[]>>(
      (acc, group) => {
        acc[group] = ALIGNMENT_ACTIONS.filter((action) => action.group === group);
        return acc;
      },
      { horizontal: [], vertical: [] },
    );
  }, []);

  const alignmentSuffix =
    selectedNodes.length > 1 ? t("alignmentCountLabel", { count: selectedNodes.length }) : t("alignmentSelectPrompt");
  const alignmentLabel = `${t("alignmentTitle")} (${alignmentSuffix})`;

  return (
    <div>
      <InspectorLabel>{alignmentLabel}</InspectorLabel>
      <div className={styles.alignmentGroupsContainer}>
        {ALIGNMENT_GROUPS.map((group) => (
          <div key={group} className={styles.alignmentGroup} role="group" aria-label={`${group} alignment`}>
            {groupedActions[group]?.map((button) => {
              const IconComponent = button.icon;
              return (
                <button
                  key={button.type}
                  type="button"
                  onClick={() => !isDisabled && onAlign(button.type)}
                  className={styles.alignmentButton}
                  title={isDisabled ? t("alignmentSelectPrompt") : button.title}
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
});

AlignmentControls.displayName = "AlignmentControls";
