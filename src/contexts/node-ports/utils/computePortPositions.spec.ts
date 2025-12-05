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

  it("connectionPoint is exactly connectionMargin away from port visual center", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      data: {},
    };

    const halfPortSize = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;
    const connectionMargin = DEFAULT_PORT_POSITION_CONFIG.connectionMargin;

    // Port in center of node - should connect to nearest edge (could be any)
    const ports: Port[] = [
      {
        id: "center-port",
        nodeId: node.id,
        type: "output",
        label: "Center",
        position: "right",
        placement: { mode: "absolute", x: 100, y: 75 }, // center of 200x150 node
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const pos = positions.get("center-port");

    // Port visual center in canvas coordinates
    const portVisualCenterX = node.position.x + pos!.renderPosition.x + halfPortSize;
    const portVisualCenterY = node.position.y + pos!.renderPosition.y + halfPortSize;

    // Distance from port visual center to connection point
    const dx = pos!.connectionPoint.x - portVisualCenterX;
    const dy = pos!.connectionPoint.y - portVisualCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Connection point should be exactly connectionMargin away from port center
    expect(distance).toBeCloseTo(connectionMargin, 1);
  });

  it("connectionPoint aligns with port visual center on perpendicular axis", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      data: {},
    };

    const halfPortSize = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;
    const connectionMargin = DEFAULT_PORT_POSITION_CONFIG.connectionMargin;

    // Port near right edge - should connect to the right
    const ports: Port[] = [
      {
        id: "right-port",
        nodeId: node.id,
        type: "output",
        label: "Right",
        position: "right",
        placement: { mode: "absolute", x: 195, y: 50 }, // near right edge
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const pos = positions.get("right-port");

    // Port visual center in canvas coordinates
    const portVisualCenterX = node.position.x + pos!.renderPosition.x + halfPortSize;
    const portVisualCenterY = node.position.y + pos!.renderPosition.y + halfPortSize;

    // For right direction, connectionPoint.y should equal port center y
    expect(pos!.connectionPoint.y).toBeCloseTo(portVisualCenterY, 1);
    // connectionPoint.x should be connectionMargin to the right of port center
    expect(pos!.connectionPoint.x).toBeCloseTo(portVisualCenterX + connectionMargin, 1);
  });

  it("absolute port at corner has correct connectionPoint relative to visual center", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 50, y: 50 },
      size: { width: 200, height: 150 },
      data: {},
    };

    const halfPortSize = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;
    const connectionMargin = DEFAULT_PORT_POSITION_CONFIG.connectionMargin;

    // Port at top-left corner (0, 0)
    const ports: Port[] = [
      {
        id: "corner-tl",
        nodeId: node.id,
        type: "input",
        label: "TL",
        position: "left",
        placement: { mode: "absolute", x: 0, y: 0 },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const pos = positions.get("corner-tl");

    // Port visual center in canvas coordinates
    const portVisualCenterX = node.position.x + pos!.renderPosition.x + halfPortSize;
    const portVisualCenterY = node.position.y + pos!.renderPosition.y + halfPortSize;

    // Port center should be at node position + placement
    expect(portVisualCenterX).toBeCloseTo(node.position.x + 0, 1);
    expect(portVisualCenterY).toBeCloseTo(node.position.y + 0, 1);

    // Connection point should be connectionMargin away from port center
    const dx = pos!.connectionPoint.x - portVisualCenterX;
    const dy = pos!.connectionPoint.y - portVisualCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    expect(distance).toBeCloseTo(connectionMargin, 1);
  });

  it("absolute and side placement at same position produce consistent connectionPoints", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      data: {},
    };

    const halfPortSize = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;

    // Side port on the left at center (align=0.5 means y=50)
    const sidePorts: Port[] = [
      {
        id: "side-left",
        nodeId: node.id,
        type: "input",
        label: "Side Left",
        position: "left",
        placement: { side: "left", align: 0.5 },
      },
    ];

    // Absolute port at same visual position (left edge, y=50)
    const absolutePorts: Port[] = [
      {
        id: "absolute-left",
        nodeId: node.id,
        type: "input",
        label: "Absolute Left",
        position: "left",
        placement: { mode: "absolute", x: 0, y: 50 },
      },
    ];

    const sidePositions = computeNodePortPositions({ ...node, ports: sidePorts }, DEFAULT_PORT_POSITION_CONFIG, sidePorts);
    const absolutePositions = computeNodePortPositions({ ...node, ports: absolutePorts }, DEFAULT_PORT_POSITION_CONFIG, absolutePorts);

    const sidePos = sidePositions.get("side-left")!;
    const absPos = absolutePositions.get("absolute-left")!;

    // Calculate visual centers for both
    // Side port uses transform, so visual center calculation differs
    const sideVisualCenterY = node.position.y + sidePos.renderPosition.y; // transform centers it
    const absVisualCenterY = node.position.y + absPos.renderPosition.y + halfPortSize;

    // Both should have same visual center Y (at node.y + 50)
    expect(sideVisualCenterY).toBeCloseTo(node.position.y + 50, 1);
    expect(absVisualCenterY).toBeCloseTo(node.position.y + 50, 1);

    // Both connectionPoints should have same Y coordinate (both on left edge)
    expect(sidePos.connectionPoint.y).toBeCloseTo(absPos.connectionPoint.y, 1);
    expect(sidePos.connectionPoint.x).toBeCloseTo(absPos.connectionPoint.x, 1);
  });

  it("absolute port connectionPoint.y equals placement.y + node.position.y for horizontal directions", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 150 },
      data: {},
    };

    // Port at (0, 75) - left edge, vertical center
    const ports: Port[] = [
      {
        id: "left-center",
        nodeId: node.id,
        type: "input",
        label: "Left Center",
        position: "left",
        placement: { mode: "absolute", x: 0, y: 75 },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const pos = positions.get("left-center")!;

    // For left direction, connectionPoint.y should exactly equal node.y + placement.y
    expect(pos.connectionPoint.y).toBe(node.position.y + 75);
  });
});

