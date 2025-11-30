/**
 * @file Node state section for inspector (locked/visible)
 */
import * as React from "react";
import type { Node } from "../../../../types/core";
import {
  InspectorDefinitionList,
  InspectorDefinitionItem,
} from "../../parts/InspectorDefinitionList";
import { SwitchInput } from "../../../elements/SwitchInput";
import { useI18n } from "../../../../i18n/context";

type NodeStateSectionProps = {
  node: Node;
  onLockedChange: (locked: boolean) => void;
  onVisibleChange: (visible: boolean) => void;
};

/**
 * Section for toggling node locked and visible states
 */
export function NodeStateSection({
  node,
  onLockedChange,
  onVisibleChange,
}: NodeStateSectionProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <div>
      <InspectorDefinitionList>
        <InspectorDefinitionItem label={t("inspectorLocked") || "Locked"}>
          <SwitchInput
            id={`node-${node.id}-locked`}
            checked={Boolean(node.locked)}
            onChange={onLockedChange}
            size="small"
          />
        </InspectorDefinitionItem>
        <InspectorDefinitionItem label={t("inspectorVisible") || "Visible"}>
          <SwitchInput
            id={`node-${node.id}-visible`}
            checked={node.visible !== false}
            onChange={onVisibleChange}
            size="small"
          />
        </InspectorDefinitionItem>
      </InspectorDefinitionList>
    </div>
  );
}
