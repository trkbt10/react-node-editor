/**
 * Feature flags for node editor migration
 */

export type NodeEditorFeatureFlags = {
  /**
   * When true, uses the new port inference system exclusively
   * When false, maintains backward compatibility with embedded ports
   */
  useInferredPortsOnly: boolean;
};

/**
 * Default feature flags - start with backward compatibility enabled
 */
export const defaultFeatureFlags: NodeEditorFeatureFlags = {
  useInferredPortsOnly: false,
};

/**
 * Get feature flags from environment or local storage
 */
export function getFeatureFlags(): NodeEditorFeatureFlags {
  // Check environment variables first
  if (typeof process !== "undefined" && process.env) {
    return {
      useInferredPortsOnly: process.env.NODE_EDITOR_USE_INFERRED_PORTS_ONLY === "true",
    };
  }

  // Check local storage for development
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem("nodeEditorFeatureFlags");
      if (stored) {
        return { ...defaultFeatureFlags, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn("Failed to parse feature flags from localStorage", e);
    }
  }

  return defaultFeatureFlags;
}

/**
 * Set feature flags in local storage (for development/testing)
 */
export function setFeatureFlags(flags: Partial<NodeEditorFeatureFlags>): void {
  if (typeof window !== "undefined" && window.localStorage) {
    const current = getFeatureFlags();
    const updated = { ...current, ...flags };
    window.localStorage.setItem("nodeEditorFeatureFlags", JSON.stringify(updated));

    // Reload to apply changes
    if (flags.useInferredPortsOnly !== current.useInferredPortsOnly) {
      console.log("Port inference mode changed. Reload required for changes to take effect.");
    }
  }
}

/**
 * React hook for feature flags
 */
export function useFeatureFlags(): NodeEditorFeatureFlags {
  const [flags, setFlags] = React.useState(getFeatureFlags);

  React.useEffect(() => {
    // Listen for storage changes
    const handleStorageChange = () => {
      setFlags(getFeatureFlags());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return flags;
}

// For React import
import * as React from "react";
