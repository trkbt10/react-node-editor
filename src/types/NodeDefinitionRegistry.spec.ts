/**
 * @file Unit tests for NodeDefinitionRegistry fallback functionality
 */

import { createNodeDefinitionRegistry, type FallbackDefinition } from "./NodeDefinitionRegistry";
import type { NodeDefinition } from "./NodeDefinition";

describe("createNodeDefinitionRegistry", () => {
  const createTestDefinition = (type: string): NodeDefinition => ({
    type,
    displayName: `${type} Node`,
    ports: [],
  });

  describe("basic operations", () => {
    it("should register and retrieve a definition", () => {
      const registry = createNodeDefinitionRegistry();
      const def = createTestDefinition("test");

      registry.register(def);
      const result = registry.get("test");

      expect(result).toBe(def);
    });

    it("should return undefined for unregistered type without fallback", () => {
      const registry = createNodeDefinitionRegistry();

      const result = registry.get("unknown");

      expect(result).toBeUndefined();
    });

    it("should unregister a definition", () => {
      const registry = createNodeDefinitionRegistry();
      const def = createTestDefinition("test");

      registry.register(def);
      registry.unregister("test");
      const result = registry.get("test");

      expect(result).toBeUndefined();
    });
  });

  describe("fallback functionality", () => {
    it("should return fallback definition for unknown type when set", () => {
      const registry = createNodeDefinitionRegistry();
      const fallbackDef = createTestDefinition("fallback");

      registry.setFallback(fallbackDef);
      const result = registry.get("unknown");

      expect(result).toBe(fallbackDef);
    });

    it("should return registered definition over fallback", () => {
      const registry = createNodeDefinitionRegistry();
      const registeredDef = createTestDefinition("test");
      const fallbackDef = createTestDefinition("fallback");

      registry.register(registeredDef);
      registry.setFallback(fallbackDef);
      const result = registry.get("test");

      expect(result).toBe(registeredDef);
    });

    it("should call fallback factory function with unknown type", () => {
      const registry = createNodeDefinitionRegistry();
      const calledWith: string[] = [];
      const fallbackFactory = (type: string) => {
        calledWith.push(type);
        return createTestDefinition(`error-${type}`);
      };

      registry.setFallback(fallbackFactory);
      const result = registry.get("custom-type");

      expect(calledWith).toContain("custom-type");
      expect(result?.type).toBe("error-custom-type");
    });

    it("should clear fallback definition", () => {
      const registry = createNodeDefinitionRegistry();
      const fallbackDef = createTestDefinition("fallback");

      registry.setFallback(fallbackDef);
      registry.clearFallback();
      const result = registry.get("unknown");

      expect(result).toBeUndefined();
    });

    it("should report hasFallback correctly", () => {
      const registry = createNodeDefinitionRegistry();
      const fallbackDef = createTestDefinition("fallback");

      expect(registry.hasFallback()).toBe(false);

      registry.setFallback(fallbackDef);
      expect(registry.hasFallback()).toBe(true);

      registry.clearFallback();
      expect(registry.hasFallback()).toBe(false);
    });

    it("should expose fallbackDefinition property", () => {
      const registry = createNodeDefinitionRegistry();
      const fallbackDef = createTestDefinition("fallback");

      expect(registry.fallbackDefinition).toBeUndefined();

      registry.setFallback(fallbackDef);
      expect(registry.fallbackDefinition).toBe(fallbackDef);
    });
  });

  describe("getAll and getByCategory", () => {
    it("should not include dynamically generated fallback definitions in getAll", () => {
      const registry = createNodeDefinitionRegistry();
      const def1 = createTestDefinition("type1");
      const fallbackFactory: FallbackDefinition = (type: string) => createTestDefinition(`error-${type}`);

      registry.register(def1);
      registry.setFallback(fallbackFactory);

      // Trigger fallback
      registry.get("unknown-type");

      const all = registry.getAll();
      expect(all).toHaveLength(1);
      expect(all[0]).toBe(def1);
    });

    it("should filter by category correctly", () => {
      const registry = createNodeDefinitionRegistry();
      const def1: NodeDefinition = { ...createTestDefinition("type1"), category: "cat1" };
      const def2: NodeDefinition = { ...createTestDefinition("type2"), category: "cat2" };
      const def3: NodeDefinition = { ...createTestDefinition("type3"), category: "cat1" };

      registry.register(def1);
      registry.register(def2);
      registry.register(def3);

      const cat1Defs = registry.getByCategory("cat1");
      expect(cat1Defs).toHaveLength(2);
      expect(cat1Defs).toContain(def1);
      expect(cat1Defs).toContain(def3);
    });
  });
});
