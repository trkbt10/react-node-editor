/**
 * @file Example component showcasing custom connection rendering with bezier handles.
 */
import * as React from "react";
import { NodeEditor } from "../../../../../NodeEditor";
import type { NodeEditorData } from "../../../../../types/core";
import { ExampleLayout } from "../../../shared/parts/ExampleLayout";
import { ExampleWrapper } from "../../../shared/parts/ExampleWrapper";
import { createInitialData, getUntypedNodeDefinitions } from "./nodes";
import styles from "./CustomConnectorExample.module.css";

export const CustomConnectorExample: React.FC = () => {
  const [data, setData] = React.useState<NodeEditorData>(() => createInitialData());

  return (
    <ExampleLayout>
      <ExampleWrapper>
        <div className={styles.content}>
          <aside className={styles.summaryPanel}>
            <h3 className={styles.summaryTitle}>What to watch</h3>
            <p className={styles.summaryLead}>
              Each connector spins up a transparent WebGL scene that rebuilds tube geometry from live bezier control
              points, projecting it into depth with exaggerated parallax and reactive glow.
            </p>
            <ul className={styles.summaryList}>
              <li>Holographic tubes grow thicker, brighter, and faster when a connection is hovered or selected.</li>
              <li>Custom Catmull-Rom samples convert 2D port offsets into a 3D path with orbital lighting.</li>
              <li>Pulse timing and bloom intensity react to editor interaction state without breaking hit targets.</li>
            </ul>
            <p className={styles.legend}>
              <strong>Legend:</strong>
              Cyan beam — volumetric conduit core
              <br />
              Emerald — arc handles / lighting anchors
              <br />
              Ember — source / destination energy wells
              <br />
              Magenta — curvature spark intensity marker
            </p>
          </aside>
          <div className={styles.editorPanel}>
            <div className={styles.editorSurface}>
              <NodeEditor data={data} onDataChange={setData} nodeDefinitions={getUntypedNodeDefinitions()} />
              <div className={styles.editorOverlay}>
                <div className={styles.overlayGradient} />
                <div className={styles.overlayFooter}>
                  <div className={styles.swatchRow}>
                    <span className={styles.swatch} />
                    <span>Cyan conduit core</span>
                  </div>
                  <div className={styles.swatchRow}>
                    <span className={`${styles.swatch} ${styles.swatchHandle}`} />
                    <span>Emerald bezier handles</span>
                  </div>
                  <div className={styles.swatchRow}>
                    <span className={`${styles.swatch} ${styles.swatchAnchor}`} />
                    <span>Ember anchors</span>
                  </div>
                  <div className={styles.swatchRow}>
                    <span className={`${styles.swatch} ${styles.swatchSpark}`} />
                    <span>Magenta curvature pulse</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ExampleWrapper>
    </ExampleLayout>
  );
};

export default CustomConnectorExample;

/**
 * Debug notes:
 * - Reviewed src/components/connection/ConnectionView.tsx to ensure the custom renderer preserves pointer handlers and selection state.
 * - Reviewed src/types/NodeDefinition.ts to double-check ConnectionRenderContext fields for handle positioning.
 */
