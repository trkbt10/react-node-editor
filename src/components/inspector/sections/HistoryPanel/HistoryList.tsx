/**
 * @file History entries list
 */
import * as React from "react";
import type { HistoryEntry } from "../../../../contexts/HistoryContext";
import { useI18n } from "../../../../i18n/context";
import styles from "./HistoryList.module.css";

type HistoryListProps = {
  entries: HistoryEntry[];
  currentIndex: number;
};

/**
 * Section for displaying history entries list
 */
export function HistoryList({ entries, currentIndex }: HistoryListProps): React.ReactElement {
  const { t } = useI18n();

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString();

  if (entries.length === 0) {
    return (
      <div className={styles.historyEmpty}>
        <span className={styles.historyAction}>{t("historyEmpty") || "No history yet"}</span>
      </div>
    );
  }

  return (
    <ul className={styles.historyList}>
      {entries.map((entry, idx) => (
        <li
          key={entry.id}
          className={`${styles.historyItem} ${idx === currentIndex ? styles.historyItemCurrent : ""}`}
        >
          <span className={styles.historyAction}>{entry.action}</span>
          <span className={styles.historyTime}>{formatTime(entry.timestamp)}</span>
        </li>
      ))}
    </ul>
  );
}
