/**
 * @file NodeCanvas component
 */
import * as React from "react";
import { CanvasBase } from "./CanvasBase";
import { ConnectionLayer } from "../connection/ConnectionLayer";
import { NodeLayer } from "../node/NodeLayer";
import { useNodeEditor } from "../../contexts/node-editor";

export type NodeCanvasProps = {
  showGrid?: boolean;
  doubleClickToEdit?: boolean;
}

/**
 * NodeCanvas component that renders the canvas base, connection layer, and node layer.
 * Port positions and configuration should be provided via PortPositionProvider context.
 * Settings like showGrid and doubleClickToEdit are retrieved from NodeEditorContext if not provided.
 */
export const NodeCanvas: React.FC<NodeCanvasProps> = ({
  showGrid: showGridProp,
  doubleClickToEdit: doubleClickToEditProp,
}) => {
  const { settings } = useNodeEditor();

  const showGrid = showGridProp ?? settings.showGrid;
  const doubleClickToEdit = doubleClickToEditProp ?? settings.doubleClickToEdit;

  return (
    <CanvasBase showGrid={showGrid}>
      <ConnectionLayer />
      <NodeLayer doubleClickToEdit={doubleClickToEdit} />
    </CanvasBase>
  );
};
