/**
 * @file Runtime helpers for loading and switching example themes.
 */

export type NodeEditorThemeId =
  | "default"
  | "window98"
  | "google"
  | "apple"
  | "xcorp"
  | "github"
  | "github-light"
  | "vscode"
  | "windowsxp"
  | "windows11"
  | "minecraft"
  | "wargames"
  | "stellar"
  | "opal"
  | "unity"
  | "adobe"
  | "figma";

export type NodeEditorTheme = {
  id: NodeEditorThemeId;
  label: string;
  description: string;
  cssPath: string;
};

const NODE_EDITOR_THEME_STYLE_ELEMENT_ID = "node-editor-theme-style";
const NODE_EDITOR_THEME_STORAGE_KEY = "node-editor-example-theme";

function resolveThemeCssHref(cssPath: string): string {
  const baseUrl = import.meta.env.BASE_URL ?? "/";
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedCssPath = cssPath.startsWith("/") ? cssPath.slice(1) : cssPath;

  return `${normalizedBaseUrl}${normalizedCssPath}`;
}

const AVAILABLE_THEMES: NodeEditorTheme[] = [
  {
    id: "default",
    label: "Default",
    description: "Modern defaults with rounded cards and soft shadows.",
    cssPath: "",
  },
  {
    id: "window98",
    label: "Windows 98",
    description: "Pixel-perfect nostalgia with flat widgets and crisp blue chrome.",
    cssPath: "/themes/window98.css",
  },
  {
    id: "google",
    label: "Google",
    description: "Light, friendly surfaces with bold primary accent and Material-inspired shapes.",
    cssPath: "/themes/google.css",
  },
  {
    id: "apple",
    label: "Apple",
    description: "Translucent layers, spacious typography, and vibrant blue accent inspired by apple.com.",
    cssPath: "/themes/apple.css",
  },
  {
    id: "xcorp",
    label: "X",
    description: "High-contrast dark theme with electric blue highlights and glassy surfaces.",
    cssPath: "/themes/xcorp.css",
  },
  {
    id: "github",
    label: "GitHub Dark",
    description: "Dark dimmed look with desaturated neutrals and punchy blue call-to-action.",
    cssPath: "/themes/github.css",
  },
  {
    id: "github-light",
    label: "GitHub Light",
    description: "Clean light theme with GitHub's signature blue and subtle shadows.",
    cssPath: "/themes/github-light.css",
  },
  {
    id: "vscode",
    label: "VS Code",
    description: "Dark code editor theme with precise geometry and VS Code's signature blue.",
    cssPath: "/themes/vscode.css",
  },
  {
    id: "windowsxp",
    label: "Windows XP",
    description: "Blissful gradients, bold blues, and playful glass buttons from the XP era.",
    cssPath: "/themes/windowsxp.css",
  },
  {
    id: "windows11",
    label: "Windows 11",
    description: "Soft acrylic surfaces, centered layouts, and fluent blue accent of modern Windows.",
    cssPath: "/themes/windows11.css",
  },
  {
    id: "minecraft",
    label: "Minecraft",
    description: "Pixel-crafted UI with earthy neutrals and vibrant emerald highlight.",
    cssPath: "/themes/minecraft.css",
  },
  {
    id: "wargames",
    label: "WarGames",
    description: "CRT terminal with glowing green phosphor wireframes inspired by WOPR and DEFCON.",
    cssPath: "/themes/wargames.css",
  },
  {
    id: "stellar",
    label: "Stellar",
    description: "Gray background with dark cards, warm orange accents, and clean flat design.",
    cssPath: "/themes/stellar.css",
  },
  {
    id: "opal",
    label: "Opal",
    description: "Soft pastel aesthetic with gentle purples, warm cream surfaces, and flowing connections.",
    cssPath: "/themes/opal.css",
  },
  {
    id: "unity",
    label: "Unity",
    description: "Professional dark theme with Unity's signature blue accent and flat panel design.",
    cssPath: "/themes/unity.css",
  },
  {
    id: "adobe",
    label: "Adobe",
    description: "Sleek dark interface inspired by Adobe Creative Cloud with refined blue accents.",
    cssPath: "/themes/adobe.css",
  },
  {
    id: "figma",
    label: "Figma",
    description: "Clean light interface with Figma's signature blue and minimal design language.",
    cssPath: "/themes/figma.css",
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
