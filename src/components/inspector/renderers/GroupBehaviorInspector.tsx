import * as React from "react";
import type { InspectorRenderProps } from "../../../types/NodeDefinition";
import { Input } from "../../../components/elements";
import { InspectorLabel, InspectorButton } from "../parts";
import { useI18n } from "../../../i18n";
import styles from "./GroupBehaviorInspector.module.css";

/**
 * Inspector for "group" behavior
 * Provides group-specific appearance editing
 */
export function GroupBehaviorInspector({ node, onUpdateNode }: InspectorRenderProps<"group">): React.ReactElement {
  const { t } = useI18n();
  const groupBackground = typeof node.data.groupBackground === "string" ? node.data.groupBackground : "#000000";
  const groupOpacity = typeof (node.data as Record<string, unknown>).groupOpacity === "number" ? (node.data as Record<string, unknown>).groupOpacity as number : 1;
  const handleBackground = (color: string) => onUpdateNode({ data: { ...node.data, groupBackground: color } });
  const handleReset = () => {
    const { groupBackground: _remove, ...rest } = node.data;
    onUpdateNode({ data: rest });
  };

  return (
    <div>
      <h3 className={styles.sectionTitle}>{t("inspectorGroupAppearanceTitle") || "Appearance"}</h3>
      <div className={styles.colorInputRow}>
        <InspectorLabel>{t("fieldBackground") || "Background"}</InspectorLabel>
        <Input
          id={`node-${node.id}-group-bg`}
          name="groupBackground"
          type="color"
          value={groupBackground}
          onChange={(e) => handleBackground(e.target.value)}
          aria-label="Group background color"
          className={styles.colorInput}
        />
        <InspectorButton onClick={handleReset} aria-label="Reset group background">
          Reset
        </InspectorButton>
      </div>
      <div className={styles.opacityRow}>
        <InspectorLabel>{t("fieldOpacity") || "Opacity"}</InspectorLabel>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={groupOpacity}
          onChange={(e) => onUpdateNode({ data: { ...node.data, groupOpacity: Number(e.target.value) } })}
        />
        <span className={styles.opacityValue}>{Math.round(groupOpacity * 100)}%</span>
      </div>
    </div>
  );
}

GroupBehaviorInspector.displayName = "GroupBehaviorInspector";
