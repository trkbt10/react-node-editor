/**
 * @file Keyboard shortcut customization section.
 */
import * as React from "react";
import classes from "./InteractionCustomizationExample.module.css";
import type {
  KeyboardShortcutActionBehavior,
  NodeEditorShortcutAction,
  ShortcutBinding,
} from "../../../types/interaction";
import type { ShortcutBindingMap, ShortcutOverrideState } from "./panelTypes";

type ShortcutSettingsSectionProps = {
  keyboardEnabled: boolean;
  onKeyboardEnabledChange: (value: boolean) => void;
  overrides: ShortcutOverrideState;
  onOverrideChange: (action: NodeEditorShortcutAction, behavior: KeyboardShortcutActionBehavior | null) => void;
  defaultBindings: ShortcutBindingMap;
  onReset: () => void;
};

const serializeBindings = (bindings: ShortcutBinding[]): string =>
  bindings
    .map((binding) =>
      JSON.stringify({
        key: binding.key,
        ctrl: !!binding.ctrl,
        shift: !!binding.shift,
        alt: !!binding.alt,
        meta: !!binding.meta,
        cmdOrCtrl: !!binding.cmdOrCtrl,
      }),
    )
    .sort()
    .join("|");

const SHIFT_ADD_NODE_BINDINGS: ShortcutBinding[] = [{ key: "n", cmdOrCtrl: true, shift: true }];
const REDO_PRIMARY_BINDING: ShortcutBinding = { key: "z", cmdOrCtrl: true, shift: true };
const REDO_ALIAS_BINDING: ShortcutBinding = { key: "y", cmdOrCtrl: true };

const ensureRedoBindings = (includeAlias: boolean): ShortcutBinding[] => {
  const result = [REDO_PRIMARY_BINDING];
  if (includeAlias) {
    result.push(REDO_ALIAS_BINDING);
  }
  return result;
};

export const ShortcutSettingsSection: React.FC<ShortcutSettingsSectionProps> = ({
  keyboardEnabled,
  onKeyboardEnabledChange,
  overrides,
  onOverrideChange,
  defaultBindings,
  onReset,
}) => {
  const deleteEnabled = overrides["delete-selection"]?.enabled !== false;

  const handleDeleteToggle = React.useCallback(
    (checked: boolean) => {
      onOverrideChange("delete-selection", checked ? null : { enabled: false });
    },
    [onOverrideChange],
  );

  const addNodeOption = React.useMemo(() => {
    const override = overrides["add-node"];
    if (override?.enabled === false) {
      return "disabled";
    }

    const bindings = override?.bindings ?? defaultBindings["add-node"];
    if (serializeBindings(bindings) === serializeBindings(SHIFT_ADD_NODE_BINDINGS)) {
      return "shift";
    }

    return "default";
  }, [overrides, defaultBindings]);

  const handleAddNodeOptionChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value as "default" | "shift" | "disabled";
      switch (value) {
        case "default":
          onOverrideChange("add-node", null);
          break;
        case "shift":
          onOverrideChange("add-node", { bindings: SHIFT_ADD_NODE_BINDINGS });
          break;
        case "disabled":
        default:
          onOverrideChange("add-node", { enabled: false });
          break;
      }
    },
    [onOverrideChange],
  );

  const redoBindings = overrides.redo?.bindings ?? defaultBindings.redo;
  const redoAliasEnabled = redoBindings.some((binding) => binding.key.toLowerCase() === "y");

  const handleRedoAliasToggle = React.useCallback(
    (checked: boolean) => {
      if (checked) {
        // Restore default behavior when alias is re-enabled.
        if (!overrides.redo || overrides.redo.bindings === undefined) {
          onOverrideChange("redo", null);
          return;
        }
        onOverrideChange("redo", { ...overrides.redo, bindings: ensureRedoBindings(true) });
        return;
      }

      onOverrideChange("redo", {
        ...overrides.redo,
        bindings: ensureRedoBindings(false),
      });
    },
    [onOverrideChange, overrides.redo, redoBindings],
  );

  return (
    <section className={classes.section} aria-labelledby="shortcut-settings-heading">
      <header>
        <div id="shortcut-settings-heading" className={classes.sectionHeader}>
          Keyboard Shortcuts
        </div>
        <p className={classes.sectionDescription}>
          Tailor core keyboard shortcuts and disable actions that conflict with your host application.
        </p>
      </header>
      <div className={classes.sectionBody}>
        <label className={classes.checkboxGroup}>
          <input
            type="checkbox"
            checked={keyboardEnabled}
            onChange={(event) => onKeyboardEnabledChange(event.target.checked)}
          />
          Enable standard shortcuts
        </label>

        <label className={classes.checkboxGroup}>
          <input
            type="checkbox"
            checked={deleteEnabled}
            disabled={!keyboardEnabled}
            onChange={(event) => handleDeleteToggle(event.target.checked)}
          />
          Allow Delete/Backspace to remove selection
        </label>

        <label>
          <span className={classes.sectionDescription}>Add node shortcut</span>
          <select
            value={addNodeOption}
            disabled={!keyboardEnabled}
            onChange={handleAddNodeOptionChange}
          >
            <option value="default">Ctrl+N (default)</option>
            <option value="shift">Ctrl/Cmd+Shift+N</option>
            <option value="disabled">Disabled</option>
          </select>
        </label>

        <label className={classes.checkboxGroup}>
          <input
            type="checkbox"
            checked={redoAliasEnabled}
            disabled={!keyboardEnabled}
            onChange={(event) => handleRedoAliasToggle(event.target.checked)}
          />
          Keep Ctrl/Cmd+Y as a redo alias
        </label>

        <div className={classes.buttonRow}>
          <button type="button" onClick={onReset}>
            Reset to defaults
          </button>
          <span className={classes.panelFooterNote}>
            Changes update the editor in real time. Reset clears all overrides and re-enables the defaults.
          </span>
        </div>
      </div>
    </section>
  );
};
