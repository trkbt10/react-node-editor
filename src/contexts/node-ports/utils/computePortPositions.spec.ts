/**
 * @file Tests for computeNodePortPositions with segmented port layouts.
 */
import { computeNodePortPositions } from "./computePortPositions";
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
});
