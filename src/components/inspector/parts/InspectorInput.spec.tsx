/**
 * @file Tests for InspectorInput component
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { InspectorInput } from "./InspectorInput";

const MockIcon = () => <svg data-testid="mock-icon" />;

describe("InspectorInput", () => {
  it("renders as a simple input without label", () => {
    render(<InspectorInput placeholder="Enter value" />);
    expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
  });

  it("renders with text label", () => {
    render(<InspectorInput label="X" placeholder="Enter value" />);
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
  });

  it("renders with icon label", () => {
    render(<InspectorInput label={<MockIcon />} placeholder="Enter value" />);
    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });

  it("handles value changes", () => {
    let changed = false;
    const handleChange = () => {
      changed = true;
    };
    render(<InspectorInput onChange={handleChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    expect(changed).toBe(true);
  });

  it("applies variant data attribute", () => {
    const { container, rerender } = render(<InspectorInput variant="default" />);
    expect(container.querySelector('[data-variant="default"]')).toBeInTheDocument();

    rerender(<InspectorInput variant="outline" />);
    expect(container.querySelector('[data-variant="outline"]')).toBeInTheDocument();

    rerender(<InspectorInput variant="filled" />);
    expect(container.querySelector('[data-variant="filled"]')).toBeInTheDocument();
  });

  it("applies error state", () => {
    const { container, rerender } = render(<InspectorInput error={false} />);
    expect(container.querySelector('[data-error="true"]')).not.toBeInTheDocument();

    rerender(<InspectorInput error={true} />);
    expect(container.querySelector('[data-error="true"]')).toBeInTheDocument();
  });

  it("handles disabled state", () => {
    render(<InspectorInput disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("applies disabled state to container with label", () => {
    const { container } = render(<InspectorInput label="X" disabled />);
    expect(container.querySelector('[data-disabled="true"]')).toBeInTheDocument();
  });

  it("accepts additional className", () => {
    const { container } = render(<InspectorInput className="custom-class" />);
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
