/**
 * @file Provider component for canvas pointer action registry
 */
import * as React from "react";
import {
  type CanvasPointerActionInjection,
  type CanvasPointerEventHandlers,
  type CanvasPointerActionRegistryContextValue,
  CanvasPointerActionRegistryContext,
} from "./pointer-action-context";

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

/*
debug-notes:
- Reviewed src/contexts/KeyboardShortcutContext.tsx to mirror registration lifecycle handling while designing the pointer action registry.
- Referenced .code_styles/event-system.ts to align reducer-free event bus composition patterns with repository expectations.
*/
