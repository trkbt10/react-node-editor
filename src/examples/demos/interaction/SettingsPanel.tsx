/**
 * @file Aggregated settings panel for interaction customization.
 */
import * as React from "react";
import classes from "./InteractionCustomizationExample.module.css";
import { PanSettingsSection } from "./PanSettingsSection";
import { PinchSettingsSection } from "./PinchSettingsSection";
import { ContextMenuSettingsSection } from "./ContextMenuSettingsSection";
import { ShortcutSettingsSection } from "./ShortcutSettingsSection";
import type {
  PanOptionsState,
  PinchOptionsState,
  ShortcutBindingMap,
  ShortcutOverrideState,
} from "./panelTypes";
import type { KeyboardShortcutActionBehavior, NodeEditorShortcutAction } from "../../../types/interaction";

type SettingsPanelProps = {
  panOptions: PanOptionsState;
  onPanOptionsChange: (next: PanOptionsState) => void;
  pinchOptions: PinchOptionsState;
  onPinchOptionsChange: (next: PinchOptionsState) => void;
  contextMenuMode: "default" | "custom";
  onContextMenuModeChange: (mode: "default" | "custom") => void;
  contextMenuLog: string[];
  onClearContextMenuLog: () => void;
  keyboardEnabled: boolean;
  onKeyboardEnabledChange: (value: boolean) => void;
  shortcutOverrides: ShortcutOverrideState;
  onShortcutOverrideChange: (action: NodeEditorShortcutAction, behavior: KeyboardShortcutActionBehavior | null) => void;
  defaultShortcutBindings: ShortcutBindingMap;
  onResetShortcuts: () => void;
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  panOptions,
  onPanOptionsChange,
  pinchOptions,
  onPinchOptionsChange,
  contextMenuMode,
  onContextMenuModeChange,
  contextMenuLog,
  onClearContextMenuLog,
  keyboardEnabled,
  onKeyboardEnabledChange,
  shortcutOverrides,
  onShortcutOverrideChange,
  defaultShortcutBindings,
  onResetShortcuts,
}) => {
  return (
    <div className={classes.panelRoot}>
      <PanSettingsSection options={panOptions} onChange={onPanOptionsChange} />
      <PinchSettingsSection options={pinchOptions} onChange={onPinchOptionsChange} />
      <ContextMenuSettingsSection
        mode={contextMenuMode}
        onModeChange={onContextMenuModeChange}
        log={contextMenuLog}
        onClearLog={onClearContextMenuLog}
      />
      <ShortcutSettingsSection
        keyboardEnabled={keyboardEnabled}
        onKeyboardEnabledChange={onKeyboardEnabledChange}
        overrides={shortcutOverrides}
        onOverrideChange={onShortcutOverrideChange}
        defaultBindings={defaultShortcutBindings}
        onReset={onResetShortcuts}
      />
    </div>
  );
};
