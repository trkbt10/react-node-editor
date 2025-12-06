/**
 * @file Connection prune section for removing invalid connections
 */
import * as React from "react";

import { useI18n } from "../../../i18n/context";
import { InspectorButton } from "../../inspector/parts/InspectorButton";
import { InspectorDefinitionItem } from "../../inspector/parts/InspectorDefinitionList";

type ConnectionPruneSectionProps = {
  hasConnections: boolean;
  invalidCount: number;
  onRunPrune: () => void;
};

/**
 * Section for pruning invalid connections
 */
export const ConnectionPruneSection = React.memo(function ConnectionPruneSection({
  hasConnections,
  invalidCount,
  onRunPrune,
}: ConnectionPruneSectionProps): React.ReactElement {
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleClick = React.useEffectEvent(() => {
    setIsProcessing(true);
    try {
      onRunPrune();
    } finally {
      setIsProcessing(false);
    }
  });

  const pruneLabel = t("pruneInvalidConnections") ?? "Prune Invalid";
  const runLabel = t("pruneInvalidConnectionsRun") ?? "Run";
  const statusLabel = invalidCount > 0
    ? (t("pruneInvalidConnectionsCount", { count: invalidCount }) ?? `${invalidCount} invalid`)
    : (t("pruneInvalidConnectionsNone") ?? "None found");

  return (
    <InspectorDefinitionItem label={pruneLabel} description={statusLabel}>
      <InspectorButton
        onClick={handleClick}
        disabled={isProcessing || !hasConnections || invalidCount === 0}
        variant={invalidCount > 0 ? "danger" : "secondary"}
      >
        {runLabel}
      </InspectorButton>
    </InspectorDefinitionItem>
  );
});
