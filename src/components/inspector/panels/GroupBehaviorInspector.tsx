/**
 * @file Group behavior inspector component
 * Aggregation layer that combines group-specific sections
 */
import * as React from "react";
import type { InspectorRenderProps } from "../../../types/NodeDefinition";
import { useI18n } from "../../../i18n/context";
import styles from "../../controls/groupAppearance/GroupBehaviorInspector.module.css";
import { GroupBackgroundSection } from "../../controls/groupAppearance/GroupBackgroundSection";
import { GroupOpacitySection } from "../../controls/groupAppearance/GroupOpacitySection";

/**
 * Inspector for "group" behavior
 * Provides group-specific appearance editing
 */
export function GroupBehaviorInspector({
  node,
  onUpdateNode,
}: InspectorRenderProps): React.ReactElement {
  const { t } = useI18n();

  const groupBackground =
    typeof node.data.groupBackground === "string" ? node.data.groupBackground : "#000000";
  const groupOpacity =
    typeof (node.data as Record<string, unknown>).groupOpacity === "number"
      ? ((node.data as Record<string, unknown>).groupOpacity as number)
      : 1;

  const handleBackgroundChange = React.useEffectEvent((color: string) => {
    onUpdateNode({ data: { ...node.data, groupBackground: color } });
  });

  const handleOpacityChange = React.useEffectEvent((opacity: number) => {
    onUpdateNode({ data: { ...node.data, groupOpacity: opacity } });
  });

  const handleReset = React.useEffectEvent(() => {
    const { ...rest } = node.data;
    onUpdateNode({ data: rest });
  });

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>
        {t("inspectorGroupAppearanceTitle") || "Appearance"}
      </h3>
      <GroupBackgroundSection
        nodeId={node.id}
        backgroundColor={groupBackground}
        onBackgroundChange={handleBackgroundChange}
        onReset={handleReset}
      />
      <GroupOpacitySection opacity={groupOpacity} onOpacityChange={handleOpacityChange} />
    </div>
  );
}

GroupBehaviorInspector.displayName = "GroupBehaviorInspector";
