import * as React from "react";
import { useNodeEditor } from "../../../contexts/node-editor";
import { useNodeCanvas } from "../../../contexts/NodeCanvasContext";
import { Button } from "../../elements";
import { InspectorDefinitionList, InspectorDefinitionItem, PropertySection } from "../parts";
import { calculateAutoLayout, calculateHierarchicalLayout, calculateGridLayout, calculateNodesBoundingBox } from "../../../utils/autoLayout";
import styles from "./AutoLayoutPanel.module.css";

export type AutoLayoutPanelProps = {
  className?: string;
}

type LayoutAlgorithm = "hierarchical" | "grid" | "force";

/**
 * Panel for auto-layout functionality
 */
export const AutoLayoutPanel: React.FC<AutoLayoutPanelProps> = ({ className }) => {
  const { state, dispatch, actions } = useNodeEditor();
  const { state: canvasState, actions: canvasActions } = useNodeCanvas();
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
    [state, dispatch, actions, canvasState.viewport.scale, canvasActions]
  );

  const nodeCount = Object.keys(state.nodes).length;

  return (
    <PropertySection
      title="Auto Layout"
      className={className}
      headerRight={
        <span className={styles.nodeCount}>
          {nodeCount > 0 ? `${nodeCount} nodes` : "No nodes"}
        </span>
      }
    >
      <div className={styles.description}>
        自動レイアウト機能を使用して、ノードを整列させます。
      </div>

      <InspectorDefinitionList>
        <InspectorDefinitionItem
          label="階層レイアウト"
          description="ノードを階層構造に基づいて整列します。フローやツリー構造に最適です。"
        >
          <Button
            onClick={() => handleAutoLayout("hierarchical")}
            disabled={isProcessing || nodeCount === 0}
            variant="secondary"
          >
            実行
          </Button>
        </InspectorDefinitionItem>

        <InspectorDefinitionItem
          label="グリッドレイアウト"
          description="ノードを均等なグリッド状に整列します。"
        >
          <Button
            onClick={() => handleAutoLayout("grid")}
            disabled={isProcessing || nodeCount === 0}
            variant="secondary"
          >
            実行
          </Button>
        </InspectorDefinitionItem>

        <InspectorDefinitionItem
          label="力学的レイアウト"
          description="物理シミュレーションを使用してノードを配置します。接続されたノードが近くに配置されます。"
        >
          <Button
            onClick={() => handleAutoLayout("force")}
            disabled={isProcessing || nodeCount === 0}
            variant="secondary"
          >
            実行
          </Button>
        </InspectorDefinitionItem>
      </InspectorDefinitionList>
    </PropertySection>
  );
};

AutoLayoutPanel.displayName = "AutoLayoutPanel";
