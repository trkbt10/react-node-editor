/**
 * @file Auto-layout section with strategy selection
 */
import * as React from "react";
import { useI18n } from "../../../i18n/context";
import { InspectorButton } from "../../inspector/parts/InspectorButton";
import { InspectorDefinitionItem } from "../../inspector/parts/InspectorDefinitionList";
import { InspectorSelect } from "../../inspector/parts/InspectorSelect";
import type { LayoutAlgorithm } from "../../../contexts/composed/node-editor/utils/autoLayout";

type AutoLayoutSectionProps = {
  hasNodes: boolean;
  selectedStrategy: LayoutAlgorithm;
  onStrategyChange: (strategy: LayoutAlgorithm) => void;
  onRunAutoLayout: () => void;
};

const LAYOUT_STRATEGIES: LayoutAlgorithm[] = ["auto", "force", "hierarchical", "tree", "grid"];

/**
 * Section for auto-layout with strategy selector
 */
export const AutoLayoutSection = React.memo(function AutoLayoutSection({
  hasNodes,
  selectedStrategy,
  onStrategyChange,
  onRunAutoLayout,
}: AutoLayoutSectionProps): React.ReactElement {
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleClick = React.useEffectEvent(() => {
    setIsProcessing(true);
    try {
      onRunAutoLayout();
    } finally {
      setIsProcessing(false);
    }
  });

  const handleStrategyChange = React.useEffectEvent((e: React.ChangeEvent<HTMLSelectElement>) => {
    onStrategyChange(e.target.value as LayoutAlgorithm);
  });

  const strategyOptions = React.useMemo(() => {
    const getStrategyLabel = (strategy: LayoutAlgorithm): string => {
      switch (strategy) {
        case "auto":
          return t("autoLayoutStrategyAuto") ?? "Auto (detect)";
        case "force":
          return t("autoLayoutStrategyForce") ?? "Force-directed";
        case "hierarchical":
          return t("autoLayoutStrategyHierarchical") ?? "Hierarchical";
        case "tree":
          return t("autoLayoutStrategyTree") ?? "Tree";
        case "grid":
          return t("autoLayoutStrategyGrid") ?? "Grid";
        default:
          return strategy;
      }
    };

    return LAYOUT_STRATEGIES.map((strategy) => ({
      value: strategy,
      label: getStrategyLabel(strategy),
    }));
  }, [t]);

  const strategyLabel = t("autoLayoutStrategy") ?? "Strategy";
  const autoLayoutLabel = t("autoLayout");
  const runLabel = t("autoLayoutPanelRun");

  return (
    <>
      <InspectorDefinitionItem label={strategyLabel}>
        <InspectorSelect value={selectedStrategy} onChange={handleStrategyChange} disabled={!hasNodes}>
          {strategyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </InspectorSelect>
      </InspectorDefinitionItem>
      <InspectorDefinitionItem label={autoLayoutLabel}>
        <InspectorButton onClick={handleClick} disabled={isProcessing || !hasNodes}>
          {runLabel}
        </InspectorButton>
      </InspectorDefinitionItem>
    </>
  );
});
