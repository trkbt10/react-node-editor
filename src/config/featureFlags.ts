/**
 * @file Feature flag management for node editor configuration.
 *
 * At the moment all feature flags have been retired. This module remains in place to
 * centralize future toggles without forcing a sweeping refactor when a new flag is added.
 */

import * as React from "react";

export type NodeEditorFeatureFlags = Record<string, never>;

export const defaultFeatureFlags: NodeEditorFeatureFlags = {};

/**
 * Retrieve the currently active feature flag set.
 */
export function getFeatureFlags(): NodeEditorFeatureFlags {
  return defaultFeatureFlags;
}

/**
 * Reset feature flag overrides that may have been persisted between sessions.
 */
export function setFeatureFlags(): void {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem("nodeEditorFeatureFlags");
  }
}

/**
 * React hook that exposes the memoized feature flag configuration.
 */
export function useFeatureFlags(): NodeEditorFeatureFlags {
  return React.useMemo(() => defaultFeatureFlags, []);
}
