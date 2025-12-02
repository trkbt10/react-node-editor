/**
 * @file Connection endpoint field component
 */
import * as React from "react";
import type { Node, PortId } from "../../../types/core";
import { InspectorFieldRow } from "../../inspector/parts/InspectorFieldRow";
import { ReadOnlyField } from "../../inspector/parts/ReadOnlyField";
import { useI18n } from "../../../i18n/context";

type ConnectionEndpointFieldProps = {
  label: string;
  node: Node | undefined;
  portId: PortId;
};

/**
 * Displays a connection endpoint (node title + port ID)
 */
export function ConnectionEndpointField({
  label,
  node,
  portId,
}: ConnectionEndpointFieldProps): React.ReactElement {
  const { t } = useI18n();

  const nodeTitle = node?.data.title?.trim() || t("untitled");
  const displayValue = `${nodeTitle}.${portId}`;

  return (
    <InspectorFieldRow label={label}>
      <ReadOnlyField>{displayValue}</ReadOnlyField>
    </InspectorFieldRow>
  );
}
