/**
 * @file Example component showcasing the Adobe-inspired theme.
 */
import * as React from "react";
import { NodeEditor } from "../../../NodeEditor";
import type { NodeEditorData } from "../../../types/core";
import { ExampleLayout } from "../parts/ExampleLayout";
import { ExampleHeader } from "../parts/ExampleHeader";
import { ExampleWrapper } from "../parts/ExampleWrapper";
import { createInitialData, getUntypedNodeDefinitions } from "./nodes";
import { applyTheme } from "../../themes/registry";

export const AdobeThemeExample: React.FC = () => {
  const [data, setData] = React.useState<NodeEditorData>(() => createInitialData());

  React.useEffect(() => {
    applyTheme("adobe");
  }, []);

  return (
    <ExampleLayout
      header={
        <ExampleHeader
          title="Adobe Theme Example"
          description="Sleek dark interface inspired by Adobe Creative Cloud applications."
        />
      }
    >
      <ExampleWrapper>
        <NodeEditor data={data} onDataChange={setData} nodeDefinitions={getUntypedNodeDefinitions()} />
      </ExampleWrapper>
    </ExampleLayout>
  );
};

export default AdobeThemeExample;
