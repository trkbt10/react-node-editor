/**
 * @file Auto-save settings section
 */
import * as React from "react";
import { SwitchInput } from "../../elements/SwitchInput";
import { useI18n } from "../../../i18n/context";
import { InspectorInput } from "../../inspector/parts/InspectorInput";
import { InspectorDefinitionItem } from "../../inspector/parts/InspectorDefinitionList";

type AutoSaveSectionProps = {
  autoSave: boolean;
  autoSaveInterval: number;
  settingsWritable: boolean;
  onAutoSaveToggle: (enabled: boolean) => void;
  onAutoSaveIntervalChange: (interval: number) => void;
};

/**
 * Section for auto-save settings
 */
export function AutoSaveSection({
  autoSave,
  autoSaveInterval,
  settingsWritable,
  onAutoSaveToggle,
  onAutoSaveIntervalChange,
}: AutoSaveSectionProps): React.ReactElement {
  const { t } = useI18n();
  const [intervalInput, setIntervalInput] = React.useState<string>(() => String(autoSaveInterval));

  React.useEffect(() => {
    setIntervalInput(String(autoSaveInterval));
  }, [autoSaveInterval]);

  const handleAutoSaveToggle = React.useEffectEvent((enabled: boolean) => {
    onAutoSaveToggle(enabled);
  });

  const handleIntervalChange = React.useEffectEvent((value: string) => {
    setIntervalInput(value);
  });

  const handleIntervalBlur = React.useEffectEvent(() => {
    const interval = parseInt(intervalInput, 10);
    if (!Number.isNaN(interval) && interval >= 5 && interval <= 3600) {
      onAutoSaveIntervalChange(interval);
    } else {
      setIntervalInput(String(autoSaveInterval));
    }
  });

  return (
    <React.Activity mode={settingsWritable ? "visible" : "hidden"}>
      <InspectorDefinitionItem label={t("inspectorAutoSave")}>
        <SwitchInput
          id="auto-save"
          checked={autoSave}
          onChange={handleAutoSaveToggle}
          size="medium"
          disabled={!settingsWritable}
        />
      </InspectorDefinitionItem>
      <InspectorDefinitionItem label={t("inspectorAutoSaveInterval")}>
        <InspectorInput
          id="auto-save-interval"
          name="autoSaveInterval"
          type="number"
          value={intervalInput}
          min={5}
          max={3600}
          step={5}
          onChange={(e) => handleIntervalChange(e.target.value)}
          onBlur={handleIntervalBlur}
          disabled={!settingsWritable}
          aria-label="Auto-save interval in seconds"
        />
      </InspectorDefinitionItem>
    </React.Activity>
  );
}
