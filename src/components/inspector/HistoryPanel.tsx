import * as React from "react";
import { useHistory } from "../../contexts/HistoryContext";
import { Button } from "../elements";
import { useI18n } from "../../i18n";
import styles from "./HistoryPanel.module.css";
import { PropertySection } from "./parts";

export const HistoryPanel: React.FC = () => {
  const { state, canUndo, canRedo, undo, redo } = useHistory();
  const { t } = useI18n();

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString();

  const headerActions = (
    <div className={styles.historyHeaderActions}>
      <Button size="small" variant="secondary" onClick={() => undo()} disabled={!canUndo}>
        {t('historyUndo') || 'Undo'}
      </Button>
      <Button size="small" variant="secondary" onClick={() => redo()} disabled={!canRedo}>
        {t('historyRedo') || 'Redo'}
      </Button>
    </div>
  );

  return (
    <PropertySection
      title={t('historyTitle') || 'History'}
      headerRight={headerActions}
      className={styles.historyPanel}
      bodyClassName={styles.historyBody}
    >
      {state.entries.length === 0 ? (
        <div className={styles.historyEmpty}>
          <span className={styles.historyAction}>{t('historyEmpty') || 'No history yet'}</span>
        </div>
      ) : (
        <ul className={styles.historyList}>
          {state.entries.map((entry, idx) => (
            <li
              key={entry.id}
              className={`${styles.historyItem} ${idx === state.currentIndex ? styles.historyItemCurrent : ""}`}
            >
              <span className={styles.historyAction}>{entry.action}</span>
              <span className={styles.historyTime}>{formatTime(entry.timestamp)}</span>
            </li>
          ))}
        </ul>
      )}
    </PropertySection>
  );
};

HistoryPanel.displayName = "HistoryPanel";
