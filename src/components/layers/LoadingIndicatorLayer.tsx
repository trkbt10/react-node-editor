/**
 * @file Loading indicator overlay layer for displaying loading and saving states
 */
import * as React from "react";
import { useNodeEditor } from "../../contexts/composed/node-editor/context";
import styles from "./LoadingIndicatorLayer.module.css";

export type LoadingIndicatorLayerProps = {
  /** Text displayed while the editor loads external data */
  loadingLabel?: string;
  /** Text displayed while the editor saves data */
  savingLabel?: string;
};

export const LoadingIndicatorLayer: React.FC<LoadingIndicatorLayerProps> = ({
  loadingLabel = "Loading...",
  savingLabel = "Saving...",
}) => {
  const { isLoading, isSaving } = useNodeEditor();

  const message = React.useMemo(() => {
    if (isLoading) {
      return loadingLabel;
    }
    if (isSaving) {
      return savingLabel;
    }
    return null;
  }, [isLoading, isSaving, loadingLabel, savingLabel]);

  if (!message) {
    return null;
  }

  return (
    <div className={styles.loadingIndicator} role="status" aria-live="polite" aria-busy={true}>
      {message}
    </div>
  );
};
