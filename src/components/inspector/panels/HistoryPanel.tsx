/**
 * @file History panel component
 * Aggregation layer that combines history sections
 */
import * as React from "react";
import { useHistory } from "../../../contexts/HistoryContext";
import { useI18n } from "../../../i18n/context";
import { PropertySection } from "../parts/PropertySection";
import { HistoryControls } from "../sections/HistoryPanel/HistoryControls";
import { HistoryList } from "../sections/HistoryPanel/HistoryList";
import styles from "../sections/HistoryPanel/HistoryPanel.module.css";

/**
 * History panel component
 */
export const HistoryPanel: React.FC = () => {
  const { state, canUndo, canRedo, undo, redo } = useHistory();
  const { t } = useI18n();

  const handleUndo = React.useEffectEvent(() => {
    undo();
  });

  const handleRedo = React.useEffectEvent(() => {
    redo();
  });

  const headerActions = (
    <HistoryControls
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={handleUndo}
      onRedo={handleRedo}
    />
  );

  return (
    <PropertySection
      title={t("historyTitle") || "History"}
      headerRight={headerActions}
      className={styles.historyPanel}
      bodyClassName={styles.historyBody}
    >
      <HistoryList entries={state.entries} currentIndex={state.currentIndex} />
    </PropertySection>
  );
};

HistoryPanel.displayName = "HistoryPanel";
