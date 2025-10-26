/**
 * @file Unit tests for NodeResizer component
 */
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { NodeResizer, normalizeNodeSize, useNodeResizerContext } from "./NodeResizer";
import type { Size, Node } from "../../types/core";

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

  it("should render with node prop", () => {
    const node: Node = {
      id: "test-node",
      type: "standard",
      position: { x: 0, y: 0 },
      size: { width: 300, height: 150 },
      data: { title: "Test" },
    };

    render(
      <NodeResizer node={node}>
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

  it("should prefer node prop over size prop", () => {
    const node: Node = {
      id: "test-node",
      type: "standard",
      position: { x: 0, y: 0 },
      size: { width: 300, height: 150 },
      data: { title: "Test" },
    };

    render(
      <NodeResizer node={node} size={{ width: 200, height: 100 }}>
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

  it("should handle node without size", () => {
    const node: Node = {
      id: "test-node",
      type: "standard",
      position: { x: 0, y: 0 },
      data: { title: "Test" },
    };

    render(
      <NodeResizer node={node}>
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

  it("should provide node via context when node prop is given", () => {
    const node: Node = {
      id: "test-node",
      type: "standard",
      position: { x: 100, y: 200 },
      size: { width: 300, height: 150 },
      data: { title: "Test Node" },
    };

    const ChildComponent = () => {
      const contextNode = useNodeResizerContext();
      return (
        <div data-testid="context-node">
          {contextNode ? `${contextNode.id}:${contextNode.data.title}` : "no-context"}
        </div>
      );
    };

    render(
      <NodeResizer node={node}>
        {() => <ChildComponent />}
      </NodeResizer>,
    );

    const contextContent = screen.getByTestId("context-node");
    expect(contextContent.textContent).toBe("test-node:Test Node");
  });

  it("should not provide context when only size prop is given", () => {
    const ChildComponent = () => {
      const contextNode = useNodeResizerContext();
      return (
        <div data-testid="context-node">
          {contextNode ? `${contextNode.id}` : "no-context"}
        </div>
      );
    };

    render(
      <NodeResizer size={{ width: 200, height: 100 }}>
        {() => <ChildComponent />}
      </NodeResizer>,
    );

    const contextContent = screen.getByTestId("context-node");
    expect(contextContent.textContent).toBe("no-context");
  });

  it("should return null when useNodeResizerContext is used outside NodeResizer", () => {
    const ChildComponent = () => {
      const contextNode = useNodeResizerContext();
      return (
        <div data-testid="context-node">
          {contextNode ? `${contextNode.id}` : "no-context"}
        </div>
      );
    };

    render(<ChildComponent />);

    const contextContent = screen.getByTestId("context-node");
    expect(contextContent.textContent).toBe("no-context");
  });

  it("should implicitly resolve node from context when no props given", () => {
    const node: Node = {
      id: "outer-node",
      type: "standard",
      position: { x: 0, y: 0 },
      size: { width: 300, height: 150 },
      data: { title: "Outer" },
    };

    const InnerResizer = () => (
      <NodeResizer>
        {({ width, height }) => (
          <div data-testid="inner-content">
            {width}x{height}
          </div>
        )}
      </NodeResizer>
    );

    render(
      <NodeResizer node={node}>
        {() => <InnerResizer />}
      </NodeResizer>,
    );

    const innerContent = screen.getByTestId("inner-content");
    expect(innerContent.textContent).toBe("300x150");
  });

  it("should allow nested NodeResizers with different nodes", () => {
    const outerNode: Node = {
      id: "outer",
      type: "standard",
      position: { x: 0, y: 0 },
      size: { width: 400, height: 200 },
      data: { title: "Outer" },
    };

    const innerNode: Node = {
      id: "inner",
      type: "standard",
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      data: { title: "Inner" },
    };

    render(
      <NodeResizer node={outerNode}>
        {({ width: outerWidth, height: outerHeight }) => (
          <div data-testid="outer-content">
            {outerWidth}x{outerHeight}
            <NodeResizer node={innerNode}>
              {({ width: innerWidth, height: innerHeight }) => (
                <div data-testid="inner-content">
                  {innerWidth}x{innerHeight}
                </div>
              )}
            </NodeResizer>
          </div>
        )}
      </NodeResizer>,
    );

    const outerContent = screen.getByTestId("outer-content");
    const innerContent = screen.getByTestId("inner-content");
    expect(outerContent.textContent).toContain("400x200");
    expect(innerContent.textContent).toBe("200x100");
  });

  it("should use default size when no node or size provided", () => {
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

  it("should allow deeply nested context access", () => {
    const node: Node = {
      id: "top-node",
      type: "standard",
      position: { x: 0, y: 0 },
      size: { width: 500, height: 300 },
      data: { title: "Top Node" },
    };

    const DeepComponent = () => {
      const contextNode = useNodeResizerContext();
      return <div data-testid="deep">{contextNode?.id}</div>;
    };

    const MiddleComponent = () => (
      <NodeResizer>
        {() => <DeepComponent />}
      </NodeResizer>
    );

    render(
      <NodeResizer node={node}>
        {() => <MiddleComponent />}
      </NodeResizer>,
    );

    const deep = screen.getByTestId("deep");
    expect(deep.textContent).toBe("top-node");
  });

  it("should call onResize callback when size changes", () => {
    const calls: Array<{ size: Required<Size>; isResizing: boolean }> = [];
    const onResize = (size: Required<Size>, isResizing: boolean) => {
      calls.push({ size, isResizing });
    };

    const { rerender } = render(
      <NodeResizer size={{ width: 200, height: 100 }} isResizing={false} onResize={onResize}>
        {({ width, height }) => (
          <div data-testid="content">
            {width}x{height}
          </div>
        )}
      </NodeResizer>,
    );

    // Initial render should call onResize
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ size: { width: 200, height: 100 }, isResizing: false });

    // Update size and isResizing
    rerender(
      <NodeResizer size={{ width: 300, height: 150 }} isResizing={true} onResize={onResize}>
        {({ width, height }) => (
          <div data-testid="content">
            {width}x{height}
          </div>
        )}
      </NodeResizer>,
    );

    expect(calls).toHaveLength(2);
    expect(calls[1]).toEqual({ size: { width: 300, height: 150 }, isResizing: true });
  });

  it("should call onResize when isResizing state changes", () => {
    const calls: Array<{ size: Required<Size>; isResizing: boolean }> = [];
    const onResize = (size: Required<Size>, isResizing: boolean) => {
      calls.push({ size, isResizing });
    };

    const { rerender } = render(
      <NodeResizer size={{ width: 200, height: 100 }} isResizing={false} onResize={onResize}>
        {({ width, height }) => (
          <div data-testid="content">
            {width}x{height}
          </div>
        )}
      </NodeResizer>,
    );

    // Clear initial call
    calls.length = 0;

    // Change only isResizing
    rerender(
      <NodeResizer size={{ width: 200, height: 100 }} isResizing={true} onResize={onResize}>
        {({ width, height }) => (
          <div data-testid="content">
            {width}x{height}
          </div>
        )}
      </NodeResizer>,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ size: { width: 200, height: 100 }, isResizing: true });
  });

  it("should work without onResize callback", () => {
    expect(() => {
      render(
        <NodeResizer size={{ width: 200, height: 100 }} isResizing={false}>
          {({ width, height }) => (
            <div data-testid="content">
              {width}x{height}
            </div>
          )}
        </NodeResizer>,
      );
    }).not.toThrow();

    const content = screen.getByTestId("content");
    expect(content.textContent).toBe("200x100");
  });

  it("should call onResize with node size when node prop is provided", () => {
    const calls: Array<{ size: Required<Size>; isResizing: boolean }> = [];
    const onResize = (size: Required<Size>, isResizing: boolean) => {
      calls.push({ size, isResizing });
    };

    const node: Node = {
      id: "test-node",
      type: "standard",
      position: { x: 0, y: 0 },
      size: { width: 400, height: 250 },
      data: { title: "Test" },
    };

    render(
      <NodeResizer node={node} isResizing={true} onResize={onResize}>
        {({ width, height }) => (
          <div data-testid="content">
            {width}x{height}
          </div>
        )}
      </NodeResizer>,
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ size: { width: 400, height: 250 }, isResizing: true });
  });
});
