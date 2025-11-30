/**
 * @file Tests for mobile inspector drawer state hook
 */
import { act, renderHook } from "@testing-library/react";
import { useInspectorDrawerState } from "./MobileDrawerExample";

describe("useInspectorDrawerState", () => {
  it("opens when a node is selected on mobile and closes when selection clears", () => {
    const { result } = renderHook(({ isMobile }) => useInspectorDrawerState(isMobile), {
      initialProps: { isMobile: true },
    });

    expect(result.current.isInspectorOpen).toBe(false);

    act(() => {
      result.current.handleNodeSelect(true);
    });
    expect(result.current.isInspectorOpen).toBe(true);

    act(() => {
      result.current.handleNodeSelect(false);
    });
    expect(result.current.isInspectorOpen).toBe(false);
  });

  it("ignores selection updates when not on mobile", () => {
    const { result } = renderHook(({ isMobile }) => useInspectorDrawerState(isMobile), {
      initialProps: { isMobile: false },
    });

    act(() => {
      result.current.handleNodeSelect(true);
    });
    expect(result.current.isInspectorOpen).toBe(false);
  });

  it("respects external drawer state changes", () => {
    const { result } = renderHook(() => useInspectorDrawerState(true));

    act(() => {
      result.current.handleInspectorStateChange(true);
    });
    expect(result.current.isInspectorOpen).toBe(true);

    act(() => {
      result.current.handleInspectorStateChange(false);
    });
    expect(result.current.isInspectorOpen).toBe(false);
  });
});
