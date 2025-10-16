/**
 * @file Example component showcasing the Figma-inspired theme.
 */
import * as React from "react";
import { NodeEditor } from "../../../NodeEditor";
import type { NodeEditorData } from "../../../types/core";
import { ExampleLayout } from "../parts/ExampleLayout";
import { ExampleHeader } from "../parts/ExampleHeader";
import { ExampleWrapper } from "../parts/ExampleWrapper";
import { createInitialData, getUntypedNodeDefinitions } from "./nodes";
import { applyTheme } from "../../themes/registry";

export const FigmaThemeExample: React.FC = () => {
  const [data, setData] = React.useState<NodeEditorData>(() => createInitialData());

  React.useEffect(() => {
    applyTheme("figma");
  }, []);

  return (
    <ExampleLayout
      header={
        <ExampleHeader
          title="Figma Theme Example"
          description="Clean light interface inspired by Figma's design tool aesthetic."
        />
      }
    >
      <ExampleWrapper>
        <NodeEditor data={data} onDataChange={setData} nodeDefinitions={getUntypedNodeDefinitions()} />
      </ExampleWrapper>
    </ExampleLayout>
  );
};

export default FigmaThemeExample;
