/**
 * @file Tests for InspectorToggleGroup component
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { InspectorToggleGroup } from "./InspectorToggleGroup";

const options = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
  { value: "c", label: "C" },
];

describe("InspectorToggleGroup", () => {
  describe("single selection mode", () => {
    it("renders all options", () => {
      render(<InspectorToggleGroup options={options} value="a" onChange={() => {}} aria-label="Options" />);
      expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "B" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "C" })).toBeInTheDocument();
    });

    it("marks selected option with data-selected and aria-pressed", () => {
      render(<InspectorToggleGroup options={options} value="b" onChange={() => {}} aria-label="Options" />);
      expect(screen.getByRole("button", { name: "B" })).toHaveAttribute("data-selected", "true");
      expect(screen.getByRole("button", { name: "B" })).toHaveAttribute("aria-pressed", "true");
    });

    it("calls onChange with selected value", () => {
      let changedValue: string | null = null;
      const handleChange = (value: string | string[]) => {
        changedValue = value as string;
      };
      render(<InspectorToggleGroup options={options} value="a" onChange={handleChange} aria-label="Options" />);
      fireEvent.click(screen.getByRole("button", { name: "C" }));
      expect(changedValue).toBe("c");
    });
  });

  describe("multiple selection mode", () => {
    it("marks all selected options", () => {
      render(
        <InspectorToggleGroup options={options} value={["a", "c"]} onChange={() => {}} aria-label="Options" multiple />,
      );
      expect(screen.getByRole("button", { name: "A" })).toHaveAttribute("data-selected", "true");
      expect(screen.getByRole("button", { name: "B" })).not.toHaveAttribute("data-selected");
      expect(screen.getByRole("button", { name: "C" })).toHaveAttribute("data-selected", "true");
    });

    it("adds value when clicking unselected option", () => {
      let changedValues: string[] = [];
      const handleChange = (value: string | string[]) => {
        changedValues = value as string[];
      };
      render(
        <InspectorToggleGroup
          options={options}
          value={["a"]}
          onChange={handleChange}
          aria-label="Options"
          multiple
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "B" }));
      expect(changedValues).toEqual(["a", "b"]);
    });

    it("removes value when clicking selected option", () => {
      let changedValues: string[] = [];
      const handleChange = (value: string | string[]) => {
        changedValues = value as string[];
      };
      render(
        <InspectorToggleGroup
          options={options}
          value={["a", "b"]}
          onChange={handleChange}
          aria-label="Options"
          multiple
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "A" }));
      expect(changedValues).toEqual(["b"]);
    });
  });

  it("disables all buttons when disabled prop is true", () => {
    render(<InspectorToggleGroup options={options} value="a" onChange={() => {}} aria-label="Options" disabled />);
    expect(screen.getByRole("button", { name: "A" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "B" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "C" })).toBeDisabled();
  });

  it("applies data-size attribute based on size prop", () => {
    const { container, rerender } = render(
      <InspectorToggleGroup options={options} value="a" onChange={() => {}} aria-label="Options" size="default" />,
    );
    expect(container.querySelector('[data-size="default"]')).toBeInTheDocument();

    rerender(
      <InspectorToggleGroup options={options} value="a" onChange={() => {}} aria-label="Options" size="compact" />,
    );
    expect(container.querySelector('[data-size="compact"]')).toBeInTheDocument();
  });

  it("applies aria-label to the group", () => {
    render(<InspectorToggleGroup options={options} value="a" onChange={() => {}} aria-label="Options" />);
    expect(screen.getByRole("group", { name: "Options" })).toBeInTheDocument();
  });
});
