/**
 * @file Tests for useSettings hook and settings value accessors
 */
import { renderHook, act } from "@testing-library/react";
import { useSettings } from "./useSettings";
import { SettingsManager } from "../settings/SettingsManager";

describe("useSettings", () => {
  beforeEach(() => {
    // Clear localStorage before each test to prevent state leaking between tests
    localStorage.clear();
  });

  describe("default values", () => {
    it("should return default settings when no settingsManager is provided", () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.showGrid).toBe(true);
      expect(result.current.showMinimap).toBe(true);
      expect(result.current.showStatusBar).toBe(true);
      expect(result.current.theme).toBe("light");
      expect(result.current.autoSave).toBe(true);
      expect(result.current.autoSaveInterval).toBe(30);
      expect(result.current.smoothAnimations).toBe(true);
      expect(result.current.doubleClickToEdit).toBe(true);
      expect(result.current.fontSize).toBe(14);
      expect(result.current.gridSize).toBe(20);
      expect(result.current.gridOpacity).toBe(0.3);
      expect(result.current.canvasBackground).toBe("#ffffff");
      expect(result.current.nodeSearchViewMode).toBe("list");
      expect(result.current.nodeSearchFilterMode).toBe("filter");
      expect(result.current.nodeSearchMenuWidth).toBe(360);
    });
  });

  describe("nodeSearchFilterMode", () => {
    let settingsManager: SettingsManager;

    beforeEach(() => {
      settingsManager = new SettingsManager();
    });

    it("should return filter mode from settingsManager", () => {
      settingsManager.setValue("behavior.nodeSearchFilterMode", "highlight");

      const { result } = renderHook(() => useSettings(settingsManager));

      expect(result.current.nodeSearchFilterMode).toBe("highlight");
    });

    it("should return default filter mode when value is not set", () => {
      // Default value is "filter"
      const { result } = renderHook(() => useSettings(settingsManager));

      expect(result.current.nodeSearchFilterMode).toBe("filter");
    });
  });

  describe("nodeSearchMenuWidth", () => {
    let settingsManager: SettingsManager;

    beforeEach(() => {
      settingsManager = new SettingsManager();
    });

    it("should return menu width from settingsManager", () => {
      settingsManager.setValue("behavior.nodeSearchMenuWidth", 500);

      const { result } = renderHook(() => useSettings(settingsManager));

      expect(result.current.nodeSearchMenuWidth).toBe(500);
    });

    it("should return default width when using settingsManager with defaults", () => {
      // Default value is 360
      const { result } = renderHook(() => useSettings(settingsManager));

      expect(result.current.nodeSearchMenuWidth).toBe(360);
    });
  });

  describe("settings change subscription", () => {
    it("should update when settings change", () => {
      const settingsManager = new SettingsManager();

      const { result } = renderHook(() => useSettings(settingsManager));

      // Initial value should be default
      expect(result.current.nodeSearchMenuWidth).toBe(360);

      act(() => {
        settingsManager.setValue("behavior.nodeSearchMenuWidth", 450);
      });

      expect(result.current.nodeSearchMenuWidth).toBe(450);
    });

    it("should update filter mode when settings change", () => {
      const settingsManager = new SettingsManager();

      const { result } = renderHook(() => useSettings(settingsManager));

      expect(result.current.nodeSearchFilterMode).toBe("filter");

      act(() => {
        settingsManager.setValue("behavior.nodeSearchFilterMode", "highlight");
      });

      expect(result.current.nodeSearchFilterMode).toBe("highlight");
    });
  });
});
