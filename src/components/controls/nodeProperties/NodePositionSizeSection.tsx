/**
 * @file Node position and size section for inspector
 */
import * as React from "react";
import type { Node } from "../../../types/core";
import { InspectorLabel } from "../../inspector/parts/InspectorLabel";
import { PositionInputsGrid } from "../../inspector/parts/PositionInputsGrid";
import { Input } from "../../elements/Input";
import { useI18n } from "../../../i18n/context";

type NodePositionSizeSectionProps = {
  node: Node;
  onPositionXChange: (x: number) => void;
  onPositionYChange: (y: number) => void;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
};

/**
 * Section for editing node position (X, Y) and size (width, height)
 */
export function NodePositionSizeSection({
  node,
  onPositionXChange,
  onPositionYChange,
  onWidthChange,
  onHeightChange,
}: NodePositionSizeSectionProps): React.ReactElement {
  const { t } = useI18n();

  const handlePositionXChange = React.useEffectEvent(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onPositionXChange(Number(e.target.value));
    },
  );

  const handlePositionYChange = React.useEffectEvent(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onPositionYChange(Number(e.target.value));
    },
  );

  const handleWidthChange = React.useEffectEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    onWidthChange(Number(e.target.value));
  });

  const handleHeightChange = React.useEffectEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    onHeightChange(Number(e.target.value));
  });

  return (
    <div>
      <InspectorLabel>
        {t("inspectorPosition")} & {t("inspectorSize")}
      </InspectorLabel>
      <PositionInputsGrid>
        <Input
          type="number"
          label="X"
          value={Number(node.position.x.toFixed(2))}
          onChange={handlePositionXChange}
          id={`node-${node.id}-pos-x`}
          name="nodePosX"
          aria-label="X position"
        />
        <Input
          type="number"
          label="Y"
          value={Number(node.position.y.toFixed(2))}
          onChange={handlePositionYChange}
          id={`node-${node.id}-pos-y`}
          name="nodePosY"
          aria-label="Y position"
        />
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
