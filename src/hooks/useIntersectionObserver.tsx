/**
 * @file Shared IntersectionObserver hook with caching per config.
 */
import React, { useEffect } from "react";

const idMaker = () => {
  let id = 0;
  const map = new Map();
  return (ref: unknown) => {
    if (ref === undefined) {
      return undefined;
    }
    if (map.has(ref)) {
      return map.get(ref);
    }
    const nextId = id++;
    map.set(ref, nextId);
    return nextId;
  };
};
const getId = idMaker();
type Unobserve = () => void;
type Callback = (entry: IntersectionObserverEntry) => void;
type SharedObserver = {
  observe: (target: Element, callback: Callback) => Unobserve;
};
const observerCache = new Map<string, SharedObserver>();
const getSharedObserver = (options: IntersectionObserverInit) => {
  const observerKey = `ovs-threshold:${options.threshold}-rootMargin:${options.rootMargin}-root:${getId(options.root)}`;

  if (observerCache.has(observerKey)) {
    return observerCache.get(observerKey)!;
  }
  const observer = new (class {
    #callbackMap = new Map<Element, Callback>();
    #intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const callback = this.#callbackMap.get(entry.target);
        if (callback) {
          callback(entry);
        }
      });
    }, options);
    /** Observe target and invoke callback on entry updates. */
    observe(target: Element, callback: Callback) {
      this.#callbackMap.set(target, callback);
      this.#intersectionObserver.observe(target);
      return () => {
        this.#callbackMap.delete(target);
        this.#intersectionObserver.unobserve(target);
      };
    }
  })();
  observerCache.set(observerKey, observer);

  return observer;
};
const voidClientRect = Object.freeze({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}) as DOMRectReadOnly;

/**
 * Observe an element and expose the latest IntersectionObserver entry fields.
 */
export function useIntersectionObserver<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  { threshold = 0, rootMargin = "0px", root = null }: IntersectionObserverInit,
): {
  readonly boundingClientRect: DOMRectReadOnly;
  readonly intersectionRatio: number;
  readonly intersectionRect: DOMRectReadOnly;
  readonly isIntersecting: boolean;
  readonly rootBounds: DOMRectReadOnly | null;
  readonly target: Element | null;
  readonly time: DOMHighResTimeStamp;
} {
  const [intersection, setIntersection] = React.useState<IntersectionObserverEntry | null>(null);
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const observer = getSharedObserver({
      threshold,
      rootMargin,
      root,
    });
    return observer.observe(ref.current, (entry) => {
      setIntersection({
        isIntersecting: entry.isIntersecting,
        boundingClientRect: entry.boundingClientRect,
        intersectionRatio: entry.intersectionRatio,
        intersectionRect: entry.intersectionRect,
        rootBounds: entry.rootBounds,
        target: entry.target,
        time: entry.time,
      });
    });
  }, [threshold, rootMargin, root, ref.current]);
  return React.useMemo(() => {
    return {
      isIntersecting: intersection?.isIntersecting ?? false,
      boundingClientRect: intersection?.boundingClientRect ?? voidClientRect,
      intersectionRatio: intersection?.intersectionRatio ?? 0,
      intersectionRect: intersection?.intersectionRect ?? voidClientRect,
      rootBounds: intersection?.rootBounds ?? null,
      target: intersection?.target ?? ref.current,
      time: intersection?.time ?? 0,
    };
  }, [intersection]);
}
