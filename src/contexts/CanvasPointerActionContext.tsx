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

type CanvasPointerActionRegistryContextValue = {
  registerInjection: (injection: CanvasPointerActionInjection) => () => void;
  applyInjections: (handlers: CanvasPointerEventHandlers) => CanvasPointerEventHandlers;
};

const CanvasPointerActionRegistryContext =
  React.createContext<CanvasPointerActionRegistryContextValue | null>(null);
CanvasPointerActionRegistryContext.displayName = "CanvasPointerActionRegistryContext";

export const CanvasPointerActionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const injectionsRef = React.useRef<CanvasPointerActionInjection[]>([]);
  const [version, bumpVersion] = React.useReducer((current: number) => current + 1, 0);

  const registerInjection = React.useCallback((injection: CanvasPointerActionInjection) => {
    injectionsRef.current = [...injectionsRef.current, injection];
    bumpVersion();
    return () => {
      injectionsRef.current = injectionsRef.current.filter((candidate) => candidate !== injection);
      bumpVersion();
    };
  }, []);

  const applyInjections = React.useCallback(
    (handlers: CanvasPointerEventHandlers): CanvasPointerEventHandlers => {
      if (injectionsRef.current.length === 0) {
        return handlers;
      }
      return injectionsRef.current.reduce<CanvasPointerEventHandlers>((acc, injection) => injection(acc), handlers);
    },
    [version],
  );

  const contextValue = React.useMemo<CanvasPointerActionRegistryContextValue>(
    () => ({
      registerInjection,
      applyInjections,
    }),
    [registerInjection, applyInjections],
  );

  return (
    <CanvasPointerActionRegistryContext.Provider value={contextValue}>
      {children}
    </CanvasPointerActionRegistryContext.Provider>
  );
};

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

/*
debug-notes:
- Reviewed src/contexts/KeyboardShortcutContext.tsx to mirror registration lifecycle handling while designing the pointer action registry.
- Referenced .code_styles/event-system.ts to align reducer-free event bus composition patterns with repository expectations.
*/
