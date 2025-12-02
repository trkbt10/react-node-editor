/**
 * @file Tests for InspectorButtonGroup component
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { InspectorButtonGroup } from "./InspectorButtonGroup";

const MockIcon = () => <svg data-testid="mock-icon" />;

const options = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

describe("InspectorButtonGroup", () => {
  it("renders all options", () => {
    render(<InspectorButtonGroup options={options} value="left" onChange={() => {}} aria-label="Alignment" />);
    expect(screen.getByRole("button", { name: "Left" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Center" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Right" })).toBeInTheDocument();
  });

  it("renders with icon labels", () => {
    const iconOptions = [
      { value: "icon1", label: <MockIcon />, "aria-label": "Icon 1" },
      { value: "icon2", label: <MockIcon />, "aria-label": "Icon 2" },
    ];
    render(<InspectorButtonGroup options={iconOptions} value="icon1" onChange={() => {}} aria-label="Icons" />);
    expect(screen.getAllByTestId("mock-icon")).toHaveLength(2);
  });

  it("marks selected option with data-selected and aria-pressed", () => {
    render(<InspectorButtonGroup options={options} value="center" onChange={() => {}} aria-label="Alignment" />);
    const centerButton = screen.getByRole("button", { name: "Center" });
    expect(centerButton).toHaveAttribute("data-selected", "true");
    expect(centerButton).toHaveAttribute("aria-pressed", "true");

    const leftButton = screen.getByRole("button", { name: "Left" });
    expect(leftButton).not.toHaveAttribute("data-selected");
    expect(leftButton).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with selected value", () => {
    let changedValue: string | null = null;
    const handleChange = (value: string) => {
      changedValue = value;
    };
    render(<InspectorButtonGroup options={options} value="left" onChange={handleChange} aria-label="Alignment" />);
    fireEvent.click(screen.getByRole("button", { name: "Center" }));
    expect(changedValue).toBe("center");
  });

  it("disables all buttons when disabled prop is true", () => {
    render(<InspectorButtonGroup options={options} value="left" onChange={() => {}} aria-label="Alignment" disabled />);
    expect(screen.getByRole("button", { name: "Left" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Center" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Right" })).toBeDisabled();
  });

  it("applies data-size attribute based on size prop", () => {
    const { container, rerender } = render(
      <InspectorButtonGroup options={options} value="left" onChange={() => {}} aria-label="Alignment" size="default" />,
    );
    expect(container.querySelector('[data-size="default"]')).toBeInTheDocument();

    rerender(
      <InspectorButtonGroup options={options} value="left" onChange={() => {}} aria-label="Alignment" size="compact" />,
    );
    expect(container.querySelector('[data-size="compact"]')).toBeInTheDocument();
  });

  it("applies aria-label to the group", () => {
    render(<InspectorButtonGroup options={options} value="left" onChange={() => {}} aria-label="Alignment" />);
    expect(screen.getByRole("group", { name: "Alignment" })).toBeInTheDocument();
  });

  it("accepts additional className", () => {
    const { container } = render(
      <InspectorButtonGroup
        options={options}
        value="left"
        onChange={() => {}}
        aria-label="Alignment"
        className="custom-class"
      />,
    );
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});
