/**
 * @file Hook for handling node drag interactions.
 */
import * as React from "react";
import { useEditorActionState } from "../../../contexts/EditorActionStateContext";
import { useNodeCanvas } from "../../../contexts/NodeCanvasContext";
import { useNodeDefinitionList } from "../../../contexts/node-definitions/hooks/useNodeDefinitionList";
import { useNodeEditor } from "../../../contexts/node-editor/context";
import { snapMultipleToGrid } from "../../../contexts/node-editor/utils/gridSnap";
import { calculateNewPositions, handleGroupMovement } from "../../../contexts/node-editor/utils/nodeDragHelpers";
import type { UseGroupManagementResult } from "../../../hooks/useGroupManagement";

export const useNodeLayerDrag = (moveGroupWithChildren: UseGroupManagementResult["moveGroupWithChildren"]) => {
  const { state: actionState, actions: actionActions } = useEditorActionState();
  const { state: nodeEditorState, actions: nodeEditorActions } = useNodeEditor();
  const { state: canvasState } = useNodeCanvas();
  const nodeDefinitions = useNodeDefinitionList();

  const handlePointerMove = React.useEffectEvent((event: PointerEvent) => {
    if (!actionState.dragState) {
      return;
    }
    const deltaX = (event.clientX - actionState.dragState.startPosition.x) / canvasState.viewport.scale;
    const deltaY = (event.clientY - actionState.dragState.startPosition.y) / canvasState.viewport.scale;

    actionActions.updateNodeDrag({ x: deltaX, y: deltaY });
  });

  const handlePointerUp = React.useEffectEvent(() => {
    if (!actionState.dragState) {
      return;
    }
    const { nodeIds, initialPositions, offset } = actionState.dragState;
    const newPositions = calculateNewPositions(nodeIds, initialPositions, offset);

    const snappedPositions = canvasState.gridSettings.snapToGrid
      ? snapMultipleToGrid(newPositions, canvasState.gridSettings, nodeIds[0])
      : newPositions;

    const finalPositions = handleGroupMovement(
      nodeIds,
      nodeEditorState.nodes,
      snappedPositions,
      initialPositions,
      moveGroupWithChildren,
      nodeDefinitions,
    );

    if (Object.keys(finalPositions).length > 0) {
      nodeEditorActions.moveNodes(finalPositions);
    }

    actionActions.endNodeDrag();
  });

  React.useEffect(() => {
    if (!actionState.dragState) {
      return;
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [actionState.dragState]);
};
