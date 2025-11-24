/**
 * @file Tests for node definition catalog grouping helpers.
 */
import type { NodeDefinition } from "../../../types/NodeDefinition";
import {
  DEFAULT_NODE_CATEGORY,
  filterGroupedNodeDefinitions,
  groupNodeDefinitions,
} from "./nodeDefinitionCatalog";

const baseNode = (overrides: Partial<NodeDefinition>): NodeDefinition => ({
  type: "node",
  displayName: "Node",
  ...overrides,
});

describe("groupNodeDefinitions", () => {
  it("sorts nodes within each category alphabetically while keeping groups stable", () => {
    const grouped = groupNodeDefinitions([
      baseNode({ type: "b", displayName: "Beta", category: "Basic" }),
      baseNode({ type: "a", displayName: "Alpha", category: "Basic" }),
      baseNode({ type: "z", displayName: "Zeta", category: "Advanced" }),
    ]);

    expect(grouped).toHaveLength(2);
    expect(grouped[0]?.name).toBe("Advanced");
    expect(grouped[1]?.name).toBe("Basic");
    expect(grouped[1]?.nodes.map((node) => node.displayName)).toEqual(["Alpha", "Beta"]);
  });

  it("prioritizes categories that define priority and uses the smallest value per category", () => {
    const grouped = groupNodeDefinitions([
      baseNode({ type: "analytics", displayName: "Analytics", category: "Data", priority: 5 }),
      baseNode({ type: "basic-node", displayName: "Basic Node", category: "Basic", priority: 1 }),
      baseNode({ type: "group-node", displayName: "Group Node", category: "Structure", priority: 10 }),
      baseNode({ type: "untagged", displayName: "Other Node" }),
      baseNode({ type: "data-secondary", displayName: "Aggregator", category: "Data", priority: 7 }),
    ]);

    expect(grouped.map((category) => category.name)).toEqual(["Basic", "Data", "Structure", DEFAULT_NODE_CATEGORY]);
    expect(grouped.map((category) => category.sortOrder)).toEqual([1, 5, 10, null]);
  });
});

describe("filterGroupedNodeDefinitions", () => {
  it("preserves category sort order metadata after filtering", () => {
    const grouped = groupNodeDefinitions([
      baseNode({ type: "alpha", displayName: "Alpha", category: "Letters", priority: 2 }),
      baseNode({ type: "beta", displayName: "Beta", category: "Letters", priority: 2 }),
      baseNode({ type: "gamma", displayName: "Gamma", category: "Greek", priority: 1 }),
    ]);

    const filtered = filterGroupedNodeDefinitions(grouped, "alp");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("Letters");
    expect(filtered[0]?.sortOrder).toBe(2);
    expect(filtered[0]?.nodes.map((node) => node.displayName)).toEqual(["Alpha"]);
  });
});
