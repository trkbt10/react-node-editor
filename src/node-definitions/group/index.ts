import type { NodeDefinition } from "../../types/NodeDefinition";
import { GroupNodeRenderer } from "./node";

/**
 * Group node definition
 * A container node that can hold other nodes
 */
export const GroupNodeDefinition: NodeDefinition<"group"> = {
  type: "group",
  displayName: "Group",
  description: "A container node that can hold other nodes",
  category: "Structure",
  defaultData: {
    title: "Group",
  },
  defaultSize: { width: 300, height: 200 },
  behaviors: ["node", { type: "group", autoGroup: true } as const],
  visualState: "info",
};
