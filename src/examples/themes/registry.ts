/**
 * @file Runtime helpers for loading and switching example themes.
 */
import defaultThemeCss from "../../themes/default.css?inline";
import window98ThemeCss from "../../themes/window98.css?inline";

export type NodeEditorThemeId = "default" | "window98";

export type NodeEditorTheme = {
  id: NodeEditorThemeId;
  label: string;
  description: string;
  cssText: string;
};

const NODE_EDITOR_THEME_STYLE_ELEMENT_ID = "node-editor-theme-style";
const NODE_EDITOR_THEME_STORAGE_KEY = "node-editor-example-theme";

const AVAILABLE_THEMES: NodeEditorTheme[] = [
  {
    id: "default",
    label: "Default",
    description: "Modern defaults with rounded cards and soft shadows.",
    cssText: defaultThemeCss,
  },
  {
    id: "window98",
    label: "Windows 98",
    description: "Pixel-perfect nostalgia with flat widgets and crisp blue chrome.",
    cssText: window98ThemeCss,
  },
];

/**
 * List all themes that can be selected within the example shell.
 */
export function listAvailableThemes(): NodeEditorTheme[] {
  return AVAILABLE_THEMES;
}

/**
 * Resolve a theme definition by its identifier.
 */
export function resolveTheme(themeId: NodeEditorThemeId): NodeEditorTheme {
  const theme = AVAILABLE_THEMES.find((candidate) => candidate.id === themeId);

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

  let styleElement = document.getElementById(
    NODE_EDITOR_THEME_STYLE_ELEMENT_ID,
  ) as HTMLStyleElement | null;

  if (styleElement === null) {
    styleElement = document.createElement("style");
    styleElement.id = NODE_EDITOR_THEME_STYLE_ELEMENT_ID;
    headElement.appendChild(styleElement);
  }

  styleElement.textContent = theme.cssText;
  styleElement.dataset.themeId = theme.id;

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
