/**
 * @file Auto-layout section
 */
import * as React from "react";
import { useI18n } from "../../../../i18n/context";
import { InspectorButton } from "../../parts/InspectorButton";
import { InspectorDefinitionItem } from "../../parts/InspectorDefinitionList";

type AutoLayoutSectionProps = {
  hasNodes: boolean;
  onRunAutoLayout: () => void;
};

/**
 * Section for auto-layout button
 */
export function AutoLayoutSection({
  hasNodes,
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

  return (
    <InspectorDefinitionItem label={t("autoLayout")}>
      <InspectorButton onClick={handleClick} disabled={isProcessing || !hasNodes}>
        {t("autoLayoutPanelRun")}
      </InspectorButton>
    </InspectorDefinitionItem>
  );
}
