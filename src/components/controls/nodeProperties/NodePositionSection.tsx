/**
 * @file Node position section for inspector (alignment + X/Y coordinates)
 */
import * as React from "react";
import { useI18n } from "../../../i18n/context";
import type { Node } from "../../../types/core";
import { Input } from "../../elements/Input";
import { InspectorLabel } from "../../inspector/parts/InspectorLabel";
import { PositionInputsGrid } from "../../inspector/parts/PositionInputsGrid";

type NodePositionSectionProps = {
  node: Node;
  onPositionXChange: (x: number) => void;
  onPositionYChange: (y: number) => void;
};

/**
 * Section for node position controls including alignment and X/Y coordinates
 */
export function NodePositionSection({
  node,
  onPositionXChange,
  onPositionYChange,
}: NodePositionSectionProps): React.ReactElement {
  const { t } = useI18n();

  const handlePositionXChange = React.useEffectEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    onPositionXChange(Number(e.target.value));
  });

  const handlePositionYChange = React.useEffectEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    onPositionYChange(Number(e.target.value));
  });

  return (
    <div>
      <InspectorLabel>{t("inspectorPosition")}</InspectorLabel>
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
      </PositionInputsGrid>
    </div>
  );
}
