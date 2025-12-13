/**
 * @file Vitest setup file for configuring testing environment
 */
import "@testing-library/jest-dom/vitest";

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  key: (index: number) => string | null;
  readonly length: number;
};

const isStorageLike = (value: unknown): value is StorageLike => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<StorageLike>;
  return (
    typeof candidate.getItem === "function" &&
    typeof candidate.setItem === "function" &&
    typeof candidate.removeItem === "function" &&
    typeof candidate.key === "function"
  );
};

const createMemoryStorage = (): StorageLike => {
  const store = new Map<string, string>();

  const getKeyAt = (index: number): string | null => {
    const keys = Array.from(store.keys());
    return keys[index] ?? null;
  };

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index) => getKeyAt(index),
    get length() {
      return store.size;
    },
  };
};

const ensureLocalStorage = (): void => {
  const current = globalThis.localStorage as unknown;
  if (isStorageLike(current) && typeof current.clear === "function") {
    return;
  }

  Object.defineProperty(globalThis, "localStorage", {
    value: createMemoryStorage(),
    configurable: true,
  });
};

ensureLocalStorage();
