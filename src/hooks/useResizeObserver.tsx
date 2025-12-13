/**
 * @file Shared ResizeObserver hook with cached observers.
 */
import React from "react";

type Unobserve = () => void;
type Callback = (entry: ResizeObserverEntry, observer: ResizeObserver) => void;
type SharedObserver = {
  observe: (target: Element, callback: Callback) => Unobserve;
};
const observerCache = new Map<string, SharedObserver>();
const getSharedObserver = (options: ResizeObserverOptions) => {
  const observerKey = `ovs-`;
  if (observerCache.has(observerKey)) {
    return observerCache.get(observerKey)!;
  }
  const observer = new (class {
    #callbackMap = new Map<Element, Callback>();
    #resizeObserver = new ResizeObserver((entries, observer) => {
      entries.forEach((entry) => {
        const callback = this.#callbackMap.get(entry.target);
        if (callback) {
          callback(entry, observer);
        }
      });
    });
    observe(target: Element, callback: Callback) {
      this.#callbackMap.set(target, callback);
      this.#resizeObserver.observe(target, options);
      return () => {
        this.#callbackMap.delete(target);
        this.#resizeObserver.unobserve(target);
      };
    }
  })();
  observerCache.set(observerKey, observer);

  return observer;
};
/**
 * Observe element size changes for a given ref.
 * Falls back to returning `undefined` when ResizeObserver is unavailable.
 */
export function useResizeObserver<T extends HTMLElement>(ref: React.RefObject<T | null>, { box }: ResizeObserverOptions) {
  const [entry, setEntry] = React.useState<ResizeObserverEntry | null>(null);
  React.useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    if (!ref.current) {
      return;
    }
    const observer = getSharedObserver({ box });
    return observer.observe(ref.current, (entry) => {
      setEntry(entry);
    });
  }, [box, ref]);
  const rect = React.useMemo(() => {
    if (!entry) {
      return;
    }

    if (entry.borderBoxSize?.length > 0) {
      const size = entry.borderBoxSize[0];
      const rect = new DOMRect(0, 0, size.inlineSize, size.blockSize);
      return rect;
    } else {
      return entry.contentRect;
    }
  }, [entry]);
  return { entry, rect };
}
