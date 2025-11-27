/**
 * @file No results placeholder component
 */
import * as React from "react";
import { useI18n } from "../../../../i18n/context";
import styles from "./NoResults.module.css";

export type NoResultsProps = {
  searchQuery: string;
};

export const NoResults: React.FC<NoResultsProps> = ({ searchQuery }) => {
  const { t } = useI18n();

  return (
    <div className={styles.noResults}>
      <div className={styles.noResultsIcon}>🔍</div>
      <div>{t("nodeSearchNoResults", { query: searchQuery })}</div>
    </div>
  );
};

NoResults.displayName = "NoResults";
