/**
 * @file NodeCanvas component
 */
import * as React from "react";
import { CanvasBase, type CanvasNodeDropEvent } from "./CanvasBase";
import { ConnectionLayer } from "../connection/ConnectionLayer";
import { NodeLayer } from "../node/NodeLayer";
import { useNodeEditor } from "../../contexts/node-editor/context";
import { useNodeDefinitionList } from "../../contexts/node-definitions/hooks/useNodeDefinitionList";
import { buildNodeFromDefinition } from "../../contexts/node-editor/utils/nodeFactory";
import { canAddNodeType, countNodesByType } from "../../contexts/node-definitions/utils/nodeTypeLimits";

export type NodeCanvasProps = {
  showGrid?: boolean;
  doubleClickToEdit?: boolean;
};

/**
 * NodeCanvas component that renders the canvas base, connection layer, and node layer.
 * Port positions and configuration should be provided via PortPositionProvider context.
 * Settings like showGrid and doubleClickToEdit are retrieved from NodeEditorContext if not provided.
 */
export const NodeCanvas: React.FC<NodeCanvasProps> = ({
  showGrid: showGridProp,
  doubleClickToEdit: doubleClickToEditProp,
}) => {
  const { settings, state, actions } = useNodeEditor();
  const nodeDefinitions = useNodeDefinitionList();

  const showGrid = showGridProp ?? settings.showGrid;
  const doubleClickToEdit = doubleClickToEditProp ?? settings.doubleClickToEdit;

  const nodeTypeCounts = React.useMemo(() => countNodesByType(state), [state]);

  const handleNodeDrop = React.useCallback(
    (event: CanvasNodeDropEvent) => {
      const nodeDefinition = nodeDefinitions.find((definition) => definition.type === event.nodeType);
      if (!nodeDefinition) {
        return;
      }

      if (!canAddNodeType(event.nodeType, nodeDefinitions, nodeTypeCounts)) {
        return;
      }

      const newNode = buildNodeFromDefinition({ nodeDefinition, canvasPosition: event.canvasPosition });
      actions.addNodeWithId(newNode);
    },
    [actions, nodeDefinitions, nodeTypeCounts],
  );

  return (
    <CanvasBase showGrid={showGrid} onNodeDrop={handleNodeDrop}>
      <ConnectionLayer />
      <NodeLayer doubleClickToEdit={doubleClickToEdit} />
    </CanvasBase>
  );
};

/**
 * Debug notes:
 * - Reviewed src/NodeEditorContent.tsx to reuse node creation defaults and enforce per-flow limits when handling canvas drops.
 * - Reviewed src/components/shared/NodeSearchMenu.tsx after refactoring to keep inspector palette grouping consistent with context menu results.
 */
