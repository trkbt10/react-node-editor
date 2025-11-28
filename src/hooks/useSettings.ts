/**
 * @file Hook for accessing and subscribing to editor settings
 */
import * as React from "react";
import type { SettingsManager } from "../settings/SettingsManager";
import type { NodeSearchViewMode } from "../types/interaction";

type ThemeValue = "light" | "dark" | "auto";

type Settings = {
  showGrid: boolean;
  showMinimap: boolean;
  showStatusBar: boolean;
  theme: ThemeValue;
  autoSave: boolean;
  autoSaveInterval: number;
  smoothAnimations: boolean;
  doubleClickToEdit: boolean;
  fontSize: number;
  gridSize: number;
  gridOpacity: number;
  canvasBackground: string;
  nodeSearchViewMode: NodeSearchViewMode;
};

const defaultSettings: Settings = {
  showGrid: true,
  showMinimap: true,
  showStatusBar: true,
  theme: "light",
  autoSave: true,
  autoSaveInterval: 30,
  smoothAnimations: true,
  doubleClickToEdit: true,
  fontSize: 14,
  gridSize: 20,
  gridOpacity: 0.3,
  canvasBackground: "#ffffff",
  nodeSearchViewMode: "list",
};

function isValidTheme(value: unknown): value is ThemeValue {
  return typeof value === "string" && ["light", "dark", "auto"].includes(value);
}

function isValidNodeSearchViewMode(value: unknown): value is NodeSearchViewMode {
  return typeof value === "string" && ["list", "split"].includes(value);
}

function getBooleanSetting(settingsManager: SettingsManager, key: string, defaultValue: boolean): boolean {
  const value = settingsManager.getValue(key);
  return typeof value === "boolean" ? value : defaultValue;
}

function getNumberSetting(settingsManager: SettingsManager, key: string, defaultValue: number): number {
  const value = settingsManager.getValue(key);
  return typeof value === "number" ? value : defaultValue;
}

function getStringSetting(settingsManager: SettingsManager, key: string, defaultValue: string): string {
  const value = settingsManager.getValue(key);
  return typeof value === "string" ? value : defaultValue;
}

function getThemeSetting(settingsManager: SettingsManager, key: string, defaultValue: ThemeValue): ThemeValue {
  const value = settingsManager.getValue(key);
  return isValidTheme(value) ? value : defaultValue;
}

function getNodeSearchViewModeSetting(
  settingsManager: SettingsManager,
  key: string,
  defaultValue: NodeSearchViewMode,
): NodeSearchViewMode {
  const value = settingsManager.getValue(key);
  return isValidNodeSearchViewMode(value) ? value : defaultValue;
}

export type { Settings };

/**
 * Provides memoized editor settings sourced from an optional SettingsManager with sensible defaults.
 * @param settingsManager Optional manager instance to subscribe to for reactive updates.
 */
export function useSettings(settingsManager?: SettingsManager): Settings {
  const [settingsVersion, setSettingsVersion] = React.useState(0);

  // Listen for settings changes
  React.useEffect(() => {
    if (!settingsManager) {
      return;
    }

    const unsubscribe = settingsManager.on("change", () => {
      setSettingsVersion((prev) => prev + 1);
    });

    return unsubscribe;
  }, [settingsManager]);

  // Compute settings values
  const settings = React.useMemo(() => {
    if (!settingsManager) {
      return defaultSettings;
    }

    return {
      showGrid: getBooleanSetting(settingsManager, "appearance.showGrid", defaultSettings.showGrid),
      showMinimap: getBooleanSetting(settingsManager, "appearance.showMinimap", defaultSettings.showMinimap),
      showStatusBar: getBooleanSetting(settingsManager, "appearance.showStatusBar", defaultSettings.showStatusBar),
      theme: getThemeSetting(settingsManager, "appearance.theme", defaultSettings.theme),
      autoSave: getBooleanSetting(settingsManager, "general.autoSave", defaultSettings.autoSave),
      autoSaveInterval: getNumberSetting(settingsManager, "general.autoSaveInterval", defaultSettings.autoSaveInterval),
      smoothAnimations: getBooleanSetting(
        settingsManager,
        "behavior.smoothAnimations",
        defaultSettings.smoothAnimations,
      ),
      doubleClickToEdit: getBooleanSetting(
        settingsManager,
        "behavior.doubleClickToEdit",
        defaultSettings.doubleClickToEdit,
      ),
      fontSize: getNumberSetting(settingsManager, "appearance.fontSize", defaultSettings.fontSize),
      gridSize: getNumberSetting(settingsManager, "appearance.gridSize", defaultSettings.gridSize),
      gridOpacity: getNumberSetting(settingsManager, "appearance.gridOpacity", defaultSettings.gridOpacity),
      canvasBackground: getStringSetting(
        settingsManager,
        "appearance.canvasBackground",
        defaultSettings.canvasBackground,
      ),
      nodeSearchViewMode: getNodeSearchViewModeSetting(
        settingsManager,
        "behavior.nodeSearchViewMode",
        defaultSettings.nodeSearchViewMode,
      ),
    };
  }, [settingsManager, settingsVersion]);

  return settings;
}
