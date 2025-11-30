/**
 * @file Grid visibility settings section
 */
import * as React from "react";
import { SwitchInput } from "../../elements/SwitchInput";
import { useI18n } from "../../../i18n/context";
import { InspectorField } from "../../inspector/parts/InspectorField";

type GridVisibilitySectionProps = {
  showGrid: boolean;
  snapToGrid: boolean;
  onShowGridChange: (checked: boolean) => void;
  onSnapToGridChange: (checked: boolean) => void;
};

/**
 * Section for grid visibility and snap toggle settings
 */
export function GridVisibilitySection({
  showGrid,
  snapToGrid,
  onShowGridChange,
  onSnapToGridChange,
}: GridVisibilitySectionProps): React.ReactElement {
  const { t } = useI18n();

  const handleShowGridChange = React.useEffectEvent((checked: boolean) => {
    onShowGridChange(checked);
  });

  const handleSnapToGridChange = React.useEffectEvent((checked: boolean) => {
    onSnapToGridChange(checked);
  });

  return (
    <>
      <InspectorField>
        <SwitchInput
          id="grid-show"
          checked={showGrid}
          onChange={handleShowGridChange}
          label={t("inspectorShowGrid")}
          size="medium"
        />
      </InspectorField>
      <InspectorField>
        <SwitchInput
          id="grid-snap"
          checked={snapToGrid}
          onChange={handleSnapToGridChange}
          label={t("inspectorSnapToGrid")}
          size="medium"
        />
      </InspectorField>
    </>
  );
}
