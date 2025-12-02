/**
 * @file Node layout section for inspector (width/height)
 */
import * as React from "react";
import type { Node } from "../../../types/core";
import { InspectorLabel } from "../../inspector/parts/InspectorLabel";
import { PositionInputsGrid } from "../../inspector/parts/PositionInputsGrid";
import { Input } from "../../elements/Input";
import { useI18n } from "../../../i18n/context";

type NodeLayoutSectionProps = {
  node: Node;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
};

/**
 * Section for node layout controls (width and height)
 */
export function NodeLayoutSection({
  node,
  onWidthChange,
  onHeightChange,
}: NodeLayoutSectionProps): React.ReactElement {
  const { t } = useI18n();

  const handleWidthChange = React.useEffectEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    onWidthChange(Number(e.target.value));
  });

  const handleHeightChange = React.useEffectEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    onHeightChange(Number(e.target.value));
  });

  return (
    <div>
      <InspectorLabel>{t("inspectorSize")}</InspectorLabel>
      <PositionInputsGrid>
        <Input
          type="number"
          label="W"
          value={Number((node.size?.width || 100).toFixed(2))}
          onChange={handleWidthChange}
          id={`node-${node.id}-width`}
          name="nodeWidth"
          aria-label="Width"
        />
        <Input
          type="number"
          label="H"
          value={Number((node.size?.height || 100).toFixed(2))}
          onChange={handleHeightChange}
          id={`node-${node.id}-height`}
          name="nodeHeight"
          aria-label="Height"
        />
      </PositionInputsGrid>
    </div>
  );
}
