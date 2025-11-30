/**
 * @file Color utilities for node styling
 */

/**
 * Calculate text color (black or white) based on background color brightness
 */
export const getTextColor = (bgColor: string): string => {
  const color = bgColor.replace("#", "");
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#ffffff";
};

/**
 * Get color for programming language
 */
export const getLanguageColor = (lang?: string): string => {
  switch (lang) {
    case "javascript":
      return "#f7df1e";
    case "typescript":
      return "#3178c6";
    case "python":
      return "#3776ab";
    case "rust":
      return "#dea584";
    case "go":
      return "#00add8";
    default:
      return "#6b7280";
  }
};
