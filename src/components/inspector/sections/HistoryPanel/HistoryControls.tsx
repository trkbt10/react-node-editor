/**
 * @file History undo/redo controls
 */
import * as React from "react";
import { Button } from "../../../elements/Button";
import { useI18n } from "../../../../i18n/context";
import styles from "./HistoryControls.module.css";

type HistoryControlsProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

/**
 * Section for history undo/redo buttons
 */
export function HistoryControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: HistoryControlsProps): React.ReactElement {
  const { t } = useI18n();

  const handleUndo = React.useEffectEvent(() => {
    onUndo();
  });

  const handleRedo = React.useEffectEvent(() => {
    onRedo();
  });

  return (
    <div className={styles.historyHeaderActions}>
      <Button size="small" variant="secondary" onClick={handleUndo} disabled={!canUndo}>
        {t("historyUndo") || "Undo"}
      </Button>
      <Button size="small" variant="secondary" onClick={handleRedo} disabled={!canRedo}>
        {t("historyRedo") || "Redo"}
      </Button>
    </div>
  );
}