describe("computeNodePortPositions - absolute placement with unit", () => {
  it("places port using pixel units by default", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "px-port",
        nodeId: node.id,
        type: "input",
        label: "Pixel",
        position: "left",
        placement: { mode: "absolute", x: 50, y: 25 },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const pos = positions.get("px-port");

    const halfPortSize = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;
    expect(pos?.renderPosition.x).toBeCloseTo(50 - halfPortSize, 1);
    expect(pos?.renderPosition.y).toBeCloseTo(25 - halfPortSize, 1);
  });

  it("places port using explicit pixel units", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "explicit-px",
        nodeId: node.id,
        type: "input",
        label: "Explicit Pixel",
        position: "left",
        placement: { mode: "absolute", x: 50, y: 25, unit: "px" },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const pos = positions.get("explicit-px");

    const halfPortSize = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;
    expect(pos?.renderPosition.x).toBeCloseTo(50 - halfPortSize, 1);
    expect(pos?.renderPosition.y).toBeCloseTo(25 - halfPortSize, 1);
  });

  it("places port using percentage units", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      data: {},
    };

    // 50% of 200 width = 100px, 25% of 100 height = 25px
    const ports: Port[] = [
      {
        id: "percent-port",
        nodeId: node.id,
        type: "input",
        label: "Percent",
        position: "left",
        placement: { mode: "absolute", x: 50, y: 25, unit: "percent" },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const pos = positions.get("percent-port");

    const halfPortSize = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;
    // 50% of 200 = 100, 25% of 100 = 25
    expect(pos?.renderPosition.x).toBeCloseTo(100 - halfPortSize, 1);
    expect(pos?.renderPosition.y).toBeCloseTo(25 - halfPortSize, 1);
  });

  it("percent 0,0 places port at top-left corner", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "corner-tl",
        nodeId: node.id,
        type: "input",
        label: "TL",
        position: "left",
        placement: { mode: "absolute", x: 0, y: 0, unit: "percent" },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const pos = positions.get("corner-tl");

    const halfPortSize = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;
    expect(pos?.renderPosition.x).toBeCloseTo(-halfPortSize, 1);
    expect(pos?.renderPosition.y).toBeCloseTo(-halfPortSize, 1);
  });

  it("percent 100,100 places port at bottom-right corner", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "corner-br",
        nodeId: node.id,
        type: "output",
        label: "BR",
        position: "right",
        placement: { mode: "absolute", x: 100, y: 100, unit: "percent" },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const pos = positions.get("corner-br");

    const halfPortSize = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;
    // 100% of 200 = 200, 100% of 100 = 100
    expect(pos?.renderPosition.x).toBeCloseTo(200 - halfPortSize, 1);
    expect(pos?.renderPosition.y).toBeCloseTo(100 - halfPortSize, 1);
  });

  it("percent 50,50 places port at center", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "center",
        nodeId: node.id,
        type: "input",
        label: "Center",
        position: "left",
        placement: { mode: "absolute", x: 50, y: 50, unit: "percent" },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const pos = positions.get("center");

    const halfPortSize = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;
    // 50% of 200 = 100, 50% of 100 = 50
    expect(pos?.renderPosition.x).toBeCloseTo(100 - halfPortSize, 1);
    expect(pos?.renderPosition.y).toBeCloseTo(50 - halfPortSize, 1);
  });

  it("infers correct direction for percent placement on left edge", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      data: {},
    };

    // x=0 means left edge, y=50% means vertical center
    const ports: Port[] = [
      {
        id: "left-edge",
        nodeId: node.id,
        type: "input",
        label: "Left Edge",
        position: "left",
        placement: { mode: "absolute", x: 0, y: 50, unit: "percent" },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const pos = positions.get("left-edge");

    // Connection should extend to the left
    expect(pos?.connectionPoint.x).toBeLessThan(0);
    expect(pos?.connectionDirection).toBe("left");
  });

  it("infers correct direction for percent placement on right edge", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      data: {},
    };

    // x=100% means right edge, y=50% means vertical center
    const ports: Port[] = [
      {
        id: "right-edge",
        nodeId: node.id,
        type: "output",
        label: "Right Edge",
        position: "right",
        placement: { mode: "absolute", x: 100, y: 50, unit: "percent" },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);
    const pos = positions.get("right-edge");

    // Connection should extend to the right
    expect(pos?.connectionPoint.x).toBeGreaterThan(200);
    expect(pos?.connectionDirection).toBe("right");
  });

  it("handles mixed px and percent ports on same node", () => {
    const node: Node = {
      id: "node-1",
      type: "test",
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      data: {},
    };

    const ports: Port[] = [
      {
        id: "px-port",
        nodeId: node.id,
        type: "input",
        label: "Pixel",
        position: "left",
        placement: { mode: "absolute", x: 0, y: 50, unit: "px" },
      },
      {
        id: "percent-port",
        nodeId: node.id,
        type: "output",
        label: "Percent",
        position: "right",
        placement: { mode: "absolute", x: 100, y: 50, unit: "percent" },
      },
    ];

    const positions = computeNodePortPositions({ ...node, ports }, DEFAULT_PORT_POSITION_CONFIG, ports);

    expect(positions.size).toBe(2);

    const pxPos = positions.get("px-port");
    const percentPos = positions.get("percent-port");

    const halfPortSize = DEFAULT_PORT_POSITION_CONFIG.visualSize / 2;

    // px port at x=0
    expect(pxPos?.renderPosition.x).toBeCloseTo(-halfPortSize, 1);

    // percent port at x=100% of 200 = 200
    expect(percentPos?.renderPosition.x).toBeCloseTo(200 - halfPortSize, 1);
  });
});
