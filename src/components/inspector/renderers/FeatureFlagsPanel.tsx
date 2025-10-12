/**
 * @file Feature flags panel component
 */
import * as React from "react";
import { useFeatureFlags, setFeatureFlags, type NodeEditorFeatureFlags } from "../../../config/featureFlags";
import { SwitchInput, Button } from "../../elements";
import { InspectorDefinitionList, InspectorDefinitionItem } from "../parts/InspectorDefinitionList";
import { PropertySection } from "../parts/PropertySection";
import styles from "./FeatureFlagsPanel.module.css";

export type FeatureFlagsPanelProps = {
  className?: string;
  onClose?: () => void;
};

/**
 * Developer panel for managing node editor feature flags
 */
export const FeatureFlagsPanel: React.FC<FeatureFlagsPanelProps> = ({ className, onClose }) => {
  const currentFlags = useFeatureFlags();
  const [localFlags, setLocalFlags] = React.useState<NodeEditorFeatureFlags>(currentFlags);
  const [hasChanges, setHasChanges] = React.useState(false);

  // Check for changes
  React.useEffect(() => {
    const changed = Object.keys(localFlags).some(
      (key) => localFlags[key as keyof NodeEditorFeatureFlags] !== currentFlags[key as keyof NodeEditorFeatureFlags],
    );
    setHasChanges(changed);
  }, [localFlags, currentFlags]);

  const handleToggle = (flag: keyof NodeEditorFeatureFlags) => {
    setLocalFlags((prev) => ({
      ...prev,
      [flag]: !prev[flag],
    }));
  };

  const handleApply = () => {
    setFeatureFlags(localFlags);
    setHasChanges(false);

    // Show reload message if needed
    if (localFlags.useInferredPortsOnly !== currentFlags.useInferredPortsOnly) {
      if (window.confirm("Changing port inference mode requires a page reload. Reload now?")) {
        window.location.reload();
      }
    }
  };

  const handleReset = () => {
    setLocalFlags(currentFlags);
    setHasChanges(false);
  };

  return (
    <div className={`${styles.panel} ${className || ""}`}>
      <div className={styles.header}>
        <h3>Node Editor Feature Flags</h3>
        {onClose && (
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className={styles.content}>
        <PropertySection title="Settings">
          <div className={styles.description}>
            Configure feature flags for the node editor migration. These settings are stored in localStorage for
            development.
          </div>

          <InspectorDefinitionList>
            <InspectorDefinitionItem
              label="Use Inferred Ports Only"
              description={
                <>
                  When enabled, ports are exclusively inferred from NodeDefinitions. Legacy embedded ports are ignored.{" "}
                  <strong>Requires reload.</strong>
                </>
              }
            >
              <SwitchInput
                id="useInferredPortsOnly"
                checked={localFlags.useInferredPortsOnly}
                onChange={() => handleToggle("useInferredPortsOnly")}
              />
            </InspectorDefinitionItem>
          </InspectorDefinitionList>
        </PropertySection>

        <PropertySection title="Current State">
          <pre className={styles.currentStateCode}>{JSON.stringify(currentFlags, null, 2)}</pre>
        </PropertySection>

        <div className={styles.actions}>
          <Button onClick={handleApply} variant="primary" disabled={!hasChanges}>
            Apply Changes
          </Button>
          <Button onClick={handleReset} variant="secondary" disabled={!hasChanges}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

FeatureFlagsPanel.displayName = "FeatureFlagsPanel";
