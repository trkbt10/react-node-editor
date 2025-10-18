/**
 * @file Group node definition - a container for organizing other nodes
 */
import type { NodeDefinition } from "../../types/NodeDefinition";

type GroupNodeData = {
  title: string;
};

/**
 * Group node definition
 * A container node that can hold other nodes
 */
export const GroupNodeDefinition: NodeDefinition<GroupNodeData> = {
  type: "group",
  displayName: "Group",
  description: "A container node that can hold other nodes",
  category: "Structure",
  defaultData: {
    title: "Group",
  },
  defaultSize: { width: 300, height: 200 },
  ports: [],
  behaviors: ["node", { type: "group", autoGroup: true } as const],
  visualState: "info",
};
