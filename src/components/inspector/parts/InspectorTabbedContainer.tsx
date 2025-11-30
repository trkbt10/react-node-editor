/**
 * @file Tabbed container component for inspector panels
 */
import * as React from "react";
import { TabNav } from "../../layout/TabNav";
import styles from "./InspectorTabbedContainer.module.css";

export type InspectorTabConfig = {
  id: string;
  label: string;
  render: () => React.ReactNode;
  contentClassName?: string;
};

export type InspectorTabbedContainerProps = {
  tabs: InspectorTabConfig[];
  activeTabIndex: number;
  onTabChange: (index: number) => void;
  className?: string;
};

/**
 * Tabbed container component for inspector panels
 * Provides a consistent tabbed interface with header and content area
 */
export const InspectorTabbedContainer: React.FC<InspectorTabbedContainerProps> = ({
  tabs,
  activeTabIndex,
  onTabChange,
  className,
}) => {
  const boundedActiveTabIndex = tabs.length === 0 ? -1 : Math.min(Math.max(activeTabIndex, 0), tabs.length - 1);
  const activeTab = boundedActiveTabIndex >= 0 ? tabs[boundedActiveTabIndex] : undefined;

  const containerClassName = [styles.container, className].filter(Boolean).join(" ");
  const contentClassName = [styles.content, activeTab?.contentClassName].filter(Boolean).join(" ");

  return (
    <div className={containerClassName}>
      {tabs.length > 0 && (
        <div className={styles.header}>
          <TabNav
            tabs={tabs.map((tab) => tab.label)}
            activeTabIndex={boundedActiveTabIndex}
            onTabChange={onTabChange}
          />
        </div>
      )}
      <div className={contentClassName}>{activeTab ? activeTab.render() : null}</div>
    </div>
  );
};

InspectorTabbedContainer.displayName = "InspectorTabbedContainer";
