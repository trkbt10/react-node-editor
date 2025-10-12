/**
 * @file Type definitions for panel and grid-based layout system
 */
import * as React from "react";

/**
 * Panel position - either a named column position or floating coordinates
 * - 'left': Dock to left side
 * - 'right': Dock to right side
 * - { x, y }: Float at specific coordinates
 */
export type PanelPosition = "left" | "right" | { x: number; y: number };

/**
 * Configuration for a single panel
 */
export type PanelDefinition = {
  /** Panel component/content */
  component: React.ReactNode;
  /** Panel position - column ('left'/'right') or floating coordinates */
  position: PanelPosition;
  /** Whether the panel is initially visible */
  visible?: boolean;

  // Column layout options (when position is 'left' or 'right')
  /** Initial width in pixels (for column layout) */
  initialWidth?: number;
  /** Minimum width in pixels (for column layout) */
  minWidth?: number;
  /** Maximum width in pixels (for column layout) */
  maxWidth?: number;
  /** Whether the panel can be resized (for column layout) */
  resizable?: boolean;
  /** Callback when panel width changes (column mode) */
  onWidthChange?: (width: number) => void;

  // Floating layout options (when position is { x, y })
  /** Size for floating layout */
  size?: { width: number; height: number };
  /** Whether the panel can be dragged (floating mode) */
  draggable?: boolean;
  /** Z-index for stacking order (floating mode) */
  zIndex?: number;
  /** Callback when panel position changes (floating mode) */
  onPositionChange?: (position: { x: number; y: number }) => void;
  /** Callback when panel size changes (floating mode) */
  onSizeChange?: (size: { width: number; height: number }) => void;

  // Common options
  /** Custom CSS class name */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
};

/**
 * Configuration for editor panels - dictionary of labeled panels
 * Each key is a unique label for the panel, value is the panel definition
 *
 * @example
 * ```tsx
 * panels={{
 *   inspector: {
 *     component: <InspectorPanel />,
 *     position: 'right',
 *     initialWidth: 320,
 *   },
 *   library: {
 *     component: <LibraryPanel />,
 *     position: { x: 20, y: 80 },
 *     size: { width: 280, height: 500 },
 *   }
 * }}
 * ```
 */
export type EditorPanelsConfig = Record<string, PanelDefinition>;

// ==================== NEW GRID-BASED LAYOUT SYSTEM ====================

/**
 * Grid track definition with optional resize capability
 */
export type GridTrack = {
  /** Track size (e.g., "1fr", "300px", "auto") */
  size: string;
  /** Whether this track can be resized */
  resizable?: boolean;
  /** Minimum size in pixels (only applies if resizable) */
  minSize?: number;
  /** Maximum size in pixels (only applies if resizable) */
  maxSize?: number;
};

/**
 * Grid-based layout configuration for the editor
 */
export type GridLayoutConfig = {
  /** Grid template areas as 2D array. Example: [["canvas", "inspector"], ["statusbar", "statusbar"]] */
  areas: string[][];
  /** Row track definitions */
  rows: GridTrack[];
  /** Column track definitions */
  columns: GridTrack[];
  /** CSS gap between grid cells */
  gap?: string;
  /** Custom CSS class name */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
};

/**
 * Layer positioning mode
 * - 'grid': Use CSS Grid positioning (gridArea, gridRow, gridColumn)
 * - 'absolute': Position absolutely within parent
 * - 'relative': Position relative to normal flow
 * - 'fixed': Position fixed to viewport
 */
export type LayerPositionMode = "grid" | "absolute" | "relative" | "fixed";

/**
 * Layer definition for grid-based layout system
 * Combines background layers, overlay layers, UI layers, and main canvas into unified system
 */
export type LayerDefinition = {
  /** Unique identifier for the layer */
  id: string;
  /** Layer content/component */
  component: React.ReactNode;
  /** Whether the layer is visible */
  visible?: boolean;

  // Grid positioning (when positionMode is 'grid')
  /** CSS grid-area name */
  gridArea?: string;
  /** CSS grid-row value */
  gridRow?: string;
  /** CSS grid-column value */
  gridColumn?: string;

  // Absolute/Fixed/Relative positioning
  /** Positioning mode */
  positionMode?: LayerPositionMode;
  /**
   * Position coordinates (for absolute/fixed/relative modes)
   * - Numbers are converted to px (e.g., `100` → `100px`)
   * - Strings are used as-is, supporting %, calc(), vw, vh, etc.
   *
   * @example
   * ```tsx
   * // Pixel positioning
   * position: { top: 20, left: 100 }
   *
   * // Percentage positioning
   * position: { left: "50%", top: "25%" }
   *
   * // Centered with transform
   * position: { left: "50%", top: "50%" }
   * // Note: Use layer.style for transform: { transform: "translate(-50%, -50%)" }
   *
   * // Mixed units
   * position: { top: "10vh", right: 20 }
   *
   * // CSS calc()
   * position: { left: "calc(50% - 160px)", top: 0 }
   * ```
   */
  position?: {
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
  };

  // Stacking and dimensions
  /** Z-index for stacking order */
  zIndex?: number;
  /** Width (CSS value or pixels) */
  width?: string | number;
  /** Height (CSS value or pixels) */
  height?: string | number;

  // Interactivity
  /** Whether the layer blocks pointer events (default: true for absolute/fixed, false for grid) */
  pointerEvents?: boolean | "auto" | "none";
  /** Whether the layer can be dragged (for floating layers) */
  draggable?: boolean;
  /** Callback when layer position changes (for draggable layers) */
  onPositionChange?: (position: { x: number; y: number }) => void;

  // Styling
  /** Custom CSS class name */
  className?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
};

/**
 * Configuration for grid-based editor layout
 * Replaces overlayLayers, backgroundLayers, uiOverlayLayers, and main canvas with unified layer system
 *
 * @example
 * ```tsx
 * gridLayout={{
 *   config: {
 *     areas: `
 *       "toolbar toolbar toolbar"
 *       "sidebar canvas inspector"
 *       "statusbar statusbar statusbar"
 *     `,
 *     rows: "auto 1fr auto",
 *     columns: "250px 1fr 320px",
 *     gap: "0",
 *   },
 *   layers: [
 *     {
 *       id: "canvas",
 *       component: <CanvasBase />,
 *       gridArea: "canvas",
 *       zIndex: 0,
 *     },
 *     {
 *       id: "toolbar",
 *       component: <Toolbar />,
 *       gridArea: "toolbar",
 *       zIndex: 1,
 *     },
 *     {
 *       id: "background-grid",
 *       component: <BackgroundGrid />,
 *       gridArea: "canvas",
 *       zIndex: -1,
 *       pointerEvents: false,
 *     },
 *   ]
 * }}
 * ```
 */
export type EditorGridLayout = {
  /** Grid layout configuration */
  config: GridLayoutConfig;
  /** Layers to render in the grid */
  layers: LayerDefinition[];
};
