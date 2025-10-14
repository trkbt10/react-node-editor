/**
 * @file Context menu customization section.
 */
import * as React from "react";
import classes from "./InteractionCustomizationExample.module.css";

type ContextMenuSettingsSectionProps = {
  mode: "default" | "custom";
  onModeChange: (mode: "default" | "custom") => void;
  log: string[];
  onClearLog: () => void;
};

export const ContextMenuSettingsSection: React.FC<ContextMenuSettingsSectionProps> = ({
  mode,
  onModeChange,
  log,
  onClearLog,
}) => {
  return (
    <section className={classes.section} aria-labelledby="context-menu-settings-heading">
      <header>
        <div id="context-menu-settings-heading" className={classes.sectionHeader}>
          Context Menu Handling
        </div>
        <p className={classes.sectionDescription}>
          Inject a custom handler to observe context menu requests before falling back to the built-in menu.
        </p>
      </header>
      <div className={classes.sectionBody}>
        <div className={classes.inlineControls} role="radiogroup" aria-label="Context menu behavior">
          <label className={classes.checkboxGroup}>
            <input
              type="radio"
              name="context-menu-mode"
              checked={mode === "default"}
              onChange={() => onModeChange("default")}
            />
            Default behavior
          </label>
          <label className={classes.checkboxGroup}>
            <input
              type="radio"
              name="context-menu-mode"
              checked={mode === "custom"}
              onChange={() => onModeChange("custom")}
            />
            Custom logging behavior
          </label>
        </div>
        {mode === "custom" && (
          <div>
            <div className={classes.buttonRow}>
              <span className={classes.mutedText}>Recent requests (most recent first)</span>
              <button type="button" onClick={onClearLog}>
                Clear
              </button>
            </div>
            {log.length === 0 ? (
              <div className={classes.mutedText}>Interact with the canvas to see intercepted requests.</div>
            ) : (
              <div className={classes.logList} aria-live="polite">
                {log.map((entry, index) => (
                  <div key={index} className={classes.logEntry}>
                    {entry}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
