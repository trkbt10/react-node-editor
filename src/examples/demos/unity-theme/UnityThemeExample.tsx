/**
 * @file Example component showcasing the Unity-inspired theme.
 */
import * as React from "react";
import { NodeEditor } from "../../../NodeEditor";
import type { NodeEditorData } from "../../../types/core";
import { ExampleLayout } from "../parts/ExampleLayout";
import { ExampleHeader } from "../parts/ExampleHeader";
import { ExampleWrapper } from "../parts/ExampleWrapper";
import { createInitialData, getUntypedNodeDefinitions } from "./nodes";
import { applyTheme } from "../../themes/registry";

export const UnityThemeExample: React.FC = () => {
  const [data, setData] = React.useState<NodeEditorData>(() => createInitialData());

  React.useEffect(() => {
    applyTheme("unity");
  }, []);

  return (
    <ExampleLayout
      header={
        <ExampleHeader
          title="Unity Theme Example"
          description="Professional dark theme inspired by Unity Editor's interface design."
        />
      }
    >
      <ExampleWrapper>
        <NodeEditor data={data} onDataChange={setData} nodeDefinitions={getUntypedNodeDefinitions()} />
      </ExampleWrapper>
    </ExampleLayout>
  );
};

export default UnityThemeExample;
