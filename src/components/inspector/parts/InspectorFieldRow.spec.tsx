/**
 * @file Tests for InspectorFieldRow component
 */
import { render, screen } from "@testing-library/react";
import { InspectorFieldRow } from "./InspectorFieldRow";

describe("InspectorFieldRow", () => {
  it("renders label and children", () => {
    render(
      <InspectorFieldRow label="Test Label">
        <input data-testid="test-input" />
      </InspectorFieldRow>
    );
    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByTestId("test-input")).toBeInTheDocument();
  });

  it("renders ReactNode label", () => {
    render(
      <InspectorFieldRow label={<span data-testid="custom-label">Custom</span>}>
        <input />
      </InspectorFieldRow>
    );
    expect(screen.getByTestId("custom-label")).toBeInTheDocument();
  });

  it("accepts additional className for container", () => {
    const { container } = render(
      <InspectorFieldRow label="Label" className="custom-class">
        <input />
      </InspectorFieldRow>
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("passes labelProps to label element", () => {
    render(
      <InspectorFieldRow label="Label" labelProps={{ id: "my-label" }}>
        <input />
      </InspectorFieldRow>
    );
    const label = screen.getByText("Label");
    expect(label).toHaveAttribute("id", "my-label");
  });

  it("merges labelProps className with default label class", () => {
    render(
      <InspectorFieldRow label="Label" labelProps={{ className: "extra-label-class" }}>
        <input />
      </InspectorFieldRow>
    );
    const label = screen.getByText("Label");
    expect(label).toHaveClass("extra-label-class");
  });

  it("renders multiple children in control area", () => {
    render(
      <InspectorFieldRow label="Label">
        <input data-testid="input-1" />
        <input data-testid="input-2" />
      </InspectorFieldRow>
    );
    expect(screen.getByTestId("input-1")).toBeInTheDocument();
    expect(screen.getByTestId("input-2")).toBeInTheDocument();
  });
});
