/**
 * @file Pan interaction configuration section.
 */
import * as React from "react";
import classes from "./InteractionCustomizationExample.module.css";
import type { PanOptionsState } from "./panelTypes";

type PanSettingsSectionProps = {
  options: PanOptionsState;
  onChange: (next: PanOptionsState) => void;
};

export const PanSettingsSection: React.FC<PanSettingsSectionProps> = ({ options, onChange }) => {
  const updateOption = React.useCallback(
    (partial: Partial<PanOptionsState>) => {
      onChange({ ...options, ...partial });
    },
    [options, onChange],
  );

  return (
    <section className={classes.section} aria-labelledby="pan-settings-heading">
      <header>
        <div id="pan-settings-heading" className={classes.sectionHeader}>
          Canvas Panning
        </div>
        <p className={classes.sectionDescription}>
          Configure which pointer inputs can drag the canvas. Space+Drag remains available regardless of these
          settings.
        </p>
      </header>
      <div className={classes.sectionBody}>
        <label className={classes.checkboxGroup}>
          <input
            type="checkbox"
            checked={options.allowMouse}
            onChange={(event) => updateOption({ allowMouse: event.target.checked })}
          />
          Enable middle-mouse panning
        </label>
        <label className={classes.checkboxGroup}>
          <input
            type="checkbox"
            checked={options.allowTouch}
            onChange={(event) => updateOption({ allowTouch: event.target.checked })}
          />
          Allow touch press-and-drag on empty canvas
        </label>
        <label className={classes.checkboxGroup}>
          <input
            type="checkbox"
            disabled={!options.allowTouch}
            checked={options.requireEmptyTarget}
            onChange={(event) => updateOption({ requireEmptyTarget: event.target.checked })}
          />
          Require drag to start from empty space
        </label>
        <label className={classes.checkboxGroup}>
          <input
            type="checkbox"
            checked={options.allowPen}
            onChange={(event) => updateOption({ allowPen: event.target.checked })}
          />
          Allow stylus primary-button drag
        </label>
      </div>
    </section>
  );
};
