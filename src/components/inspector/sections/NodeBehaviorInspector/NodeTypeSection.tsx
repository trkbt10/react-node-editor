/**
 * @file Node type section for inspector (read-only)
 */
import * as React from "react";
import type { Node } from "../../../../types/core";
import { InspectorLabel } from "../../parts/InspectorLabel";
import { ReadOnlyField } from "../../parts/ReadOnlyField";

type NodeTypeSectionProps = {
  node: Node;
};

/**
 * Section displaying node type (read-only)
 */
export function NodeTypeSection({ node }: NodeTypeSectionProps): React.ReactElement {
  return (
    <div>
      <InspectorLabel>Type</InspectorLabel>
      <ReadOnlyField>{node.type}</ReadOnlyField>
    </div>
  );
}
