/**
 * @file Inspector palette drag-and-drop example using the default grid layout
 */
import * as React from "react";
import { NodeEditor, type GridLayoutConfig, type LayerDefinition } from "../../index";
import { NodePalettePanel } from "../../components/inspector/renderers/NodePalettePanel";
import { defaultEditorGridConfig, defaultEditorGridLayers } from "../../config/defaultLayout";

export const InspectorPaletteDnDExample: React.FC = () => {
  const gridConfig = React.useMemo<GridLayoutConfig>(
    () => ({
      ...defaultEditorGridConfig,
      style: { height: "100vh", width: "100vw" },
    }),
    [],
  );

  const paletteLayer = React.useMemo<LayerDefinition>(
    () => ({
      id: "node-library-overlay",
      component: (
        <div role="complementary" aria-label="Node library palette">
          <NodePalettePanel />
        </div>
      ),
      positionMode: "fixed",
      position: { top: 96, right: 24 },
      zIndex: 10,
      pointerEvents: "auto",
      draggable: true,
      style: {
        width: "min(340px, calc(100vw - 48px))",
        minWidth: "260px",
        maxHeight: "calc(100vh - 136px)",
        overflow: "auto",
        background: "var(--node-editor-panel-background, var(--node-editor-control-background))",
        border: "var(--node-editor-input-border)",
        borderRadius: "var(--node-editor-card-border-radius)",
        boxShadow: "var(--node-editor-dialog-box-shadow)",
        padding: "var(--node-editor-space-lg)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      },
    }),
    [],
  );

  const layers = React.useMemo(() => [...defaultEditorGridLayers, paletteLayer], [paletteLayer]);

  return (
    <NodeEditor gridConfig={gridConfig} gridLayers={layers} />
  );
};
