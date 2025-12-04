/**
 * @file Context for centralizing canvas pointer event handler composition.
 */
import * as React from "react";

export type CanvasPointerEventHandlers = Readonly<
  Partial<{
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  }>
>;

export type CanvasPointerActionInjection = (handlers: CanvasPointerEventHandlers) => CanvasPointerEventHandlers;

export type CanvasPointerActionRegistryContextValue = {
  registerInjection: (injection: CanvasPointerActionInjection) => () => void;
  applyInjections: (handlers: CanvasPointerEventHandlers) => CanvasPointerEventHandlers;
};

export const CanvasPointerActionRegistryContext =
  React.createContext<CanvasPointerActionRegistryContextValue | null>(null);
CanvasPointerActionRegistryContext.displayName = "CanvasPointerActionRegistryContext";

export const useCanvasPointerActionRegistry = (): CanvasPointerActionRegistryContextValue => {
  const context = React.useContext(CanvasPointerActionRegistryContext);
  if (!context) {
    throw new Error("useCanvasPointerActionRegistry must be used within a CanvasPointerActionProvider");
  }
  return context;
};

export const useCanvasPointerActionInjection = (
  injection: CanvasPointerActionInjection,
  dependencies: React.DependencyList = [],
): void => {
  const { registerInjection } = useCanvasPointerActionRegistry();
  const memoizedInjection = React.useCallback(injection, dependencies);

  React.useEffect(() => {
    return registerInjection(memoizedInjection);
  }, [registerInjection, memoizedInjection]);
};
