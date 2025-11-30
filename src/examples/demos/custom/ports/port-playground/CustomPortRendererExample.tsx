/**
 * @file Example component showcasing advanced custom port rendering.
 */
import * as React from "react";
import { NodeEditor } from "../../../../../NodeEditor";
import type { NodeEditorData } from "../../../../../types/core";
import { createInitialData, getUntypedNodeDefinitions } from "./nodes";
import { ExampleLayout } from "../../../shared/parts/ExampleLayout";
import { ExampleWrapper } from "../../../shared/parts/ExampleWrapper";
import styles from "./CustomPortRendererExample.module.css";

export const CustomPortRendererExample: React.FC = () => {
  const [data, setData] = React.useState<NodeEditorData>(() => createInitialData());

  return (
    <ExampleLayout>
      <ExampleWrapper>
        <div className={styles.content}>
          <aside className={styles.summaryPanel}>
            <p className={styles.summaryLead}>
              Explore how the port and connection render hooks allow you to ship opinionated visual systems without
              losing live editor ergonomics.
            </p>
            <ul className={styles.summaryList}>
              <li>Radial gauges respond to connection count and hover states in real time.</li>
              <li>Directional badges and port labels stay aligned as nodes move or resize.</li>
              <li>Connections blend gradients, halos, and overlays while respecting selection feedback.</li>
            </ul>
          </aside>
          <div className={styles.editorPanel}>
            <div className={styles.editorSurface}>
              <NodeEditor data={data} onDataChange={setData} nodeDefinitions={getUntypedNodeDefinitions()} />
            </div>
          </div>
        </div>
      </ExampleWrapper>
    </ExampleLayout>
  );
};

export default CustomPortRendererExample;

/**
 * Debug notes:
 * - Reviewed src/components/connection/ConnectionView.tsx to understand how custom renderers receive real-time position updates and pointer handlers.
 * - Reviewed src/types/NodeDefinition.ts to validate the ConnectionRenderContext and PortRenderContext fields used during custom rendering.
 */
