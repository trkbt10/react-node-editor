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

const TabButton: React.FC<{
  tab: string;
  index: number;
  isActive: boolean;
  onTabChange: (index: number) => void;
}> = React.memo(({ tab, index, isActive, onTabChange }) => {
  const handleClick = React.useCallback(() => {
    onTabChange(index);
  }, [onTabChange, index]);

  return (
    <button
      className={styles.tabButton}
      data-active={isActive || undefined}
      onClick={handleClick}
      type="button"
    >
      {tab}
    </button>
  );
});

TabButton.displayName = "TabButton";

export const TabNav: React.FC<TabNavProps> = React.memo(({ tabs, activeTabIndex, onTabChange }) => {
  return (
    <div className={styles.tabNav}>
      {tabs.map((tab, index) => (
        <TabButton
          key={index}
          tab={tab}
          index={index}
          isActive={index === activeTabIndex}
          onTabChange={onTabChange}
        />
      ))}
    </div>
  );
});

TabNav.displayName = "TabNav";
