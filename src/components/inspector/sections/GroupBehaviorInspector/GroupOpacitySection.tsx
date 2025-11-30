/**
 * @file Group opacity section
 */
import * as React from "react";
import { InspectorLabel } from "../../parts/InspectorLabel";
import { useI18n } from "../../../../i18n/context";
import styles from "./GroupOpacitySection.module.css";

type GroupOpacitySectionProps = {
  opacity: number;
  onOpacityChange: (opacity: number) => void;
};

/**
 * Section for group opacity settings
 */
export function GroupOpacitySection({
  opacity,
  onOpacityChange,
}: GroupOpacitySectionProps): React.ReactElement {
  const { t } = useI18n();

  const handleChange = React.useEffectEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    onOpacityChange(Number(e.target.value));
  });

  return (
    <div className={styles.opacityRow}>
      <InspectorLabel>{t("fieldOpacity") || "Opacity"}</InspectorLabel>
      <input type="range" min={0} max={1} step={0.01} value={opacity} onChange={handleChange} />
      <span className={styles.opacityValue}>{Math.round(opacity * 100)}%</span>
    </div>
  );
}
