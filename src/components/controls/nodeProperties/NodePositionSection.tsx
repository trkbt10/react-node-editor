/**
 * @file Node position section for inspector (alignment + X/Y coordinates)
 */
import * as React from "react";
import type { Node } from "../../../types/core";
import { InspectorLabel } from "../../inspector/parts/InspectorLabel";
import { PositionInputsGrid } from "../../inspector/parts/PositionInputsGrid";
import { Input } from "../../elements/Input";
import { AlignmentControls } from "../alignments/AlignmentControls";
import type { AlignmentActionType } from "../alignments/types";
import { useI18n } from "../../../i18n/context";

type NodePositionSectionProps = {
  node: Node;
  selectedNodes: Node[];
  onPositionXChange: (x: number) => void;
  onPositionYChange: (y: number) => void;
  onAlignNodes?: (alignmentType: AlignmentActionType, nodes: Node[]) => void;
};

/**
 * Section for node position controls including alignment and X/Y coordinates
 */
export function NodePositionSection({
  node,
  selectedNodes,
  onPositionXChange,
  onPositionYChange,
  onAlignNodes,
}: NodePositionSectionProps): React.ReactElement {
  const { t } = useI18n();

  const handlePositionXChange = React.useEffectEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    onPositionXChange(Number(e.target.value));
  });

  const handlePositionYChange = React.useEffectEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    onPositionYChange(Number(e.target.value));
  });

  const handleAlignment = React.useEffectEvent((alignmentType: AlignmentActionType) => {
    if (!onAlignNodes || selectedNodes.length < 2) {
      return;
    }
    onAlignNodes(alignmentType, selectedNodes);
  });

  return (
    <div>
      <AlignmentControls selectedNodes={selectedNodes} onAlign={handleAlignment} />
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
