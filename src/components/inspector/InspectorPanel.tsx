import * as React from "react";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { NodeTreeListPanel, HistoryPanel, FeatureFlagsPanel, AutoLayoutPanel, InspectorPropertiesTab } from "./renderers";
import { TabNav } from "../layout/TabNav";
import { classNames } from "../elements";
import { InspectorSection, PropertySection } from "./parts";
import styles from "./InspectorPanel.module.css";
import { useI18n } from "../../i18n";

export type InspectorPanelTabConfig = {
  id: string;
  label: string;
  render: () => React.ReactNode;
  contentClassName?: string;
}

export type InspectorPanelProps = {
  className?: string;
  tabs?: InspectorPanelTabConfig[];
  settingsPanels?: InspectorSettingsPanelConfig[];
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ className, tabs: providedTabs, settingsPanels = [] }) => {
  const { state: actionState, dispatch: actionDispatch, actions: actionActions } = useEditorActionState();
  const { t } = useI18n();

  const defaultTabs = React.useMemo<InspectorPanelTabConfig[]>(
    () => [
      {
        id: "layers",
        label: t("inspectorTabLayers") || "Layers",
        render: () => <InspectorLayersTab />,
      },
      {
        id: "properties",
        label: t("inspectorTabProperties") || "Properties",
        render: () => <InspectorPropertiesTab />,
      },
      {
        id: "settings",
        label: t("inspectorTabSettings") || "Settings",
        render: () => <InspectorSettingsTab panels={settingsPanels} />,
      },
    ],
    [t, settingsPanels]
  );

  const tabs = providedTabs ?? defaultTabs;
  const rawActiveTabIndex = actionState.inspectorActiveTab ?? 0;
  const boundedActiveTabIndex = tabs.length === 0 ? -1 : Math.min(Math.max(rawActiveTabIndex, 0), tabs.length - 1);

  React.useEffect(() => {
    if (tabs.length === 0) {
      return;
    }
    if (rawActiveTabIndex > tabs.length - 1) {
      actionDispatch(actionActions.setInspectorActiveTab(Math.max(tabs.length - 1, 0)));
    }
  }, [tabs.length, rawActiveTabIndex, actionDispatch, actionActions]);

  const setActiveTabIndex = React.useCallback(
    (index: number) => {
      actionDispatch(actionActions.setInspectorActiveTab(index));
    },
    [actionDispatch, actionActions]
  );

  const activeTab = boundedActiveTabIndex >= 0 ? tabs[boundedActiveTabIndex] : undefined;

  return (
    <div className={classNames(styles.inspectorPanel, className)}>
      {tabs.length > 0 && (
        <div className={styles.inspectorHeader}>
          <TabNav tabs={tabs.map((tab) => tab.label)} activeTabIndex={boundedActiveTabIndex} onTabChange={setActiveTabIndex} />
        </div>
      )}

      <div className={classNames(styles.inspectorContent, activeTab?.contentClassName)}>
        {activeTab ? activeTab.render() : null}
      </div>
    </div>
  );
};

InspectorPanel.displayName = "InspectorPanel";

export const InspectorLayersTab: React.FC = () => {
  return (
    <InspectorSection>
      <NodeTreeListPanel />
    </InspectorSection>
  );
};


export const InspectorHistoryTab: React.FC = () => {
  return <HistoryPanel />;
};

export type InspectorSettingsPanelConfig = {
  title: string;
  component: React.ComponentType;
}

export type InspectorSettingsTabProps = {
  panels: InspectorSettingsPanelConfig[];
}

export const InspectorSettingsTab: React.FC<InspectorSettingsTabProps> = ({ panels }) => {
  // If no custom panels are provided, show default panels
  const effectivePanels = React.useMemo(() => {
    if (panels.length > 0) {
      return panels;
    }
    // Default panels
    return [
      {
        title: "Auto Layout",
        component: AutoLayoutPanel,
      },
      {
        title: "Feature Flags",
        component: FeatureFlagsPanel,
      },
    ];
  }, [panels]);

  return (
    <>
      {effectivePanels.map((panel, index) => (
        <PropertySection key={index} title={panel.title} bodyClassName={styles.settingsSectionBody}>
          <panel.component />
        </PropertySection>
      ))}
    </>
  );
};
