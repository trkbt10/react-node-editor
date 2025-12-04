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

describe("computeNodePortPositions - inset placement", () => {
  it("places inset port inside the node boundary", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "normal",
        nodeId: node.id,
        type: "input",
        label: "Normal",
        position: "left",
        placement: { side: "left" },
      },
      {
        id: "inset",
        nodeId: node.id,
        type: "input",
        label: "Inset",
        position: "left",
        placement: { side: "left", inset: true },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);

    const normal = positions.get("normal");
    const inset = positions.get("inset");

    // Normal port render position should be at or before x=0 (outside node)
    expect(normal?.renderPosition.x).toBeLessThanOrEqual(0);
    // Inset port render position should be inside node (positive x)
    expect(inset?.renderPosition.x).toBeGreaterThan(0);

    // Inset connection point should be inside node boundary
    expect(inset?.connectionPoint.x).toBeGreaterThanOrEqual(100); // node.position.x
  });

  it("places inset port on right side inside the node", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "inset-right",
        nodeId: node.id,
        type: "output",
        label: "Inset Right",
        position: "right",
        placement: { side: "right", inset: true },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const insetRight = positions.get("inset-right");

    // Inset port on right should have render x less than node width
    expect(insetRight?.renderPosition.x).toBeLessThan(200);
    // Connection point should be inside node boundary
    expect(insetRight?.connectionPoint.x).toBeLessThanOrEqual(200);
  });
});

describe("computeNodePortPositions - absolute placement", () => {
  it("places absolute positioned port at specified coordinates", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "absolute-port",
        nodeId: node.id,
        type: "input",
        label: "Absolute",
        position: "left", // Fallback position for compatibility
        placement: { mode: "absolute", x: 50, y: 30 },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const absolutePort = positions.get("absolute-port");

    // Render position should be offset for port centering (x - halfPortSize, y - halfPortSize)
    const halfPortSize = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;
    expect(absolutePort?.renderPosition.x).toBeCloseTo(50 - halfPortSize, 1);
    expect(absolutePort?.renderPosition.y).toBeCloseTo(30 - halfPortSize, 1);

    // Connection point x should be at node position + port x
    expect(absolutePort?.connectionPoint.x).toBeCloseTo(100 + 50, 1);
    // Port at (50, 30) in a 200x150 node is closest to top edge (distToTop=30)
    // So connectionDirection is inferred as "top", and connection extends upward
    expect(absolutePort?.connectionPoint.y).toBeLessThan(100 + 30);
  });

  it("infers connectionDirection for absolute port at bottom edge", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 150 },
      data: {},
    };

    // Port near the bottom edge (y=140 is closest to bottom edge at y=150)
    const ports: Port[] = [
      {
        id: "absolute-bottom",
        nodeId: node.id,
        type: "output",
        label: "Absolute Bottom",
        position: "bottom",
        placement: { mode: "absolute", x: 100, y: 140 },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const absoluteBottom = positions.get("absolute-bottom");

    // Connection point x should match port center
    expect(absoluteBottom?.connectionPoint.x).toBeCloseTo(100, 1);
    // Connection point y should extend downward (y + connectionMargin) since nearest edge is bottom
    expect(absoluteBottom?.connectionPoint.y).toBeGreaterThan(140);
  });

  it("infers connectionDirection based on nearest edge", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      data: {},
    };

    // Port near the right edge
    const ports: Port[] = [
      {
        id: "near-right",
        nodeId: node.id,
        type: "output",
        label: "Near Right",
        position: "right",
        placement: { mode: "absolute", x: 190, y: 50 },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const nearRight = positions.get("near-right");

    // Connection should extend to the right (x + margin)
    expect(nearRight?.connectionPoint.x).toBeGreaterThan(190);
    expect(nearRight?.connectionPoint.y).toBeCloseTo(50, 1);
  });

  it("handles mixed absolute and side-based ports", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "side-port",
        nodeId: node.id,
        type: "input",
        label: "Side",
        position: "left",
        placement: { side: "left" },
      },
      {
        id: "absolute-port",
        nodeId: node.id,
        type: "output",
        label: "Absolute",
        position: "right",
        placement: { mode: "absolute", x: 100, y: 50 },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);

    expect(positions.size).toBe(2);
    expect(positions.has("side-port")).toBe(true);
    expect(positions.has("absolute-port")).toBe(true);

    // Side port should be on the left
    const sidePort = positions.get("side-port");
    expect(sidePort?.renderPosition.x).toBeLessThanOrEqual(0);

    // Absolute port should be at specified position
    const absolutePort = positions.get("absolute-port");
    const halfPortSize = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;
    expect(absolutePort?.renderPosition.x).toBeCloseTo(100 - halfPortSize, 1);
  });
});
