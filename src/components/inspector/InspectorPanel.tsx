/**
 * @file Inspector panel component
 */
import * as React from "react";
import { useEditorActionState } from "../../contexts/EditorActionStateContext";
import { NodeTreeListPanel } from "./renderers/NodeTreeListPanel/NodeTreeListPanel";
import { HistoryPanel } from "./renderers/HistoryPanel";
import { InspectorPropertiesTab } from "./renderers/InspectorPropertiesTab";
import { TabNav } from "../layout/TabNav";
import { InspectorSection } from "./parts/InspectorSection";
import styles from "./InspectorPanel.module.css";
import { useI18n } from "../../i18n/context";
import { GeneralSettingsPanel } from "./renderers/GeneralSettingsPanel";
import { GridSettingsPanel } from "./renderers/GridSettingsPanel";
import { PropertySection } from "./parts/PropertySection";
import { InteractionHelpPanel } from "./renderers/InteractionHelpPanel/InteractionHelpPanel";

export type InspectorPanelTabConfig = {
  id: string;
  label: string;
  render: () => React.ReactNode;
  contentClassName?: string;
};

export type InspectorPanelProps = {
  tabs?: InspectorPanelTabConfig[];
  settingsPanels?: InspectorSettingsPanelConfig[];
};

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ tabs: providedTabs, settingsPanels = [] }) => {
  const { state: actionState, actions: actionActions } = useEditorActionState();
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
    [t, settingsPanels],
  );

  const tabs = providedTabs ?? defaultTabs;
  const rawActiveTabIndex = actionState.inspectorActiveTab ?? 0;
  const boundedActiveTabIndex = tabs.length === 0 ? -1 : Math.min(Math.max(rawActiveTabIndex, 0), tabs.length - 1);

  React.useEffect(() => {
    if (tabs.length === 0) {
      return;
    }
    if (rawActiveTabIndex > tabs.length - 1) {
      actionActions.setInspectorActiveTab(Math.max(tabs.length - 1, 0));
    }
  }, [tabs.length, rawActiveTabIndex, actionActions]);

  const setActiveTabIndex = React.useCallback(
    (index: number) => {
      actionActions.setInspectorActiveTab(index);
    },
    [actionActions],
  );

  const activeTab = boundedActiveTabIndex >= 0 ? tabs[boundedActiveTabIndex] : undefined;
  const contentClassName = [styles.inspectorContent, activeTab?.contentClassName]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return (
    <div className={styles.inspectorPanel}>
      {tabs.length > 0 && (
        <div className={styles.inspectorHeader}>
          <TabNav
            tabs={tabs.map((tab) => tab.label)}
            activeTabIndex={boundedActiveTabIndex}
            onTabChange={setActiveTabIndex}
          />
        </div>
      )}

      <div className={contentClassName}>
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
};

export type InspectorSettingsTabProps = {
  panels: InspectorSettingsPanelConfig[];
};

export const InspectorSettingsTab: React.FC<InspectorSettingsTabProps> = ({ panels }) => {
  const { t } = useI18n();
  // If no custom panels are provided, show default panels
  const effectivePanels = React.useMemo(() => {
    if (panels.length > 0) {
      return panels;
    }
    // Default panels
    return [
      {
        title: t("inspectorInteractionHelpTitle") || "Interaction Guide",
        component: InteractionHelpPanel,
      },
      {
        title: t("inspectorGeneralSettings") || "General Settings",
        component: GeneralSettingsPanel,
      },
      {
        title: t("inspectorGridSettings") || "Grid Settings",
        component: GridSettingsPanel,
      },
    ];
  }, [panels, t]);

  return (
    <>
      {effectivePanels.map((panel, index) => (
        <PropertySection title={panel.title} key={index}>
          <panel.component />
        </PropertySection>
      ))}
    </>
  );
};
