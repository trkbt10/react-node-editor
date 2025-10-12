/**
 * @file Color utility functions for parsing and manipulating colors.
 */

export type RGB = {
  r: number;
  g: number;
  b: number;
};

/**
 * Parse a color string (hex or rgb/rgba) into RGB components
 * @param input - Color string in hex (#RGB, #RRGGBB) or rgb/rgba format
 * @returns RGB object or null if parsing fails
 */
export function parseColorToRGB(input: string): RGB | null {
  const hex = input.trim();
  const hexMatch = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex);
  if (hexMatch) {
    let v = hexMatch[1];
    if (v.length === 3) {
      v = v
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const num = parseInt(v, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }
  const rgbMatch = /^rgba?\(([^)]+)\)$/.exec(input);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(",").map((p) => p.trim());
    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    if ([r, g, b].every((n) => Number.isFinite(n))) {
      return { r, g, b };
    }
  }
  return null;
}

/**
 * Calculate relative luminance of an RGB color
 * @param rgb - RGB color components
 * @returns Relative luminance value (0-1)
 */
export function getRelativeLuminance(rgb: RGB): number {
  const srgb = [rgb.r, rgb.g, rgb.b]
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/**
 * Get a readable text color (black or white) based on background color
 * Uses WCAG relative luminance formula
 * @param bg - Background color string
 * @returns "#111111" for dark text or "#ffffff" for light text, or undefined if parsing fails
 */
export function getReadableTextColor(bg: string | undefined): string | undefined {
  if (!bg) {
    return undefined;
  }
  const rgb = parseColorToRGB(bg);
  if (!rgb) {
    return undefined;
  }
  const L = getRelativeLuminance(rgb);
  return L > 0.5 ? "#111111" : "#ffffff";
}

/**
 * Convert RGB to rgba string with alpha
 * @param rgb - RGB color components
 * @param alpha - Alpha value (0-1)
 * @returns rgba color string
 */
export function rgbToRgba(rgb: RGB, alpha: number): string {
  const clampedAlpha = Math.min(1, Math.max(0, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampedAlpha})`;
}

/**
 * Apply opacity to a color string
 * @param color - Color string (hex or rgb/rgba)
 * @param opacity - Opacity value (0-1)
 * @returns rgba color string, or original color if parsing fails
 */
export function applyOpacity(color: string, opacity: number): string {
  const rgb = parseColorToRGB(color);
  if (!rgb) {
    return color;
  }
  return rgbToRgba(rgb, opacity);
}
