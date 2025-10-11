import * as React from "react";
import { useNodeEditor } from "../../contexts/node-editor";
import { Button } from "../elements";
import { InspectorDefinitionList, InspectorDefinitionItem } from "./parts";
import { calculateAutoLayout, calculateHierarchicalLayout, calculateGridLayout } from "../../utils/autoLayout";
import styles from "./FeatureFlagsPanel.module.css";

export type AutoLayoutPanelProps = {
  className?: string;
}

type LayoutAlgorithm = "hierarchical" | "grid" | "force";

/**
 * Panel for auto-layout functionality
 */
export const AutoLayoutPanel: React.FC<AutoLayoutPanelProps> = ({ className }) => {
  const { state, dispatch, actions } = useNodeEditor();
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

        // Update all node positions
        Object.entries(result.nodePositions).forEach(([nodeId, position]) => {
          dispatch(actions.moveNode(nodeId, position.x, position.y));
        });
      } catch (error) {
        console.error("Auto-layout failed:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [state, dispatch, actions]
  );

  const nodeCount = Object.keys(state.nodes).length;

  return (
    <div className={`${styles.panel} ${className || ""}`}>
      <div className={styles.content}>
        <div className={styles.description}>
          自動レイアウト機能を使用して、ノードを整列させます。
          {nodeCount > 0 ? `現在 ${nodeCount} 個のノードがあります。` : "ノードがありません。"}
        </div>

        <div className={styles.flags}>
          <InspectorDefinitionList className={styles.flagsList}>
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
        </div>
      </div>
    </div>
  );
};

AutoLayoutPanel.displayName = "AutoLayoutPanel";
