/**
 * @file Connection properties section for inspector
 */
import * as React from "react";
import type { Connection, Node } from "../../../types/core";
import { PropertySection } from "../../inspector/parts/PropertySection";
import { ConnectionEndpointField } from "./ConnectionEndpointField";
import { useI18n } from "../../../i18n/context";

type ConnectionPropertiesSectionProps = {
  connection: Connection;
  nodes: Record<string, Node>;
};

/**
 * Section displaying connection properties (from/to endpoints)
 */
export function ConnectionPropertiesSection({
  connection,
  nodes,
}: ConnectionPropertiesSectionProps): React.ReactElement {
  const { t } = useI18n();

  const fromNode = nodes[connection.fromNodeId];
  const toNode = nodes[connection.toNodeId];

  return (
    <PropertySection title={t("inspectorConnectionProperties")}>
      <ConnectionEndpointField
        label={t("connectionFrom")}
        node={fromNode}
        portId={connection.fromPortId}
      />
      <ConnectionEndpointField
        label={t("connectionTo")}
        node={toNode}
        portId={connection.toPortId}
      />
    </PropertySection>
  );
}
