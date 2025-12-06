/**
 * @file Tests for placement comparison utilities
 */
import type { Port, PortPlacement } from "../../../types/core";
import { arePlacementsEqual, hasPortPlacementChanged } from "./comparators";

describe("placement comparators", () => {
  const createPort = (overrides: Partial<Port> = {}): Port => ({
    id: "port-1",
    nodeId: "node-1",
    type: "input",
    label: "Input",
    position: "left",
    ...overrides,
  });

  describe("arePlacementsEqual", () => {
    it("returns true when both are undefined", () => {
      expect(arePlacementsEqual(undefined, undefined)).toBe(true);
    });

    it("returns true when both are null", () => {
      expect(arePlacementsEqual(null, null)).toBe(true);
    });

    it("returns false when one is undefined and other is defined", () => {
      expect(arePlacementsEqual(undefined, { side: "left" })).toBe(false);
    });

    it("returns true when all fields are equal", () => {
      const placement: PortPlacement = { side: "left", segment: "main", segmentOrder: 1, segmentSpan: 2, align: 0.5 };
      expect(arePlacementsEqual(placement, { ...placement })).toBe(true);
    });

    it("returns false when segmentSpan differs", () => {
      expect(arePlacementsEqual({ side: "left", segmentSpan: 1 }, { side: "left", segmentSpan: 2 })).toBe(false);
    });

    it("returns false when align differs", () => {
      expect(arePlacementsEqual({ side: "left", align: 0.5 }, { side: "left", align: 0.75 })).toBe(false);
    });
  });

  describe("hasPortPlacementChanged", () => {
    it("returns false when both are undefined", () => {
      expect(hasPortPlacementChanged(undefined, undefined)).toBe(false);
    });

    it("returns false when both have no placement", () => {
      expect(hasPortPlacementChanged(createPort({ placement: undefined }), createPort({ placement: undefined }))).toBe(false);
    });

    it("returns true when prev has no placement and next has placement", () => {
      expect(hasPortPlacementChanged(createPort({ placement: undefined }), createPort({ placement: { side: "left" } }))).toBe(true);
    });

    it("returns false when placements are equal", () => {
      const placement = { side: "left" as const, segment: "main" };
      expect(hasPortPlacementChanged(createPort({ placement }), createPort({ placement }))).toBe(false);
    });

    it("returns true when placement side differs", () => {
      expect(
        hasPortPlacementChanged(createPort({ placement: { side: "left" } }), createPort({ placement: { side: "right" } })),
      ).toBe(true);
    });

    it("returns true when placement segment differs", () => {
      expect(
        hasPortPlacementChanged(
          createPort({ placement: { side: "left", segment: "main" } }),
          createPort({ placement: { side: "left", segment: "aux" } }),
        ),
      ).toBe(true);
    });

    it("returns true when placement segmentSpan differs", () => {
      expect(
        hasPortPlacementChanged(
          createPort({ placement: { side: "left", segmentSpan: 1 } }),
          createPort({ placement: { side: "left", segmentSpan: 2 } }),
        ),
      ).toBe(true);
    });

    it("returns true when placement align differs", () => {
      expect(
        hasPortPlacementChanged(
          createPort({ placement: { side: "left", align: 0.5 } }),
          createPort({ placement: { side: "left", align: 0.75 } }),
        ),
      ).toBe(true);
    });
  });
});
