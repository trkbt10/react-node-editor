/**
 * @file Example component showcasing the Figma-inspired theme.
 */
import * as React from "react";
import { NodeEditor } from "../../../../../NodeEditor";
import type { NodeEditorData } from "../../../../../types/core";
import { ExampleLayout } from "../../../shared/parts/ExampleLayout";
import { ExampleWrapper } from "../../../shared/parts/ExampleWrapper";
import { createInitialData, getUntypedNodeDefinitions } from "./nodes";
import { applyTheme } from "../../../../themes/registry";

export const FigmaThemeExample: React.FC = () => {
  const [data, setData] = React.useState<NodeEditorData>(() => createInitialData());

  React.useEffect(() => {
    applyTheme("figma");
  }, []);

  return (
    <ExampleLayout>
      <ExampleWrapper>
        <NodeEditor data={data} onDataChange={setData} nodeDefinitions={getUntypedNodeDefinitions()} />
      </ExampleWrapper>
    </ExampleLayout>
  );
};

export default FigmaThemeExample;
