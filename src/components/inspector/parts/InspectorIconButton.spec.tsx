/**
 * @file Tests for InspectorIconButton component
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { InspectorIconButton } from "./InspectorIconButton";

const MockIcon = () => <svg data-testid="mock-icon" />;

describe("InspectorIconButton", () => {
  it("renders icon content", () => {
    render(<InspectorIconButton icon={<MockIcon />} aria-label="Test button" />);
    expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
  });

  it("applies aria-label for accessibility", () => {
    render(<InspectorIconButton icon={<MockIcon />} aria-label="Test button" />);
    expect(screen.getByRole("button", { name: "Test button" })).toBeInTheDocument();
  });

  it("handles click events", () => {
    let clickCount = 0;
    const handleClick = () => {
      clickCount++;
    };
    render(<InspectorIconButton icon={<MockIcon />} aria-label="Test button" onClick={handleClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(clickCount).toBe(1);
  });

  it("applies data-size attribute based on size prop", () => {
    const { rerender } = render(<InspectorIconButton icon={<MockIcon />} aria-label="Test button" size="default" />);
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "default");

    rerender(<InspectorIconButton icon={<MockIcon />} aria-label="Test button" size="small" />);
    expect(screen.getByRole("button")).toHaveAttribute("data-size", "small");
  });

  it("applies data-active attribute when active", () => {
    const { rerender } = render(<InspectorIconButton icon={<MockIcon />} aria-label="Test button" active={false} />);
    expect(screen.getByRole("button")).not.toHaveAttribute("data-active");

    rerender(<InspectorIconButton icon={<MockIcon />} aria-label="Test button" active={true} />);
    expect(screen.getByRole("button")).toHaveAttribute("data-active", "true");
  });

  it("disables button when disabled prop is true", () => {
    render(<InspectorIconButton icon={<MockIcon />} aria-label="Test button" disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("accepts additional className", () => {
    render(<InspectorIconButton icon={<MockIcon />} aria-label="Test button" className="custom-class" />);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });
});
