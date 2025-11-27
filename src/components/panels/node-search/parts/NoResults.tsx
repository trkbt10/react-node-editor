/**
 * @file No results placeholder component
 */
import * as React from "react";
import styles from "./NoResults.module.css";

export type NoResultsProps = {
  searchQuery: string;
};

export const NoResults: React.FC<NoResultsProps> = ({ searchQuery }) => {
  return (
    <div className={styles.noResults}>
      <div className={styles.noResultsIcon}>🔍</div>
      <div>No nodes found for "{searchQuery}"</div>
    </div>
  );
};

NoResults.displayName = "NoResults";
