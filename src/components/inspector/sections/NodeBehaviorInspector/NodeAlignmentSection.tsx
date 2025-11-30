/**
 * @file Node alignment section for inspector
 */
import * as React from "react";
import type { Node } from "../../../../types/core";
import { AlignmentControls } from "../../../controls/alignments/AlignmentControls";
import type { AlignmentActionType } from "../../../controls/alignments/types";

type NodeAlignmentSectionProps = {
  selectedNodes: Node[];
  onAlignNodes?: (alignmentType: AlignmentActionType, nodes: Node[]) => void;
};

/**
 * Section for node alignment controls when multiple nodes are selected
 */
export function NodeAlignmentSection({
  selectedNodes,
  onAlignNodes,
}: NodeAlignmentSectionProps): React.ReactElement {
  const handleAlignment = React.useEffectEvent((alignmentType: AlignmentActionType) => {
    if (!onAlignNodes || selectedNodes.length < 2) {
      return;
    }
    onAlignNodes(alignmentType, selectedNodes);
  });

  return <AlignmentControls selectedNodes={selectedNodes} onAlign={handleAlignment} />;
}
