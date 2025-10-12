/**
 * @file Example component showcasing advanced custom port rendering.
 */
import * as React from "react";
import { NodeEditor } from "../../../NodeEditor";
import type { NodeEditorData } from "../../../types/core";
import { createInitialData, getUntypedNodeDefinitions } from "./nodes";
import styles from "./CustomPortRendererExample.module.css";

export const CustomPortRendererExample: React.FC = () => {
  const [data, setData] = React.useState<NodeEditorData>(() => createInitialData());

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Custom Port Renderer Example</h2>
      <p className={styles.description}>
        This example showcases the updated port layout pipeline, combining SVG layering and canvas-driven telemetry to
        render ports and connections with richer visual context.
      </p>
      <ul className={styles.list}>
        <li>
          Ports expose dynamic radial gauges that react to connection count, with clear IN / OUT orientation badges
        </li>
        <li>Canvas overlays draw live tick marks while SVG gradients highlight directional flow and data categories</li>
        <li>Connections render with multi-stop gradients, flowing energy bands, and data-specific overlays</li>
        <li>Custom renderers rely on provided layout context so visuals stay synchronized with live node movement</li>
      </ul>
      <NodeEditor data={data} onDataChange={setData} nodeDefinitions={getUntypedNodeDefinitions()} />
    </div>
  );
};

export default CustomPortRendererExample;

/**
 * Debug notes:
 * - Reviewed src/components/connection/ConnectionView.tsx to understand how custom renderers receive real-time position updates and pointer handlers.
 * - Reviewed src/types/NodeDefinition.ts to validate the ConnectionRenderContext and PortRenderContext fields used during custom rendering.
 */
