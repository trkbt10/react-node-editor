/**
 * @file Search footer component displaying selection info
 */
import * as React from "react";
import { useI18n } from "../../../../i18n/context";
import styles from "./SearchFooter.module.css";

export type SearchFooterProps = {
  selectedIndex: number;
  totalCount: number;
  categoryCount: number;
};

export const SearchFooter: React.FC<SearchFooterProps> = ({ selectedIndex, totalCount, categoryCount }) => {
  const { t } = useI18n();

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className={styles.searchFooter}>
      <div className={styles.selectionInfo}>
        {t("nodeSearchFooter", {
          current: String(selectedIndex + 1),
          total: String(totalCount),
          categories: String(categoryCount),
        })}
      </div>
    </div>
  );
};

SearchFooter.displayName = "SearchFooter";
