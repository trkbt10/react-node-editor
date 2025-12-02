/**
 * @file Runtime helpers for loading and switching example themes.
 *
 * Theme definitions are imported from the generated file.
 * To add/modify themes, edit scripts/themes-catalog.json and run:
 *   bun run generate:theme-registry
 */
import {
  GENERATED_THEMES,
  type NodeEditorTheme,
  type NodeEditorThemeId,
} from "./generated-themes";

export type { NodeEditorTheme, NodeEditorThemeId };

const NODE_EDITOR_THEME_STYLE_ELEMENT_ID = "node-editor-theme-style";
const NODE_EDITOR_THEME_STORAGE_KEY = "node-editor-example-theme";

function resolveThemeCssHref(cssPath: string): string {
  const baseUrl = import.meta.env.BASE_URL ?? "/";
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedCssPath = cssPath.startsWith("/") ? cssPath.slice(1) : cssPath;

  return `${normalizedBaseUrl}${normalizedCssPath}`;
}

/**
 * List all themes that can be selected within the example shell.
 */
export function listAvailableThemes(): NodeEditorTheme[] {
  return GENERATED_THEMES;
}

/**
 * Resolve a theme definition by its identifier.
 */
export function resolveTheme(themeId: NodeEditorThemeId): NodeEditorTheme {
  const theme = GENERATED_THEMES.find((candidate) => candidate.id === themeId);

  if (theme === undefined) {
    throw new Error(`Unknown node editor theme "${themeId}".`);
  }

  return theme;
}

/**
 * Inject the requested theme into the document head and persist the choice.
 */
export function applyTheme(themeId: NodeEditorThemeId): NodeEditorTheme {
  const theme = resolveTheme(themeId);

  if (typeof document === "undefined") {
    return theme;
  }

  const headElement = document.head;

  if (!headElement) {
    throw new Error("Cannot apply node editor theme because document.head is not available.");
  }

  const existingLinkElement = document.getElementById(NODE_EDITOR_THEME_STYLE_ELEMENT_ID) as HTMLLinkElement | null;

  if (theme.cssPath === "") {
    // Default theme: remove any existing theme link element
    if (existingLinkElement !== null) {
      existingLinkElement.remove();
    }
  } else {
    // Custom theme: create or update link element
    let linkElement = existingLinkElement;

    if (linkElement === null) {
      linkElement = document.createElement("link");
      linkElement.id = NODE_EDITOR_THEME_STYLE_ELEMENT_ID;
      linkElement.rel = "stylesheet";
      headElement.appendChild(linkElement);
    }

    linkElement.href = resolveThemeCssHref(theme.cssPath);
    linkElement.dataset.themeId = theme.id;
  }

  document.documentElement.setAttribute("data-node-editor-theme", theme.id);

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(NODE_EDITOR_THEME_STORAGE_KEY, theme.id);
    }
  } catch {
    /* localStorage access is best-effort */
  }

  return theme;
}

/**
 * Retrieve the previously stored theme identifier if one exists.
 */
export function getStoredThemeId(): NodeEditorThemeId | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const storedThemeId = window.localStorage.getItem(NODE_EDITOR_THEME_STORAGE_KEY);

    if (storedThemeId === null) {
      return undefined;
    }

    return resolveTheme(storedThemeId as NodeEditorThemeId).id;
  } catch {
    return undefined;
  }
}

/**
 * Ensure a theme is applied on initial load based on storage or default value.
 */
export function ensureInitialTheme(): NodeEditorTheme {
  const storedThemeId = getStoredThemeId();
  const initialThemeId = storedThemeId ?? "default";

  return applyTheme(initialThemeId);
}
