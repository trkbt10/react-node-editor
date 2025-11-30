/**
 * @file Node behavior inspector component
 * Aggregation layer that combines individual node inspector sections
 */
import * as React from "react";
import type { InspectorRenderProps } from "../../../types/NodeDefinition";
import type { Node } from "../../../types/core";
import { PropertySection } from "../parts/PropertySection";
import { useI18n } from "../../../i18n/context";
import type { AlignmentActionType } from "../../controls/alignments/types";
import { NodeTitleSection } from "../../controls/nodeProperties/NodeTitleSection";
import { NodeContentSection } from "../../controls/nodeProperties/NodeContentSection";
import { NodeAlignmentSection } from "../../controls/nodeProperties/NodeAlignmentSection";
import { NodePositionSizeSection } from "../../controls/nodeProperties/NodePositionSizeSection";
import { NodeStateSection } from "../../controls/nodeProperties/NodeStateSection";
import { NodeTypeSection } from "../../controls/nodeProperties/NodeTypeSection";

// Extended props for supporting multiple selection alignment
type ExtendedInspectorRenderProps = {
  selectedNodes?: Node[];
  onAlignNodes?: (alignmentType: AlignmentActionType, nodes: Node[]) => void;
} & InspectorRenderProps;

/**
 * Inspector for "node" behavior
 * Provides standard node editing capabilities with optimized performance
 */
export function NodeBehaviorInspector({
  node,
  onUpdateNode,
  selectedNodes = [],
  onAlignNodes,
}: ExtendedInspectorRenderProps): React.ReactElement {
  const { t } = useI18n();

  // Event handlers using useEffectEvent for stable references
  const handleTitleChange = React.useEffectEvent((title: string) => {
    onUpdateNode({
      data: { ...node.data, title },
    });
  });

  const handleContentChange = React.useEffectEvent((content: string) => {
    onUpdateNode({
      data: { ...node.data, content },
    });
  });

  const handlePositionXChange = React.useEffectEvent((x: number) => {
    onUpdateNode({
      position: { ...node.position, x },
    });
  });

  const handlePositionYChange = React.useEffectEvent((y: number) => {
    onUpdateNode({
      position: { ...node.position, y },
    });
  });

  const handleWidthChange = React.useEffectEvent((width: number) => {
    onUpdateNode({
      size: { ...node.size, width, height: node.size?.height ?? 0 },
    });
  });

  const handleHeightChange = React.useEffectEvent((height: number) => {
    onUpdateNode({
      size: { ...node.size, height, width: node.size?.width ?? 0 },
    });
  });

  const handleLockedChange = React.useEffectEvent((locked: boolean) => {
    onUpdateNode({ locked });
  });

  const handleVisibleChange = React.useEffectEvent((visible: boolean) => {
    onUpdateNode({ visible });
  });

  return (
    <PropertySection title={t("inspectorNodeProperties")}>
      <NodeTitleSection node={node} onTitleChange={handleTitleChange} />

      <NodeContentSection node={node} onContentChange={handleContentChange} />

      <NodeAlignmentSection selectedNodes={selectedNodes} onAlignNodes={onAlignNodes} />

      <NodePositionSizeSection
        node={node}
        onPositionXChange={handlePositionXChange}
        onPositionYChange={handlePositionYChange}
        onWidthChange={handleWidthChange}
        onHeightChange={handleHeightChange}
      />

      <NodeStateSection
        node={node}
        onLockedChange={handleLockedChange}
        onVisibleChange={handleVisibleChange}
      />

      <NodeTypeSection node={node} />
    </PropertySection>
  );
}
