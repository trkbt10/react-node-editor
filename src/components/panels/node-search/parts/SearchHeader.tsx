/**
 * @file Search header component with input and keyboard hints
 */
import * as React from "react";
import { Input } from "../../../elements/Input";
import styles from "./SearchHeader.module.css";

export type SearchHeaderProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  hints?: React.ReactNode;
};

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  placeholder,
  ariaLabel,
  inputRef,
  hints,
}) => {
  return (
    <div className={styles.searchHeader}>
      <Input
        ref={inputRef}
        id="node-search"
        name="nodeSearch"
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={styles.searchInput}
        aria-label={ariaLabel}
        aria-describedby="search-hint"
      />
      {hints ? (
        <div id="search-hint" className={styles.searchHint}>
          {hints}
        </div>
      ) : null}
    </div>
  );
};

SearchHeader.displayName = "SearchHeader";
