/**
 * @file Inspector panel showing interaction shortcuts sourced from interaction settings.
 */
import * as React from "react";
import { useInteractionSettings } from "../../../contexts/InteractionSettingsContext";
import { useI18n } from "../../../i18n/context";
import type { I18nKey } from "../../../i18n/types";
import type { NodeEditorShortcutAction } from "../../../types/interaction";
import {
  detectShortcutDisplayPlatform,
  getShortcutLabelForAction,
} from "../../../utils/shortcutDisplay";
import styles from "./InteractionHelpPanel.module.css";

type ShortcutDescriptor = {
  action: NodeEditorShortcutAction;
  labelKey: I18nKey;
};

type ShortcutSection = {
  id: string;
  titleKey: I18nKey;
  actions: ShortcutDescriptor[];
};

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    id: "clipboard",
    titleKey: "inspectorInteractionHelpSectionClipboard",
    actions: [
      { action: "copy", labelKey: "copy" },
      { action: "cut", labelKey: "cut" },
      { action: "paste", labelKey: "paste" },
      { action: "duplicate-selection", labelKey: "contextMenuDuplicateNode" },
      { action: "delete-selection", labelKey: "contextMenuDeleteNode" },
    ],
  },
  {
    id: "selection",
    titleKey: "inspectorInteractionHelpSectionSelection",
    actions: [
      { action: "select-all", labelKey: "selectAll" },
      { action: "clear-selection", labelKey: "clearSelection" },
      { action: "add-node", labelKey: "addNode" },
      { action: "auto-layout", labelKey: "autoLayout" },
    ],
  },
  {
    id: "history",
    titleKey: "inspectorInteractionHelpSectionHistory",
    actions: [
      { action: "undo", labelKey: "historyUndo" },
      { action: "redo", labelKey: "historyRedo" },
      { action: "save", labelKey: "save" },
    ],
  },
];

export const InteractionHelpPanel: React.FC = () => {
  const { keyboardShortcuts } = useInteractionSettings();
  const { t } = useI18n();
  const platform = React.useMemo(() => detectShortcutDisplayPlatform(), []);

  const sections = React.useMemo(() => {
    return SHORTCUT_SECTIONS.map((section) => ({
      id: section.id,
      title: t(section.titleKey) || section.titleKey,
      actions: section.actions.map((descriptor) => {
        const label = t(descriptor.labelKey) || descriptor.labelKey;
        const binding = getShortcutLabelForAction(keyboardShortcuts, descriptor.action, platform);
        return { label, binding };
      }),
    }));
  }, [keyboardShortcuts, platform, t]);

  const unassignedLabel = t("inspectorInteractionHelpUnassigned") || "Not assigned";

  return (
    <div className={styles.panel}>
      {sections.map((section) => (
        <div key={section.id} className={styles.section}>
          <div className={styles.sectionTitle}>{section.title}</div>
          <ul className={styles.shortcutList}>
            {section.actions.map((action) => (
              <li key={action.label} className={styles.shortcutItem}>
                <span className={styles.shortcutLabel}>{action.label}</span>
                <span
                  className={styles.shortcutBinding}
                  data-disabled={action.binding ? "false" : "true"}
                >
                  {action.binding ?? unassignedLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

InteractionHelpPanel.displayName = "InteractionHelpPanel";
