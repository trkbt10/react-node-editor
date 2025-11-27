/**
 * @file Tests for node definition catalog grouping helpers.
 */
import type { NodeDefinition } from "../../../types/NodeDefinition";
import {
  DEFAULT_NODE_CATEGORY,
  filterGroupedNodeDefinitions,
  groupNodeDefinitions,
  groupNodeDefinitionsNested,
  filterNestedNodeDefinitions,
  flattenNestedNodeDefinitions,
  parseCategoryPath,
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

describe("parseCategoryPath", () => {
  it("splits category path by separator", () => {
    expect(parseCategoryPath("Data/Transform/Filter")).toEqual(["Data", "Transform", "Filter"]);
  });

  it("handles single segment", () => {
    expect(parseCategoryPath("Basic")).toEqual(["Basic"]);
  });

  it("trims whitespace from segments", () => {
    expect(parseCategoryPath("Data / Transform / Filter")).toEqual(["Data", "Transform", "Filter"]);
  });
});

describe("groupNodeDefinitionsNested", () => {
  it("creates nested structure from slash-separated categories", () => {
    const nested = groupNodeDefinitionsNested([
      baseNode({ type: "filter", displayName: "Filter", category: "Data/Transform" }),
      baseNode({ type: "map", displayName: "Map", category: "Data/Transform" }),
      baseNode({ type: "source", displayName: "Source", category: "Data" }),
      baseNode({ type: "basic", displayName: "Basic", category: "Basic" }),
    ]);

    expect(nested).toHaveLength(2);
    expect(nested.map((c) => c.name)).toEqual(["Basic", "Data"]);

    const dataCategory = nested.find((c) => c.name === "Data");
    expect(dataCategory?.nodes).toHaveLength(1);
    expect(dataCategory?.children).toHaveLength(1);
    expect(dataCategory?.children[0]?.name).toBe("Transform");
    expect(dataCategory?.children[0]?.nodes).toHaveLength(2);
    expect(dataCategory?.totalNodeCount).toBe(3);
  });

  it("calculates total node count including all descendants", () => {
    const nested = groupNodeDefinitionsNested([
      baseNode({ type: "a", displayName: "A", category: "Root/Child/Grandchild" }),
      baseNode({ type: "b", displayName: "B", category: "Root/Child" }),
      baseNode({ type: "c", displayName: "C", category: "Root" }),
    ]);

    expect(nested).toHaveLength(1);
    const root = nested[0];
    expect(root?.totalNodeCount).toBe(3);
    expect(root?.nodes).toHaveLength(1);
    expect(root?.children[0]?.totalNodeCount).toBe(2);
  });

  it("assigns nodes without category to default category", () => {
    const nested = groupNodeDefinitionsNested([
      baseNode({ type: "orphan", displayName: "Orphan" }),
    ]);

    expect(nested).toHaveLength(1);
    expect(nested[0]?.name).toBe(DEFAULT_NODE_CATEGORY);
  });
});

describe("filterNestedNodeDefinitions", () => {
  it("filters nested categories by search query", () => {
    const nested = groupNodeDefinitionsNested([
      baseNode({ type: "filter", displayName: "Filter", category: "Data/Transform" }),
      baseNode({ type: "map", displayName: "Map", category: "Data/Transform" }),
      baseNode({ type: "source", displayName: "Source", category: "Data" }),
    ]);

    const filtered = filterNestedNodeDefinitions(nested, "filter");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("Data");
    expect(filtered[0]?.children[0]?.nodes).toHaveLength(1);
    expect(filtered[0]?.children[0]?.nodes[0]?.displayName).toBe("Filter");
  });

  it("returns all categories when query is empty", () => {
    const nested = groupNodeDefinitionsNested([
      baseNode({ type: "a", displayName: "A", category: "Cat1" }),
      baseNode({ type: "b", displayName: "B", category: "Cat2" }),
    ]);

    const filtered = filterNestedNodeDefinitions(nested, "");
    expect(filtered).toHaveLength(2);
  });
});

describe("flattenNestedNodeDefinitions", () => {
  it("flattens nested structure into a single list", () => {
    const nested = groupNodeDefinitionsNested([
      baseNode({ type: "filter", displayName: "Filter", category: "Data/Transform" }),
      baseNode({ type: "source", displayName: "Source", category: "Data" }),
    ]);

    const flattened = flattenNestedNodeDefinitions(nested);
    expect(flattened).toHaveLength(2);
    expect(flattened.map((f) => f.node.type)).toEqual(["source", "filter"]);
    expect(flattened[1]?.categoryPath).toBe("Data/Transform");
  });
});
