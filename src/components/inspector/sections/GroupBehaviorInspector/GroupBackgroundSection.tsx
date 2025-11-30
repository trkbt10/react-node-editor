/**
 * @file Group background color section
 */
import * as React from "react";
import { Input } from "../../../elements/Input";
import { InspectorLabel } from "../../parts/InspectorLabel";
import { InspectorButton } from "../../parts/InspectorButton";
import { useI18n } from "../../../../i18n/context";
import styles from "./GroupBackgroundSection.module.css";

type GroupBackgroundSectionProps = {
  nodeId: string;
  backgroundColor: string;
  onBackgroundChange: (color: string) => void;
  onReset: () => void;
};

/**
 * Section for group background color settings
 */
export function GroupBackgroundSection({
  nodeId,
  backgroundColor,
  onBackgroundChange,
  onReset,
}: GroupBackgroundSectionProps): React.ReactElement {
  const { t } = useI18n();

  const handleColorChange = React.useEffectEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    onBackgroundChange(e.target.value);
  });

  const handleReset = React.useEffectEvent(() => {
    onReset();
  });

  return (
    <div className={styles.colorInputRow}>
      <InspectorLabel>{t("fieldBackground") || "Background"}</InspectorLabel>
      <Input
        id={`node-${nodeId}-group-bg`}
        name="groupBackground"
        type="color"
        value={backgroundColor}
        onChange={handleColorChange}
        aria-label="Group background color"
        className={styles.colorInput}
      />
      <InspectorButton onClick={handleReset} aria-label="Reset group background">
        Reset
      </InspectorButton>
    </div>
  );
}
