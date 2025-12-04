/**
 * @file Tests for NodeCanvasContext - validates canvas viewport and transformation utilities
 */
import { render } from "@testing-library/react";
import { useEffect, type FC } from "react";
import { useNodeCanvas } from "./canvas/viewport/context";
import { NodeCanvasProvider } from "./canvas/viewport/provider";

const Harness: FC = () => {
  const { state, actions } = useNodeCanvas();
  useEffect(() => {
    actions.panViewport({ x: 5, y: 7 });
    actions.zoomViewport(2);
    actions.setSpacePanning(true);
  }, [actions]);
  return (
    <div>
      <div data-testid="offset">{`${state.viewport.offset.x},${state.viewport.offset.y}`}</div>
      <div data-testid="scale">{String(state.viewport.scale)}</div>
      <div data-testid="space">{String(state.isSpacePanning)}</div>
    </div>
  );
};

describe("NodeCanvasContext", () => {
  it("pans and zooms viewport; toggles space panning", () => {
    const { getByTestId } = render(
      <NodeCanvasProvider>
        <Harness />
      </NodeCanvasProvider>,
    );
    expect(getByTestId("offset").textContent).toBe("5,7");
    expect(getByTestId("scale").textContent).toBe("2");
    expect(getByTestId("space").textContent).toBe("true");
  });
});
