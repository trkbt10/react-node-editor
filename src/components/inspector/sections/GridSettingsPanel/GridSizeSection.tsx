/**
 * @file Grid size settings section
 */
import * as React from "react";
import { useI18n } from "../../../../i18n/context";
import { InspectorField } from "../../parts/InspectorField";
import { InspectorInput } from "../../parts/InspectorInput";

type GridSizeSectionProps = {
  gridSize: number;
  snapThreshold: number;
  onGridSizeChange: (size: number) => void;
  onSnapThresholdChange: (threshold: number) => void;
};

/**
 * Section for grid size and snap threshold settings
 */
export function GridSizeSection({
  gridSize,
  snapThreshold,
  onGridSizeChange,
  onSnapThresholdChange,
}: GridSizeSectionProps): React.ReactElement {
  const { t } = useI18n();

  const handleGridSizeChange = React.useEffectEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseInt(e.target.value, 10);
    if (!isNaN(size) && size > 0) {
      onGridSizeChange(size);
    }
  });

  const handleSnapThresholdChange = React.useEffectEvent(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const threshold = parseInt(e.target.value, 10);
      if (!isNaN(threshold) && threshold > 0) {
        onSnapThresholdChange(threshold);
      }
    },
  );

  return (
    <>
      <InspectorField label={t("inspectorGridSize")}>
        <InspectorInput
          id="grid-size"
          name="gridSize"
          type="number"
          value={gridSize}
          min={10}
          max={100}
          step={5}
          onChange={handleGridSizeChange}
          aria-label="Grid size in pixels"
        />
      </InspectorField>
      <InspectorField label={t("inspectorSnapThreshold")}>
        <InspectorInput
          id="snap-threshold"
          name="snapThreshold"
          type="number"
          value={snapThreshold}
          min={1}
          max={20}
          step={1}
          onChange={handleSnapThresholdChange}
          aria-label="Snap threshold in pixels"
        />
      </InspectorField>
    </>
  );
}
