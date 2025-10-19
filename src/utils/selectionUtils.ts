/**
 * @file Helper utilities for managing ordered node selection sets.
 */

export const addUniqueIds = (base: string[], additions: string[]): string[] => {
  if (additions.length === 0) {
    return base.slice();
  }
  const baseSet = new Set(base);
  const result = base.slice();

  additions.forEach((id) => {
    if (!baseSet.has(id)) {
      baseSet.add(id);
      result.push(id);
    }
  });

  return result;
};

export const toggleIds = (base: string[], toggles: string[]): string[] => {
  if (toggles.length === 0) {
    return base.slice();
  }

  const uniqueToggles = Array.from(new Set(toggles));
  const toggleSet = new Set(uniqueToggles);
  const baseSet = new Set(base);

  const result: string[] = [];

  base.forEach((id) => {
    if (!toggleSet.has(id)) {
      result.push(id);
    } else {
      baseSet.delete(id);
    }
  });

  uniqueToggles.forEach((id) => {
    if (!baseSet.has(id)) {
      result.push(id);
    }
  });

  return result;
};
