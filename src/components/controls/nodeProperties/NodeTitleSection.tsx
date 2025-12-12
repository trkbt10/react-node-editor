/**
 * @file Node title section for inspector
 */
import * as React from "react";
import type { Node } from "../../../types/core";
import { InspectorLabel } from "../../inspector/parts/InspectorLabel";
import { InspectorInput } from "../../inspector/parts/InspectorInput";
import { useI18n } from "../../../i18n/context";

type NodeTitleSectionProps = {
  node: Node;
  onTitleChange: (title: string) => void;
};

/**
 * Section for editing node title
 */
export function NodeTitleSection({ node, onTitleChange }: NodeTitleSectionProps): React.ReactElement {
  const { t } = useI18n();

  const handleChange = React.useEffectEvent((e: React.ChangeEvent<HTMLInputElement>) => {
    onTitleChange(e.target.value);
  });

  return (
    <div>
      <InspectorLabel>{t("fieldTitle") || "Title"}</InspectorLabel>
      <InspectorInput
        id={`node-${node.id}-title`}
        name="nodeTitle"
        value={node.data.title || ""}
        onChange={handleChange}
      />
    </div>
  );
}
