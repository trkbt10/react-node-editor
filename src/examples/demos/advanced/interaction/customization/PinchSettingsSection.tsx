/**
 * @file Pinch zoom interaction configuration section.
 */
import * as React from "react";
import classes from "./InteractionCustomizationExample.module.css";
import type { PinchOptionsState } from "./panelTypes";
import type { PointerType } from "../../../../../types/interaction";

type PinchSettingsSectionProps = {
  options: PinchOptionsState;
  onChange: (next: PinchOptionsState) => void;
};

const POINTER_OPTIONS: PointerType[] = ["touch", "pen"];

export const PinchSettingsSection: React.FC<PinchSettingsSectionProps> = ({ options, onChange }) => {
  const updateOption = React.useCallback(
    (partial: Partial<PinchOptionsState>) => {
      onChange({ ...options, ...partial });
    },
    [options, onChange],
  );

  const handlePointerToggle = React.useCallback(
    (pointerType: PointerType, checked: boolean) => {
      const nextTypes = new Set(options.pointerTypes);
      if (checked) {
        nextTypes.add(pointerType);
      } else {
        nextTypes.delete(pointerType);
      }
      updateOption({ pointerTypes: Array.from(nextTypes) });
    },
    [options.pointerTypes, updateOption],
  );

  return (
    <section className={classes.section} aria-labelledby="pinch-settings-heading">
      <header>
        <div id="pinch-settings-heading" className={classes.sectionHeader}>
          Pinch Zoom
        </div>
        <p className={classes.sectionDescription}>
          Fine tune pinch-to-zoom support for touch and stylus inputs. Zoom wheel shortcuts remain available.
        </p>
      </header>
      <div className={classes.sectionBody}>
        <label className={classes.checkboxGroup}>
          <input
            type="checkbox"
            checked={options.enabled}
            onChange={(event) => updateOption({ enabled: event.target.checked })}
          />
          Enable pinch gestures
        </label>

        <div className={classes.inlineControls} aria-label="Pinch pointer types">
          {POINTER_OPTIONS.map((pointer) => (
            <label key={pointer} className={classes.checkboxGroup}>
              <input
                type="checkbox"
                checked={options.pointerTypes.includes(pointer)}
                disabled={!options.enabled}
                onChange={(event) => handlePointerToggle(pointer, event.target.checked)}
              />
              {pointer === "touch" ? "Touch input" : "Stylus input"}
            </label>
          ))}
        </div>

        <div className={classes.sliderRow}>
          <label htmlFor="pinch-distance-input">Activation distance</label>
          <input
            id="pinch-distance-input"
            type="range"
            min={4}
            max={64}
            step={1}
            disabled={!options.enabled}
            value={options.minDistance}
            onChange={(event) => updateOption({ minDistance: Number.parseInt(event.target.value, 10) })}
          />
          <input
            type="number"
            min={0}
            max={128}
            disabled={!options.enabled}
            value={options.minDistance}
            onChange={(event) => updateOption({ minDistance: Number.parseInt(event.target.value, 10) || 0 })}
          />
          <span className={classes.mutedText}>pixels</span>
        </div>
      </div>
    </section>
  );
};
