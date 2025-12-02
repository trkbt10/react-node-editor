/**
 * @file Node behavior inspector component
 * Aggregation layer that combines individual node inspector sections
 */
import * as React from "react";
import type { InspectorRenderProps } from "../../../types/NodeDefinition";
import type { Node } from "../../../types/core";
import { PropertySection } from "../parts/PropertySection";
import { InspectorIconButton } from "../parts/InspectorIconButton";
import { LockIcon, UnlockIcon, EyeIcon, EyeOffIcon } from "../../elements/icons";
import { useI18n } from "../../../i18n/context";
import type { AlignmentActionType } from "../../controls/alignments/types";
import { NodeTitleSection } from "../../controls/nodeProperties/NodeTitleSection";
import { NodeContentSection } from "../../controls/nodeProperties/NodeContentSection";
import { NodePositionSection } from "../../controls/nodeProperties/NodePositionSection";
import { NodeLayoutSection } from "../../controls/nodeProperties/NodeLayoutSection";
import { NodeTypeSection } from "../../controls/nodeProperties/NodeTypeSection";
import { AlignmentControls } from "../../controls/alignments/AlignmentControls";

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

  const handleToggleLocked = React.useEffectEvent(() => {
    onUpdateNode({ locked: !node.locked });
  });

  const handleToggleVisible = React.useEffectEvent(() => {
    onUpdateNode({ visible: node.visible === false });
  });

  const isLocked = Boolean(node.locked);
  const isVisible = node.visible !== false;

  const handleAlignment = React.useEffectEvent((alignmentType: AlignmentActionType) => {
    if (!onAlignNodes || selectedNodes.length < 2) {
      return;
    }
    onAlignNodes(alignmentType, selectedNodes);
  });

  return (
    <PropertySection
      title={t("inspectorNodeProperties")}
      headerRight={
        <>
          <InspectorIconButton
            icon={isLocked ? <LockIcon size={14} /> : <UnlockIcon size={14} />}
            aria-label={isLocked ? t("inspectorUnlock") : t("inspectorLock")}
            variant="ghost"
            active={isLocked}
            onClick={handleToggleLocked}
          />
          <InspectorIconButton
            icon={isVisible ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
            aria-label={isVisible ? t("inspectorHide") : t("inspectorShow")}
            variant="ghost"
            active={!isVisible}
            onClick={handleToggleVisible}
          />
        </>
      }
    >
      <NodeTitleSection node={node} onTitleChange={handleTitleChange} />

      <NodeContentSection node={node} onContentChange={handleContentChange} />

      <AlignmentControls selectedNodes={selectedNodes} onAlign={handleAlignment} />
      <NodePositionSection
        node={node}
        onPositionXChange={handlePositionXChange}
        onPositionYChange={handlePositionYChange}
      />

      <NodeLayoutSection node={node} onWidthChange={handleWidthChange} onHeightChange={handleHeightChange} />

      <NodeTypeSection node={node} />
    </PropertySection>
  );
}
