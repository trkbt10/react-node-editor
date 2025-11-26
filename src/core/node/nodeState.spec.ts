/**
 * @file Tests for node derived state computations
 */
import { describe, it, expect } from "vitest";
import type { Node, Position, Size, ResizeHandle } from "../../types/core";
import type { NodeDefinition } from "../../types/NodeDefinition";
import {
  computeNodeBehaviorState,
  areNodeBehaviorStatesEqual,
  computeNodeResizeState,
  areNodeResizeStatesEqual,
  computeNodeDisplayGeometry,
  computeIsVisuallyDragging,
  computeNodeDerivedState,
  areNodeDerivedStatesEqual,
  type NodeBehaviorState,
  type NodeResizeState,
} from "./nodeState";

const createNode = (overrides: Partial<Node> = {}): Node => ({
  id: "node-1",
  type: "test",
  position: { x: 100, y: 200 },
  data: { title: "Test" },
  ...overrides,
});

const createResizeContextState = (
  nodeId: string,
  handle: ResizeHandle = "se",
  currentSize: Size = { width: 200, height: 100 },
  currentPosition: Position = { x: 100, y: 200 },
) => ({
  nodeId,
  handle,
  currentSize,
  currentPosition,
});

describe("computeNodeBehaviorState", () => {
  it("returns isGroup: false and isAppearance: false for undefined definition", () => {
    const state = computeNodeBehaviorState(undefined);
    expect(state.isGroup).toBe(false);
    expect(state.isAppearance).toBe(false);
  });

  it("returns isGroup: true for group behavior definition", () => {
    const definition: NodeDefinition = {
      type: "group",
      displayName: "Group",
      behaviors: [{ type: "group" }],
    };
    const state = computeNodeBehaviorState(definition);
    expect(state.isGroup).toBe(true);
    expect(state.isAppearance).toBe(false);
  });

  it("returns isAppearance: true for appearance behavior definition", () => {
    const definition: NodeDefinition = {
      type: "appearance",
      displayName: "Appearance",
      behaviors: [{ type: "appearance" }],
    };
    const state = computeNodeBehaviorState(definition);
    expect(state.isGroup).toBe(false);
    expect(state.isAppearance).toBe(true);
  });
});

describe("areNodeBehaviorStatesEqual", () => {
  it("returns true when both states are equal", () => {
    const prev: NodeBehaviorState = { isGroup: true, isAppearance: false };
    const next: NodeBehaviorState = { isGroup: true, isAppearance: false };
    expect(areNodeBehaviorStatesEqual(prev, next)).toBe(true);
  });

  it("returns false when isGroup differs", () => {
    const prev: NodeBehaviorState = { isGroup: true, isAppearance: false };
    const next: NodeBehaviorState = { isGroup: false, isAppearance: false };
    expect(areNodeBehaviorStatesEqual(prev, next)).toBe(false);
  });

  it("returns false when isAppearance differs", () => {
    const prev: NodeBehaviorState = { isGroup: true, isAppearance: false };
    const next: NodeBehaviorState = { isGroup: true, isAppearance: true };
    expect(areNodeBehaviorStatesEqual(prev, next)).toBe(false);
  });
});

describe("computeNodeResizeState", () => {
  it("returns not resizing when context state is null", () => {
    const state = computeNodeResizeState("node-1", null);
    expect(state.isResizing).toBe(false);
    expect(state.currentHandle).toBeNull();
    expect(state.currentSize).toBeNull();
    expect(state.currentPosition).toBeNull();
  });

  it("returns not resizing when node ID does not match", () => {
    const contextState = createResizeContextState("other-node");
    const state = computeNodeResizeState("node-1", contextState);
    expect(state.isResizing).toBe(false);
  });

  it("returns resizing state when node ID matches", () => {
    const contextState = createResizeContextState("node-1", "nw", { width: 300, height: 150 }, { x: 50, y: 75 });
    const state = computeNodeResizeState("node-1", contextState);
    expect(state.isResizing).toBe(true);
    expect(state.currentHandle).toBe("nw");
    expect(state.currentSize).toEqual({ width: 300, height: 150 });
    expect(state.currentPosition).toEqual({ x: 50, y: 75 });
  });
});

describe("areNodeResizeStatesEqual", () => {
  it("returns true when both are not resizing", () => {
    const prev: NodeResizeState = { isResizing: false, currentHandle: null, currentSize: null, currentPosition: null };
    const next: NodeResizeState = { isResizing: false, currentHandle: null, currentSize: null, currentPosition: null };
    expect(areNodeResizeStatesEqual(prev, next)).toBe(true);
  });

  it("returns false when isResizing differs", () => {
    const prev: NodeResizeState = { isResizing: false, currentHandle: null, currentSize: null, currentPosition: null };
    const next: NodeResizeState = {
      isResizing: true,
      currentHandle: "se",
      currentSize: { width: 100, height: 50 },
      currentPosition: { x: 0, y: 0 },
    };
    expect(areNodeResizeStatesEqual(prev, next)).toBe(false);
  });

  it("returns false when currentSize differs", () => {
    const prev: NodeResizeState = {
      isResizing: true,
      currentHandle: "se",
      currentSize: { width: 100, height: 50 },
      currentPosition: { x: 0, y: 0 },
    };
    const next: NodeResizeState = {
      isResizing: true,
      currentHandle: "se",
      currentSize: { width: 200, height: 50 },
      currentPosition: { x: 0, y: 0 },
    };
    expect(areNodeResizeStatesEqual(prev, next)).toBe(false);
  });

  it("returns false when currentPosition differs", () => {
    const prev: NodeResizeState = {
      isResizing: true,
      currentHandle: "se",
      currentSize: { width: 100, height: 50 },
      currentPosition: { x: 0, y: 0 },
    };
    const next: NodeResizeState = {
      isResizing: true,
      currentHandle: "se",
      currentSize: { width: 100, height: 50 },
      currentPosition: { x: 10, y: 0 },
    };
    expect(areNodeResizeStatesEqual(prev, next)).toBe(false);
  });
});

