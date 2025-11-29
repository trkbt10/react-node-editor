/**
 * @file Tests for computeNodePortPositions with segmented port layouts.
 */
import { computeNodePortPositions, createDefaultPortCompute } from "./computePortPositions";
import { DEFAULT_PORT_POSITION_CONFIG } from "../../../types/portPosition";
import type { Node, Port } from "../../../types/core";

describe("computeNodePortPositions - segmented sides", () => {
  it("allocates space per segment and positions ports within each segment", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 90 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "main-1",
        definitionId: "main",
        nodeId: node.id,
        type: "input",
        label: "Main 1",
        position: "left",
        placement: { side: "left", segment: "main", segmentOrder: 0, segmentSpan: 2 },
      },
      {
        id: "main-2",
        definitionId: "main",
        nodeId: node.id,
        type: "input",
        label: "Main 2",
        position: "left",
        placement: { side: "left", segment: "main", segmentOrder: 0, segmentSpan: 2 },
      },
      {
        id: "optional-1",
        definitionId: "optional",
        nodeId: node.id,
        type: "input",
        label: "Optional",
        position: "left",
        placement: { side: "left", segment: "optional", segmentOrder: 1, segmentSpan: 1 },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);

    const main1 = positions.get("main-1");
    const main2 = positions.get("main-2");
    const optional = positions.get("optional-1");

    expect(main1?.renderPosition.y).toBeCloseTo(20, 1);
    expect(main2?.renderPosition.y).toBeCloseTo(40, 1);
    expect(optional?.renderPosition.y).toBeCloseTo(75, 1);
    expect((main1?.renderPosition.y ?? 0) < (optional?.renderPosition.y ?? 0)).toBe(true);
  });

  it("handles single port on a side", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "single",
        nodeId: node.id,
        type: "input",
        label: "Single",
        position: "left",
        placement: { side: "left" },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const single = positions.get("single");

    // Single port should be centered (0.5 * 100 = 50)
    expect(single?.renderPosition.y).toBeCloseTo(50, 1);
  });

  it("respects align property for port positioning", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "aligned",
        nodeId: node.id,
        type: "input",
        label: "Aligned",
        position: "left",
        placement: { side: "left", align: 0.25 },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const aligned = positions.get("aligned");

    // Port with align 0.25 should be at 25% of height
    expect(aligned?.renderPosition.y).toBeCloseTo(25, 1);
  });
});

describe("createDefaultPortCompute", () => {
  it("creates a compute function that returns positions for all ports", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 100, y: 200 },
      size: { width: 150, height: 120 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "input-1",
        nodeId: node.id,
        type: "input",
        label: "Input",
        position: "left",
      },
      {
        id: "output-1",
        nodeId: node.id,
        type: "output",
        label: "Output",
        position: "right",
      },
    ];

    const compute = createDefaultPortCompute(node, DEFAULT_PORT_POSITION_CONFIG);
    const positions = compute(ports);

    expect(positions.size).toBe(2);
    expect(positions.has("input-1")).toBe(true);
    expect(positions.has("output-1")).toBe(true);

    const inputPos = positions.get("input-1");
    const outputPos = positions.get("output-1");

    // Input port should be on the left
    expect(inputPos?.renderPosition.x).toBeLessThan(0);
    // Output port should be on the right (near node width)
    expect(outputPos?.renderPosition.x).toBeGreaterThan(140);

    // Connection points should include node position
    expect(inputPos?.connectionPoint.x).toBeLessThan(100);
    expect(outputPos?.connectionPoint.x).toBeGreaterThan(250);
  });

  it("returns empty map for empty port array", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      data: {},
    };

    const compute = createDefaultPortCompute(node);
    const positions = compute([]);

    expect(positions.size).toBe(0);
  });
});

describe("computeNodePortPositions - options signature", () => {
  it("accepts options object with config and ports", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "port-1",
        nodeId: node.id,
        type: "input",
        label: "Port",
        position: "left",
      },
    ];

    const positions = computeNodePortPositions(node, {
      config: DEFAULT_PORT_POSITION_CONFIG,
      ports,
    });

    expect(positions.size).toBe(1);
    expect(positions.has("port-1")).toBe(true);
  });

  it("uses default config when not specified in options", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "port-1",
        nodeId: node.id,
        type: "input",
        label: "Port",
        position: "left",
      },
    ];

    const positions = computeNodePortPositions(node, { ports });

    expect(positions.size).toBe(1);
  });
});
