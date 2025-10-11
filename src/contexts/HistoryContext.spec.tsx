import { render } from "@testing-library/react";
import { useEffect, type FC } from "react";
import { HistoryProvider, useHistory } from "./HistoryContext";
import type { NodeEditorData } from "../types/core";

const sample: NodeEditorData = { nodes: {}, connections: {} };

const Harness: FC = () => {
  const { state, pushEntry, undo, redo } = useHistory();
  useEffect(() => {
    pushEntry("init", sample);
    pushEntry("move", sample);
    undo();
    redo();
  }, [pushEntry, undo, redo]);
  return (
    <div>
      <div data-testid="count">{String(state.entries.length)}</div>
      <div data-testid="index">{String(state.currentIndex)}</div>
    </div>
  );
};

describe("HistoryContext", () => {
  it("push, undo, redo update history state", () => {
    const { getByTestId } = render(
      <HistoryProvider>
        <Harness />
      </HistoryProvider>
    );
    expect(getByTestId("count").textContent).toBe("2");
    expect(Number(getByTestId("index").textContent)).toBeGreaterThanOrEqual(1);
  });
});
