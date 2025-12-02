/**
 * @file Tests for InspectorSelect component
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { InspectorSelect } from "./InspectorSelect";

describe("InspectorSelect", () => {
  it("renders select element with options", () => {
    render(
      <InspectorSelect>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </InspectorSelect>,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
  });

  it("handles value changes", () => {
    let changed = false;
    const handleChange = () => {
      changed = true;
    };
    render(
      <InspectorSelect onChange={handleChange}>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </InspectorSelect>,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "b" } });
    expect(changed).toBe(true);
  });

  it("applies variant data attribute", () => {
    const { rerender } = render(<InspectorSelect variant="default" />);
    expect(screen.getByRole("combobox")).toHaveAttribute("data-variant", "default");

    rerender(<InspectorSelect variant="outline" />);
    expect(screen.getByRole("combobox")).toHaveAttribute("data-variant", "outline");

    rerender(<InspectorSelect variant="filled" />);
    expect(screen.getByRole("combobox")).toHaveAttribute("data-variant", "filled");
  });

  it("applies error state", () => {
    const { rerender } = render(<InspectorSelect error={false} />);
    expect(screen.getByRole("combobox")).not.toHaveAttribute("data-error");

    rerender(<InspectorSelect error={true} />);
    expect(screen.getByRole("combobox")).toHaveAttribute("data-error", "true");
  });

  it("handles disabled state", () => {
    render(<InspectorSelect disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("accepts additional className", () => {
    render(<InspectorSelect className="custom-class" />);
    expect(screen.getByRole("combobox")).toHaveClass("custom-class");
  });
});
