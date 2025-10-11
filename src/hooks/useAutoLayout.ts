import * as React from "react";
import { useNodeEditor } from "../contexts/node-editor";
import { useEditorActionState } from "../contexts/EditorActionStateContext";
import { calculateAutoLayout, calculateHierarchicalLayout, calculateGridLayout } from "../utils/autoLayout";

/**
 * Hook that provides auto layout functionality
 */
export const useAutoLayout = () => {
  const { state: nodeEditorState, dispatch: nodeEditorDispatch, actions: nodeEditorActions } = useNodeEditor();
  const { state: actionState } = useEditorActionState();

  const applyForceLayout = React.useCallback((selectedOnly: boolean = false) => {
    console.log('Applying force-directed layout');
    
    const nodesToLayout = selectedOnly 
      ? Object.fromEntries(
          Object.entries(nodeEditorState.nodes).filter(([nodeId]) => 
            actionState.selectedNodeIds.includes(nodeId)
          )
        )
      : nodeEditorState.nodes;

    const layoutData = {
      nodes: nodesToLayout,
      connections: nodeEditorState.connections,
    };

    const result = calculateAutoLayout(layoutData, {
      iterations: 150,
      springLength: 200,
      springStrength: 0.4,
      repulsionStrength: 2000,
      dampening: 0.85,
    });

    if (Object.keys(result.nodePositions).length > 0) {
      nodeEditorDispatch(nodeEditorActions.moveNodes(result.nodePositions));
    }
  }, [nodeEditorState, actionState.selectedNodeIds, nodeEditorDispatch, nodeEditorActions]);

  const applyHierarchicalLayout = React.useCallback((selectedOnly: boolean = false) => {
    console.log('Applying hierarchical layout');
    
    const nodesToLayout = selectedOnly 
      ? Object.fromEntries(
          Object.entries(nodeEditorState.nodes).filter(([nodeId]) => 
            actionState.selectedNodeIds.includes(nodeId)
          )
        )
      : nodeEditorState.nodes;

    const layoutData = {
      nodes: nodesToLayout,
      connections: nodeEditorState.connections,
    };

    const result = calculateHierarchicalLayout(layoutData, {
      spacing: 250,
      layerHeight: 200,
    });

    if (Object.keys(result.nodePositions).length > 0) {
      nodeEditorDispatch(nodeEditorActions.moveNodes(result.nodePositions));
    }
  }, [nodeEditorState, actionState.selectedNodeIds, nodeEditorDispatch, nodeEditorActions]);

  const applyGridLayout = React.useCallback((selectedOnly: boolean = false) => {
    console.log('Applying grid layout');
    
    const nodesToLayout = selectedOnly 
      ? Object.fromEntries(
          Object.entries(nodeEditorState.nodes).filter(([nodeId]) => 
            actionState.selectedNodeIds.includes(nodeId)
          )
        )
      : nodeEditorState.nodes;

    const layoutData = {
      nodes: nodesToLayout,
      connections: nodeEditorState.connections,
    };

    const result = calculateGridLayout(layoutData, {
      spacing: 250,
      columns: Math.ceil(Math.sqrt(Object.keys(nodesToLayout).length)),
    });

    if (Object.keys(result.nodePositions).length > 0) {
      nodeEditorDispatch(nodeEditorActions.moveNodes(result.nodePositions));
    }
  }, [nodeEditorState, actionState.selectedNodeIds, nodeEditorDispatch, nodeEditorActions]);

  const applyLayout = React.useCallback((
    layoutType: "force" | "hierarchical" | "grid", 
    selectedOnly: boolean = false
  ) => {
    switch (layoutType) {
      case "force":
        applyForceLayout(selectedOnly);
        break;
      case "hierarchical":
        applyHierarchicalLayout(selectedOnly);
        break;
      case "grid":
        applyGridLayout(selectedOnly);
        break;
      default:
        console.warn(`Unknown layout type: ${layoutType}`);
    }
  }, [applyForceLayout, applyHierarchicalLayout, applyGridLayout]);

  return {
    applyLayout,
    applyForceLayout,
    applyHierarchicalLayout,
    applyGridLayout,
  };
};
