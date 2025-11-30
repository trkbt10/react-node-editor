/**
 * @file Node content section for inspector
 */
import * as React from "react";
import type { Node } from "../../../types/core";
import { InspectorLabel } from "../../inspector/parts/InspectorLabel";
import { InspectorTextarea } from "../../inspector/parts/InspectorTextarea";
import { useI18n } from "../../../i18n/context";

type NodeContentSectionProps = {
  node: Node;
  onContentChange: (content: string) => void;
};

/**
 * Section for editing node content
 * Renders nothing if node has no content field
 */
export function NodeContentSection({
  node,
  onContentChange,
}: NodeContentSectionProps): React.ReactElement | null {
  const { t } = useI18n();

  const handleChange = React.useEffectEvent((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
  });

  if (node.data.content === undefined) {
    return null;
  }

  return (
    <div>
      <InspectorLabel>{t("fieldContent") || "Content"}</InspectorLabel>
      <InspectorTextarea
        id={`node-${node.id}-content`}
        name="nodeContent"
        value={String(node.data.content) || ""}
        onChange={handleChange}
      />
    </div>
  );
}
