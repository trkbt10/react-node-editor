import { render } from "@testing-library/react";
import { type FC } from "react";
import { PortPositionProvider, usePortPositions } from "./index";
import type { EditorPortPositions, PortPosition } from "../../types/portPosition";

const Harness: FC = () => {
  const { getPortPosition } = usePortPositions();
  const pos = getPortPosition("n1", "p1");
  return <div data-testid="pos">{pos ? `${pos.connectionPoint.x},${pos.connectionPoint.y}` : "none"}</div>;
};

describe("PortPositionContext", () => {
  it("provides stored port positions", () => {
    const positions: EditorPortPositions = new Map([
      [
        "n1",
        new Map<string, PortPosition>([
          [
            "p1",
            {
              portId: "p1",
              renderPosition: { x: 10, y: 20 },
              connectionPoint: { x: 15, y: 25 },
            },
          ],
        ]),
      ],
    ]);
    const { getByTestId } = render(
      <PortPositionProvider portPositions={positions}>
        <Harness />
      </PortPositionProvider>
    );
    expect(getByTestId("pos").textContent).toBe("15,25");
  });
});
