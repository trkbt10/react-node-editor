/**
 * @file Example component showcasing the Opal-inspired theme with custom renderers.
 */
import * as React from "react";
import { NodeEditor } from "../../../../../NodeEditor";
import type { NodeEditorData } from "../../../../../types/core";
import { ExampleLayout } from "../../../shared/parts/ExampleLayout";
import { ExampleWrapper } from "../../../shared/parts/ExampleWrapper";
import { createInitialData, getUntypedNodeDefinitions } from "./nodes";
import { applyTheme } from "../../../../themes/registry";

export const OpalThemeExample: React.FC = () => {
  const [data, setData] = React.useState<NodeEditorData>(() => createInitialData());

  React.useEffect(() => {
    applyTheme("opal");
  }, []);

  return (
    <ExampleLayout>
      <ExampleWrapper>
        <NodeEditor data={data} onDataChange={setData} nodeDefinitions={getUntypedNodeDefinitions()} />
      </ExampleWrapper>
    </ExampleLayout>
  );
};

export default OpalThemeExample;
