/**
 * @file Auto layout panel component
 */
import * as React from "react";
import { useNodeEditor } from "../../../contexts/node-editor";
import { useNodeCanvas } from "../../../contexts/NodeCanvasContext";
import { useTranslation } from "../../../i18n";
import { InspectorDefinitionList, InspectorDefinitionItem } from "../parts/InspectorDefinitionList";
import { InspectorButton } from "../parts/InspectorButton";
import {
  calculateAutoLayout,
  calculateHierarchicalLayout,
  calculateGridLayout,
  calculateNodesBoundingBox,
} from "../../../contexts/node-editor/utils/autoLayout";

type LayoutAlgorithm = "hierarchical" | "grid" | "force";

/**
 * Panel for auto-layout functionality
 */
export const AutoLayoutPanel: React.FC = () => {
  const { state, dispatch, actions } = useNodeEditor();
  const { state: canvasState, actions: canvasActions } = useNodeCanvas();
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleAutoLayout = React.useCallback(
    (algorithm: LayoutAlgorithm) => {
      setIsProcessing(true);
      try {
        let result;

        switch (algorithm) {
          case "hierarchical":
            result = calculateHierarchicalLayout(state);
            break;
          case "grid":
            result = calculateGridLayout(state);
            break;
          case "force":
          default:
            result = calculateAutoLayout(state);
            break;
        }

        // Update all node positions using moveNodes for better performance
        dispatch(actions.moveNodes(result.nodePositions));

        // Calculate bounding box of all nodes after layout
        const nodes = Object.values(state.nodes);
        const bbox = calculateNodesBoundingBox(nodes, result.nodePositions);

        // Adjust viewport to fit all nodes with some padding
        if (bbox.width > 0 && bbox.height > 0) {
          // Center the bounding box in the viewport
          const viewportCenterX = window.innerWidth / 2;
          const viewportCenterY = window.innerHeight / 2;

          // Calculate offset to center the nodes' bounding box center
          const newOffsetX = viewportCenterX - bbox.centerX * canvasState.viewport.scale;
          const newOffsetY = viewportCenterY - bbox.centerY * canvasState.viewport.scale;

          canvasActions.setViewport({
            offset: { x: newOffsetX, y: newOffsetY },
            scale: canvasState.viewport.scale,
          });
        }
      } catch (error) {
        console.error("Auto-layout failed:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [state, dispatch, actions, canvasState.viewport.scale, canvasActions],
  );

  const nodeCount = Object.keys(state.nodes).length;

  return (
    <>
      <InspectorDefinitionList>
        <InspectorDefinitionItem label={t("autoLayoutPanelPrimaryHint")}>
          <InspectorButton
            onClick={() => handleAutoLayout("hierarchical")}
            disabled={isProcessing || nodeCount === 0}
            variant="secondary"
          >
            {t("autoLayoutPanelRun")}
          </InspectorButton>
        </InspectorDefinitionItem>
      </InspectorDefinitionList>
    </>
  );
};

AutoLayoutPanel.displayName = "AutoLayoutPanel";