describe("computeNodeDisplayGeometry", () => {
  it("uses node base size when not resizing and no drag offset", () => {
    const node = createNode({ size: { width: 200, height: 100 } });
    const resizeState: NodeResizeState = {
      isResizing: false,
      currentHandle: null,
      currentSize: null,
      currentPosition: null,
    };
    const geometry = computeNodeDisplayGeometry(node, resizeState, undefined);

    expect(geometry.displaySize).toEqual({ width: 200, height: 100 });
    expect(geometry.displayPosition).toEqual({ x: 100, y: 200 });
  });

  it("uses default size when node has no size", () => {
    const node = createNode({ size: undefined });
    const resizeState: NodeResizeState = {
      isResizing: false,
      currentHandle: null,
      currentSize: null,
      currentPosition: null,
    };
    const geometry = computeNodeDisplayGeometry(node, resizeState, undefined);

    expect(geometry.displaySize).toEqual({ width: 150, height: 50 });
  });

  it("applies drag offset to position", () => {
    const node = createNode({ size: { width: 200, height: 100 } });
    const resizeState: NodeResizeState = {
      isResizing: false,
      currentHandle: null,
      currentSize: null,
      currentPosition: null,
    };
    const dragOffset: Position = { x: 50, y: 25 };
    const geometry = computeNodeDisplayGeometry(node, resizeState, dragOffset);

    expect(geometry.displayPosition).toEqual({ x: 150, y: 225 });
  });

  it("uses resize state when resizing", () => {
    const node = createNode({ size: { width: 200, height: 100 } });
    const resizeState: NodeResizeState = {
      isResizing: true,
      currentHandle: "se",
      currentSize: { width: 300, height: 150 },
      currentPosition: { x: 50, y: 75 },
    };
    const geometry = computeNodeDisplayGeometry(node, resizeState, undefined);

    expect(geometry.displaySize).toEqual({ width: 300, height: 150 });
    expect(geometry.displayPosition).toEqual({ x: 50, y: 75 });
  });
});

describe("computeIsVisuallyDragging", () => {
  it("returns true when isDragging is true", () => {
    expect(computeIsVisuallyDragging(true, undefined)).toBe(true);
  });

  it("returns true when dragOffset is defined", () => {
    expect(computeIsVisuallyDragging(false, { x: 0, y: 0 })).toBe(true);
  });

  it("returns false when neither is set", () => {
    expect(computeIsVisuallyDragging(false, undefined)).toBe(false);
  });
});

describe("computeNodeDerivedState", () => {
  it("computes all derived state properties", () => {
    const node = createNode({ size: { width: 200, height: 100 } });
    const definition: NodeDefinition = {
      type: "test",
      displayName: "Test",
      behaviors: [{ type: "node" }],
    };
    const state = computeNodeDerivedState(node, definition, null, undefined, false, 0);

    expect(state.behaviorState).toBeDefined();
    expect(state.appearance).toBeDefined();
    expect(state.resizeState).toBeDefined();
    expect(state.displayGeometry).toBeDefined();
    expect(state.isVisuallyDragging).toBe(false);
    expect(state.hasChildren).toBe(false);
  });

  it("computes hasChildren based on groupChildrenCount", () => {
    const node = createNode();
    const state = computeNodeDerivedState(node, undefined, null, undefined, false, 5);
    expect(state.hasChildren).toBe(true);
  });
});

describe("areNodeDerivedStatesEqual", () => {
  it("returns true when all states are equal", () => {
    const node = createNode();
    const prev = computeNodeDerivedState(node, undefined, null, undefined, false, 0);
    const next = computeNodeDerivedState(node, undefined, null, undefined, false, 0);
    expect(areNodeDerivedStatesEqual(prev, next)).toBe(true);
  });

  it("returns false when isVisuallyDragging differs", () => {
    const node = createNode();
    const prev = computeNodeDerivedState(node, undefined, null, undefined, false, 0);
    const next = computeNodeDerivedState(node, undefined, null, undefined, true, 0);
    expect(areNodeDerivedStatesEqual(prev, next)).toBe(false);
  });

  it("returns false when hasChildren differs", () => {
    const node = createNode();
    const prev = computeNodeDerivedState(node, undefined, null, undefined, false, 0);
    const next = computeNodeDerivedState(node, undefined, null, undefined, false, 5);
    expect(areNodeDerivedStatesEqual(prev, next)).toBe(false);
  });
});
