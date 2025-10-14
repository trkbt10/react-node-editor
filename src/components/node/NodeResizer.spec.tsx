/**
 * @file Unit tests for NodeResizer component
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { NodeResizer, normalizeNodeSize } from "./NodeResizer";
import type { Size } from "../../types/core";

describe("normalizeNodeSize", () => {
  it("should use provided width and height", () => {
    const size: Size = { width: 200, height: 100 };
    const result = normalizeNodeSize(size, 150, 50);

    expect(result).toEqual({ width: 200, height: 100 });
  });

  it("should use default width when width is undefined", () => {
    const size = { height: 100 } as Size;
    const result = normalizeNodeSize(size, 150, 50);

    expect(result).toEqual({ width: 150, height: 100 });
  });

  it("should use default height when height is undefined", () => {
    const size = { width: 200 } as Size;
    const result = normalizeNodeSize(size, 150, 50);

    expect(result).toEqual({ width: 200, height: 50 });
  });

  it("should use both defaults when size is undefined", () => {
    const result = normalizeNodeSize(undefined, 150, 50);

    expect(result).toEqual({ width: 150, height: 50 });
  });

  it("should handle custom defaults", () => {
    const result = normalizeNodeSize(undefined, 300, 200);

    expect(result).toEqual({ width: 300, height: 200 });
  });
});

describe("NodeResizer", () => {
  it("should render with provided size", () => {
    const size: Size = { width: 300, height: 150 };

    render(
      <NodeResizer size={size}>
        {({ width, height }) => (
          <div data-testid="content">
            {width}x{height}
          </div>
        )}
      </NodeResizer>,
    );

    const content = screen.getByTestId("content");
    expect(content.textContent).toBe("300x150");
  });

  it("should render with default size when size is undefined", () => {
    render(
      <NodeResizer>
        {({ width, height }) => (
          <div data-testid="content">
            {width}x{height}
          </div>
        )}
      </NodeResizer>,
    );

    const content = screen.getByTestId("content");
    expect(content.textContent).toBe("150x50");
  });

  it("should apply width and height to wrapper div", () => {
    const size: Size = { width: 300, height: 150 };
    const { container } = render(
      <NodeResizer size={size}>
        {() => <div>Content</div>}
      </NodeResizer>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe("300px");
    expect(wrapper.style.height).toBe("150px");
  });

  it("should use custom defaults", () => {
    render(
      <NodeResizer defaultWidth={400} defaultHeight={200}>
        {({ width, height }) => (
          <div data-testid="content">
            {width}x{height}
          </div>
        )}
      </NodeResizer>,
    );

    const content = screen.getByTestId("content");
    expect(content.textContent).toBe("400x200");
  });

  it("should apply className to wrapper", () => {
    const { container } = render(
      <NodeResizer className="custom-class">
        {() => <div>Content</div>}
      </NodeResizer>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toBe("custom-class");
  });

  it("should merge custom styles with size styles", () => {
    const size: Size = { width: 300, height: 150 };
    const customStyle: React.CSSProperties = {
      backgroundColor: "red",
      padding: "10px"
    };

    const { container } = render(
      <NodeResizer size={size} style={customStyle}>
        {() => <div>Content</div>}
      </NodeResizer>,
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe("300px");
    expect(wrapper.style.height).toBe("150px");
    expect(wrapper.style.backgroundColor).toBe("red");
    expect(wrapper.style.padding).toBe("10px");
  });

  it("should handle partial size with only width", () => {
    const size = { width: 250 } as Size;

    render(
      <NodeResizer size={size}>
        {({ width, height }) => (
          <div data-testid="content">
            {width}x{height}
          </div>
        )}
      </NodeResizer>,
    );

    const content = screen.getByTestId("content");
    expect(content.textContent).toBe("250x50");
  });

  it("should handle partial size with only height", () => {
    const size = { height: 120 } as Size;

    render(
      <NodeResizer size={size}>
        {({ width, height }) => (
          <div data-testid="content">
            {width}x{height}
          </div>
        )}
      </NodeResizer>,
    );

    const content = screen.getByTestId("content");
    expect(content.textContent).toBe("150x120");
  });

  it("should re-render when size changes", () => {
    const { rerender } = render(
      <NodeResizer size={{ width: 200, height: 100 }}>
        {({ width, height }) => (
          <div data-testid="content">
            {width}x{height}
          </div>
        )}
      </NodeResizer>,
    );

    expect(screen.getByTestId("content").textContent).toBe("200x100");

    rerender(
      <NodeResizer size={{ width: 300, height: 150 }}>
        {({ width, height }) => (
          <div data-testid="content">
            {width}x{height}
          </div>
        )}
      </NodeResizer>,
    );

    expect(screen.getByTestId("content").textContent).toBe("300x150");
  });
});
