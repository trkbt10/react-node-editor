import * as React from "react";
import { useNodeEditor } from "../contexts/node-editor";
import { Label, SwitchInput } from "../components/elements";
import { useI18n } from "../i18n";
import { SettingsField, SettingsInput } from "./components";

/**
 * General editor settings component
 */
export const GeneralSettingsPanel: React.FC = () => {
  const { settings, settingsManager, updateSetting } = useNodeEditor();
  const { t } = useI18n();
  const [autoSaveIntervalInput, setAutoSaveIntervalInput] = React.useState<string>(() =>
    String(settings.autoSaveInterval ?? 30)
  );

  React.useEffect(() => {
    setAutoSaveIntervalInput(String(settings.autoSaveInterval ?? 30));
  }, [settings.autoSaveInterval]);

  const handleAutoSaveToggle = React.useCallback(
    (enabled: boolean) => {
      updateSetting("general.autoSave", enabled);
    },
    [updateSetting]
  );

  const handleAutoSaveIntervalChange = React.useCallback((value: string) => {
    setAutoSaveIntervalInput(value);
  }, []);

  const handleAutoSaveIntervalBlur = React.useCallback(() => {
    const interval = parseInt(autoSaveIntervalInput, 10);
    if (!Number.isNaN(interval) && interval >= 5 && interval <= 3600) {
      updateSetting("general.autoSaveInterval", interval);
    } else {
      setAutoSaveIntervalInput(String(settings.autoSaveInterval ?? 30));
    }
  }, [autoSaveIntervalInput, settings.autoSaveInterval, updateSetting]);

  const settingsWritable = Boolean(settingsManager);

  return (
    <>
      <SettingsField>
        <SwitchInput
          id="auto-save"
          checked={settings.autoSave}
          onChange={handleAutoSaveToggle}
          label={t("inspectorAutoSave")}
          size="medium"
          disabled={!settingsWritable}
        />
      </SettingsField>
      <SettingsField>
        <Label htmlFor="auto-save-interval">
          {t("inspectorAutoSaveInterval")}
          <SettingsInput
            id="auto-save-interval"
            name="autoSaveInterval"
            type="number"
            value={autoSaveIntervalInput}
            min={5}
            max={3600}
            step={5}
            onChange={(e) => handleAutoSaveIntervalChange(e.target.value)}
            onBlur={handleAutoSaveIntervalBlur}
            disabled={!settingsWritable}
            aria-label="Auto-save interval in seconds"
          />
        </Label>
      </SettingsField>
    </>
  );
};

GeneralSettingsPanel.displayName = "GeneralSettingsPanel";
