/**
 * @file Hook providing automatic node layout algorithms
 * Supports force-directed, hierarchical, tree, grid, and auto-selection
 */
import * as React from "react";
import { useNodeEditor } from "../context";
import { useNodeCanvas } from "../../canvas/viewport/context";
import { useEditorActionState } from "../../EditorActionStateContext";
import {
  calculateAutoLayout,
  calculateForceDirectedLayout,
  calculateHierarchicalLayout,
  calculateTreeLayout,
  calculateGridLayout,
  calculateNodesBoundingBox,
} from "../utils/autoLayout";
import type { LayoutAlgorithm, LayoutOptions, LayoutResult } from "../utils/autoLayout";

export type { LayoutAlgorithm, LayoutOptions, LayoutResult };

/**
 * Hook that provides auto layout functionality
 */
export const useAutoLayout = () => {
  const { state: nodeEditorState, actions: nodeEditorActions } = useNodeEditor();
  const { state: canvasState, actions: canvasActions } = useNodeCanvas();
  const { state: actionState } = useEditorActionState();

  /**
   * Apply layout result and adjust viewport
   */
  const applyLayoutResult = React.useCallback(
    (result: LayoutResult, nodesToLayout: Record<string, unknown>) => {
      if (Object.keys(result.nodePositions).length === 0) {
        return;
      }

      nodeEditorActions.moveNodes(result.nodePositions);

      // Adjust viewport to center the laid out nodes
      const nodes = Object.values(nodesToLayout) as Parameters<typeof calculateNodesBoundingBox>[0];
      const bbox = calculateNodesBoundingBox(nodes, result.nodePositions);

      if (bbox.width > 0 && bbox.height > 0) {
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;
        const newOffsetX = viewportCenterX - bbox.centerX * canvasState.viewport.scale;
        const newOffsetY = viewportCenterY - bbox.centerY * canvasState.viewport.scale;

        canvasActions.setViewport({
          offset: { x: newOffsetX, y: newOffsetY },
          scale: canvasState.viewport.scale,
        });
      }
    },
    [nodeEditorActions, canvasState.viewport.scale, canvasActions],
  );

  /**
   * Get nodes to layout based on selection
   */
  const getNodesToLayout = React.useCallback(
    (selectedOnly: boolean) => {
      return selectedOnly
        ? Object.fromEntries(
            Object.entries(nodeEditorState.nodes).filter(([nodeId]) =>
              actionState.selectedNodeIds.includes(nodeId),
            ),
          )
        : nodeEditorState.nodes;
    },
    [nodeEditorState.nodes, actionState.selectedNodeIds],
  );

  const applyForceLayout = React.useCallback(
    (selectedOnly: boolean = false) => {
      const nodesToLayout = getNodesToLayout(selectedOnly);
      const layoutData = {
        nodes: nodesToLayout,
        connections: nodeEditorState.connections,
      };

      const result = calculateForceDirectedLayout(layoutData, {
        iterations: 150,
        springLength: 200,
        springStrength: 0.4,
        repulsionStrength: 2000,
        dampening: 0.85,
        sizeAwareRepulsion: true,
        useBarnesHut: true,
        barnesHutTheta: 0.7,
      });

      applyLayoutResult(result, nodesToLayout);
      return result;
    },
    [getNodesToLayout, nodeEditorState.connections, applyLayoutResult],
  );

  const applyHierarchicalLayout = React.useCallback(
    (selectedOnly: boolean = false) => {
      const nodesToLayout = getNodesToLayout(selectedOnly);
      const layoutData = {
        nodes: nodesToLayout,
        connections: nodeEditorState.connections,
      };

      const result = calculateHierarchicalLayout(layoutData, {
        direction: "TB",
        layerSpacing: 200,
        nodeSpacing: 50,
        crossReduction: "barycentric",
        crossReductionIterations: 4,
        sizeAware: true,
      });

      applyLayoutResult(result, nodesToLayout);
      return result;
    },
    [getNodesToLayout, nodeEditorState.connections, applyLayoutResult],
  );

  const applyTreeLayout = React.useCallback(
    (selectedOnly: boolean = false) => {
      const nodesToLayout = getNodesToLayout(selectedOnly);
      const layoutData = {
        nodes: nodesToLayout,
        connections: nodeEditorState.connections,
      };

      const result = calculateTreeLayout(layoutData, {
        direction: "TB",
        siblingSpacing: 30,
        levelSpacing: 100,
      });

      applyLayoutResult(result, nodesToLayout);
      return result;
    },
    [getNodesToLayout, nodeEditorState.connections, applyLayoutResult],
  );

  const applyGridLayout = React.useCallback(
    (selectedOnly: boolean = false) => {
      const nodesToLayout = getNodesToLayout(selectedOnly);
      const layoutData = {
        nodes: nodesToLayout,
        connections: nodeEditorState.connections,
      };

      const result = calculateGridLayout(layoutData, {
        spacing: 50,
        columns: Math.ceil(Math.sqrt(Object.keys(nodesToLayout).length)),
      });

      applyLayoutResult(result, nodesToLayout);
      return result;
    },
    [getNodesToLayout, nodeEditorState.connections, applyLayoutResult],
  );

  /**
   * Apply auto layout with automatic algorithm selection
   */
  const applyAutoLayout = React.useCallback(
    (selectedOnly: boolean = false) => {
      const nodesToLayout = getNodesToLayout(selectedOnly);
      const layoutData = {
        nodes: nodesToLayout,
        connections: nodeEditorState.connections,
      };

      const result = calculateAutoLayout(layoutData, {
        algorithm: "auto",
        padding: 100,
      });

      applyLayoutResult(result, nodesToLayout);
      return result;
    },
    [getNodesToLayout, nodeEditorState.connections, applyLayoutResult],
  );

  const applyLayout = React.useCallback(
    (layoutType: LayoutAlgorithm, selectedOnly: boolean = false): LayoutResult | undefined => {
      switch (layoutType) {
        case "force":
          return applyForceLayout(selectedOnly);
        case "hierarchical":
          return applyHierarchicalLayout(selectedOnly);
        case "tree":
          return applyTreeLayout(selectedOnly);
        case "grid":
          return applyGridLayout(selectedOnly);
        case "auto":
          return applyAutoLayout(selectedOnly);
        default:
          console.warn(`Unknown layout type: ${layoutType}`);
          return undefined;
      }
    },
    [applyForceLayout, applyHierarchicalLayout, applyTreeLayout, applyGridLayout, applyAutoLayout],
  );

  return {
    applyLayout,
    applyForceLayout,
    applyHierarchicalLayout,
    applyTreeLayout,
    applyGridLayout,
    applyAutoLayout,
  };
};
