/**
 * @file Search footer component displaying selection info
 */
import * as React from "react";
import styles from "./SearchFooter.module.css";

export type SearchFooterProps = {
  selectedIndex: number;
  totalCount: number;
  categoryCount: number;
};

export const SearchFooter: React.FC<SearchFooterProps> = ({
  selectedIndex,
  totalCount,
  categoryCount,
}) => {
  if (totalCount === 0) {
    return null;
  }

  return (
    <div className={styles.searchFooter}>
      <div className={styles.selectionInfo}>
        {selectedIndex + 1} of {totalCount} • {categoryCount} categories
      </div>
    </div>
  );
};

SearchFooter.displayName = "SearchFooter";
