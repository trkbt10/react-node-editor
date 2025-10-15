/**
 * @file Tab navigation component
 */
import * as React from "react";
import styles from "./TabNav.module.css";

export type TabNavProps = {
  tabs: string[];
  activeTabIndex: number;
  onTabChange: (index: number) => void;
};

export const TabNav: React.FC<TabNavProps> = ({ tabs, activeTabIndex, onTabChange }) => {
  return (
    <div className={styles.tabNav}>
      {tabs.map((tab, index) => (
        <button
          key={index}
          className={styles.tabButton}
          data-active={index === activeTabIndex}
          onClick={() => onTabChange(index)}
          type="button"
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

TabNav.displayName = "TabNav";
