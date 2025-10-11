import { render } from "@testing-library/react";
import { useEffect, type FC } from "react";
import { InlineEditingProvider, useInlineEditing } from "./InlineEditingContext";

const Harness: FC = () => {
  const { state, startEditing, updateValue, confirmEdit, cancelEdit, isEditing } = useInlineEditing();
  useEffect(() => {
    startEditing("n1", "title", "Hello");
    updateValue("World");
    // finish path 1
    confirmEdit();
    // start and cancel path
    startEditing("n1", "title", "Again");
    cancelEdit();
  }, [startEditing, updateValue, confirmEdit, cancelEdit]);
  return (
    <div>
      <div data-testid="active">{String(state.isActive)}</div>
      <div data-testid="isEditing">{String(isEditing("n1", "title"))}</div>
    </div>
  );
};

describe("InlineEditingContext", () => {
  it("handles start/update/confirm/cancel flows", () => {
    const { getByTestId } = render(
      <InlineEditingProvider>
        <Harness />
      </InlineEditingProvider>
    );
    expect(getByTestId("active").textContent).toBe("false");
    expect(getByTestId("isEditing").textContent).toBe("false");
  });
});
