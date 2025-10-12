import * as React from "react";
import type { Node } from "../../../types/core";
import { useNodeEditor } from "../../../contexts/node-editor";
import { useEditorActionState } from "../../../contexts/EditorActionStateContext";
import { useNodeDefinition } from "../../../contexts/NodeDefinitionContext";
import { useExternalDataRef } from "../../../contexts/ExternalDataContext";
import { useExternalData } from "../../../hooks/useExternalData";
import { NodeBehaviorInspector, NodeActionsBehaviorInspector, GroupBehaviorInspector } from "./";
import styles from "./NodeInspector.module.css";
import { calculateAlignmentPositions, type AlignmentActionType } from "../../controls/alignments";
import { getBehaviors, behaviorArrayIncludes } from "../../../types/behaviors";

export type NodeInspectorProps = {
  node: Node;
}

export const NodeInspector: React.FC<NodeInspectorProps> = React.memo(
  ({ node }) => {
    const { state: nodeEditorState, dispatch: nodeEditorDispatch, actions: nodeEditorActions } = useNodeEditor();
    const { state: actionState } = useEditorActionState();
    const nodeDefinition = useNodeDefinition(node.type);
    const externalDataRef = useExternalDataRef(node.id);
    const externalDataState = useExternalData(node, externalDataRef);
    // Handle node updates - Memoized to prevent recreation on every render
    const handleUpdateNode = React.useCallback(
      (updates: Partial<Node>) => {
        nodeEditorDispatch(nodeEditorActions.updateNode(node.id, updates));
      },
      [node.id, nodeEditorDispatch, nodeEditorActions]
    );

    // Handle external data updates
    const handleUpdateExternalData = React.useCallback(
      async (data: unknown) => {
        if (externalDataState.update) {
          await externalDataState.update(data);
        }
      },
      [externalDataState.update]
    );

    // Handle node deletion
    const handleDeleteNode = React.useCallback(() => {
      nodeEditorDispatch(nodeEditorActions.deleteNode(node.id));
    }, [node.id, nodeEditorDispatch, nodeEditorActions]);

    // Get all selected nodes for alignment
    const selectedNodes = actionState.selectedNodeIds.map((id) => nodeEditorState.nodes[id]).filter(Boolean);

    // Handle alignment operations
    const handleAlignNodes = React.useCallback(
      (alignmentType: AlignmentActionType, nodes: Node[]) => {
        const positionUpdates = calculateAlignmentPositions(nodes, alignmentType);
        if (Object.keys(positionUpdates).length > 0) {
          nodeEditorDispatch(nodeEditorActions.moveNodes(positionUpdates));
        }
      },
      [nodeEditorDispatch, nodeEditorActions]
    );

    // Inspector render props - Only recreate when dependencies actually change
    const inspectorProps = React.useMemo(
      () => ({
        node,
        externalData: externalDataState.data,
        isLoadingExternalData: externalDataState.isLoading,
        externalDataError: externalDataState.error,
        onUpdateNode: handleUpdateNode,
        onUpdateExternalData: handleUpdateExternalData,
        onDeleteNode: handleDeleteNode,
        selectedNodes,
        onAlignNodes: handleAlignNodes,
      }),
      [
        node,
        externalDataState.data,
        externalDataState.isLoading,
        externalDataState.error,
        handleUpdateNode,
        handleUpdateExternalData,
        handleDeleteNode,
        selectedNodes,
        handleAlignNodes,
      ]
    );
    const behaviors = React.useMemo(() => {
      return getBehaviors(nodeDefinition);
    }, [nodeDefinition]);

    // Check if a function is likely a React component (by naming convention)
    const isReactComponent = React.useCallback((fn: Function): boolean => {
      // React components should start with an uppercase letter
      return /^[A-Z]/.test(fn.name || '');
    }, []);

    // Render custom inspector with proper component handling
    const customInspectorElement = React.useMemo(() => {
      if (!nodeDefinition?.renderInspector) {return null;}

      const renderFn = nodeDefinition.renderInspector;

      // If it looks like a React component (starts with uppercase), use as JSX
      // This allows hooks to work correctly
      if (isReactComponent(renderFn)) {
        const CustomInspector = renderFn;
        return <CustomInspector {...inspectorProps} />;
      }

      // Otherwise, call as a regular function (legacy support)
      return renderFn(inspectorProps);
    }, [nodeDefinition?.renderInspector, inspectorProps, isReactComponent]);

    return (
      <>
        {/* Custom inspector (node-specific) */}
        {customInspectorElement && (
          <div className={styles.customInspectorBlock}>
            {customInspectorElement}
          </div>
        )}

        {/* Behavior-based inspectors */}
        {behaviorArrayIncludes(behaviors, "node") && (
          <div className={styles.customInspectorBlock}>
            <NodeBehaviorInspector {...inspectorProps} />
          </div>
        )}

        {behaviorArrayIncludes(behaviors, "node") && (
          <div className={styles.customInspectorBlock}>
            <NodeActionsBehaviorInspector {...inspectorProps} />
          </div>
        )}

        {behaviorArrayIncludes(behaviors, "group") && (
          <div className={styles.customInspectorBlock}>
            <GroupBehaviorInspector {...inspectorProps} />
          </div>
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo
    // Only re-render if the node ID changes or critical node properties change
    return (
      prevProps.node.id === nextProps.node.id &&
      prevProps.node.type === nextProps.node.type &&
      prevProps.node.data === nextProps.node.data &&
      prevProps.node.position === nextProps.node.position &&
      prevProps.node.locked === nextProps.node.locked &&
      prevProps.node.visible === nextProps.node.visible
    );
  }
);

NodeInspector.displayName = "NodeInspector";
