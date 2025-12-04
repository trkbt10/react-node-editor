/**
 * @file Helper utilities for constructing node instances from definitions.
 */
import type { Node } from "../../../../types/core";
import type { NodeDefinition } from "../../../../types/NodeDefinition";

const generateNodeId = (nodeType: string): string => {
  return `${nodeType}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export type BuildNodeFromDefinitionArgs = {
  nodeDefinition: NodeDefinition;
  canvasPosition: { x: number; y: number };
};

/**
 * Create a Node object using defaults from the provided definition.
 * Ensures the node is centered around the drop position and includes default data/resizing props.
 */
export const buildNodeFromDefinition = ({
  nodeDefinition,
  canvasPosition,
}: BuildNodeFromDefinitionArgs): Node => {
  const nodeType = nodeDefinition.type;
  const nodeId = generateNodeId(nodeType);
  const nodeSize = nodeDefinition.defaultSize ?? { width: 150, height: 50 };

  const centeredPosition = {
    x: canvasPosition.x - nodeSize.width / 2,
    y: canvasPosition.y - nodeSize.height / 2,
  };

  const defaultData =
    nodeDefinition.defaultData !== undefined
      ? { ...(nodeDefinition.defaultData as Record<string, unknown>) }
      : {};

  const node: Node = {
    id: nodeId,
    type: nodeType,
    position: centeredPosition,
    size: nodeSize,
    data: {
      ...defaultData,
      title: "",
    },
  };

  if (nodeDefinition.defaultResizable !== undefined) {
    node.resizable = nodeDefinition.defaultResizable;
  }

  return node;
};
