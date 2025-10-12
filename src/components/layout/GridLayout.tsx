import * as React from "react";
import type { GridLayoutConfig, LayerDefinition, GridTrack } from "../../types/panels";
import { ResizeHandle } from "./ResizeHandle";
import styles from "./GridLayout.module.css";

export type GridLayoutProps = {
  /** Grid layout configuration */
  config: GridLayoutConfig;
  /** Layer definitions */
  layers: LayerDefinition[];
  /** Additional className */
  className?: string;
  /** Additional style */
  style?: React.CSSProperties;
};

// ============================================================================
// Track Template Utilities
// ============================================================================

/**
 * Get the current size for a specific track
 */
const getTrackSize = (
  track: GridTrack,
  trackSizes: Record<string, number>,
  direction: "row" | "col",
  index: number,
): string => {
  const key = `${direction}-${index}`;
  const currentSize = trackSizes[key];

  if (currentSize !== undefined) {
    return `${currentSize}px`;
  }

  return track.size;
};

/**
 * Build the grid track template string from tracks array
 */
const buildTrackTemplateString = (
  tracks: GridTrack[],
  trackSizes: Record<string, number>,
  direction: "row" | "col",
): string => {
  return tracks.map((track, index) => getTrackSize(track, trackSizes, direction, index)).join(" ");
};

// ============================================================================
// Layer Style Utilities
// ============================================================================

/**
 * Get position mode style
 */
const getPositionModeStyle = (positionMode?: "grid" | "absolute" | "fixed" | "relative"): React.CSSProperties => {
  const mode = positionMode || "grid";
  return { position: mode === "grid" ? "relative" : mode };
};

/**
 * Get grid area positioning styles
 */
const getGridAreaStyle = (layer: LayerDefinition): React.CSSProperties => {
  const mode = layer.positionMode || "grid";
  if (mode !== "grid") {
    return {};
  }

  const style: React.CSSProperties = {};

  if (layer.gridArea) {
    style.gridArea = layer.gridArea;
  }
  if (layer.gridRow) {
    style.gridRow = layer.gridRow;
  }
  if (layer.gridColumn) {
    style.gridColumn = layer.gridColumn;
  }

  // Apply min-size constraints for scrollable grid areas (like canvas)
  if (layer.id === "canvas") {
    style.minWidth = 0;
    style.minHeight = 0;
    style.overflow = "hidden";
  }

  return style;
};

/**
 * Convert position value to CSS string
 */
const formatPositionValue = (value: number | string): string | number => {
  if (typeof value === "number") {
    return `${value}px`;
  }
  return value;
};

/**
 * Get absolute/fixed positioning styles
 */
const getAbsolutePositionStyle = (position?: {
  top?: string | number;
  right?: string | number;
  bottom?: string | number;
  left?: string | number;
}): React.CSSProperties => {
  if (!position) {
    return {};
  }

  const style: React.CSSProperties = {};

  if (position.top !== undefined) {
    style.top = formatPositionValue(position.top);
  }
  if (position.right !== undefined) {
    style.right = formatPositionValue(position.right);
  }
  if (position.bottom !== undefined) {
    style.bottom = formatPositionValue(position.bottom);
  }
  if (position.left !== undefined) {
    style.left = formatPositionValue(position.left);
  }

  return style;
};

/**
 * Get z-index style
 */
const getZIndexStyle = (zIndex?: number): React.CSSProperties => {
  return zIndex !== undefined ? { zIndex } : {};
};

/**
 * Get dimensions styles
 */
const getDimensionsStyle = (width?: number | string, height?: number | string): React.CSSProperties => {
  const style: React.CSSProperties = {};

  if (width !== undefined) {
    style.width = typeof width === "number" ? `${width}px` : width;
  }
  if (height !== undefined) {
    style.height = typeof height === "number" ? `${height}px` : height;
  }

  return style;
};

/**
 * Get pointer events style
 */
const getPointerEventsStyle = (layer: LayerDefinition): React.CSSProperties => {
  const mode = layer.positionMode || "grid";

  if (layer.pointerEvents !== undefined) {
    if (typeof layer.pointerEvents === "boolean") {
      return { pointerEvents: layer.pointerEvents ? "auto" : "none" };
    }
    return { pointerEvents: layer.pointerEvents };
  }

  // Default pointer events based on position mode
  if (mode === "absolute" || mode === "fixed") {
    return { pointerEvents: "auto" };
  }

  return {};
};

/**
 * Build complete layer style object
 */
const buildLayerStyleObject = (layer: LayerDefinition): React.CSSProperties => {
  return {
    ...layer.style,
    ...getPositionModeStyle(layer.positionMode),
    ...getGridAreaStyle(layer),
    ...getAbsolutePositionStyle(layer.position),
    ...getZIndexStyle(layer.zIndex),
    ...getDimensionsStyle(layer.width, layer.height),
    ...getPointerEventsStyle(layer),
  };
};

// ============================================================================
// Key Generation Utilities
// ============================================================================

/**
 * Generate resize handle key
 */
const getResizeHandleKey = (direction: "row" | "col", index: number): string => {
  return `resize-${direction}-${index}`;
};

// ============================================================================
// Resize Utilities
// ============================================================================

/**
 * Apply size constraints (min/max)
 */
const applyConstraints = (size: number, minSize?: number, maxSize?: number): number => {
  let constrainedSize = size;

  if (minSize !== undefined) {
    constrainedSize = Math.max(constrainedSize, minSize);
  }
  if (maxSize !== undefined) {
    constrainedSize = Math.min(constrainedSize, maxSize);
  }

  return constrainedSize;
};

/**
 * Calculate new track size with constraints
 */
const calculateNewTrackSize = (currentSize: number, delta: number, track: GridTrack): number => {
  const newSize = currentSize + delta;
  return applyConstraints(newSize, track.minSize, track.maxSize);
};

/**
 * Create update function for track sizes state
 */
const createTrackSizeUpdater =
  (key: string, currentSize: number, delta: number, track: GridTrack) =>
  (prev: Record<string, number>): Record<string, number> => {
    const newSize = calculateNewTrackSize(currentSize, delta, track);
    return { ...prev, [key]: newSize };
  };

/**
 * GridLayout - Flexible grid-based layout system for node editor
 * Supports unified layer system for background, canvas, overlays, and UI elements
 */
export const GridLayout: React.FC<GridLayoutProps> = ({ config, layers, className, style: styleProp }) => {
  // Track sizes for resizable tracks
  const [trackSizes, setTrackSizes] = React.useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};

    config.columns.forEach((track, index) => {
      if (track.resizable && track.size.endsWith("px")) {
        const key = `col-${index}`;
        initial[key] = parseInt(track.size, 10);
      }
    });

    config.rows.forEach((track, index) => {
      if (track.resizable && track.size.endsWith("px")) {
        const key = `row-${index}`;
        initial[key] = parseInt(track.size, 10);
      }
    });

    return initial;
  });

  // Convert areas array to CSS grid-template-areas string
  const areasString = React.useMemo(() => {
    return config.areas.map((row) => `"${row.join(" ")}"`).join(" ");
  }, [config.areas]);

  // Build grid container style
  const gridStyle = React.useMemo((): React.CSSProperties => {
    return {
      ...config.style,
      ...styleProp,
      gridTemplateAreas: areasString,
      gridTemplateRows: buildTrackTemplateString(config.rows, trackSizes, "row"),
      gridTemplateColumns: buildTrackTemplateString(config.columns, trackSizes, "col"),
      ...(config.gap !== undefined && { gap: config.gap }),
    };
  }, [config, styleProp, areasString, trackSizes]);

  // Handle resize for a specific track
  const handleResize = React.useCallback(
    (direction: "row" | "col", trackIndex: number, delta: number) => {
      const tracks = direction === "row" ? config.rows : config.columns;
      const track = tracks[trackIndex];
      if (!track || !track.resizable) {
        return;
      }

      const key = `${direction}-${trackIndex}`;
      const currentSize = trackSizes[key] ?? (track.size.endsWith("px") ? parseInt(track.size, 10) : 300);

      setTrackSizes(createTrackSizeUpdater(key, currentSize, -delta, track));
    },
    [config.rows, config.columns, trackSizes],
  );


  // Find resizable tracks and their positions
  const resizableColumns = React.useMemo(() => {
    return config.columns.map((track, index) => ({ track, index })).filter(({ track }) => track.resizable);
  }, [config.columns]);

  const resizableRows = React.useMemo(() => {
    return config.rows.map((track, index) => ({ track, index })).filter(({ track }) => track.resizable);
  }, [config.rows]);

  // Separate visible and invisible layers
  const visibleLayers = React.useMemo(() => layers.filter((layer) => layer.visible !== false), [layers]);

  // Track draggable layer positions and drag state
  const [layerPositions, setLayerPositions] = React.useState<Record<string, { x: number; y: number }>>({});
  const [draggingLayerId, setDraggingLayerId] = React.useState<string | null>(null);
  const dragStartRef = React.useRef<{
    x: number;
    y: number;
    initialX: number;
    initialY: number;
    layerId: string;
  } | null>(null);

  // Handle layer drag start
  const handleLayerDragStart = React.useCallback(
    (layerId: string, e: React.MouseEvent) => {
      const isInputElement =
        e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(e.target.tagName);
      if (isInputElement) {
        return;
      }
      const layer = layers.find((l) => l.id === layerId);
      if (!layer?.draggable) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      setDraggingLayerId(layerId);
      const currentPos = layerPositions[layerId] || { x: 0, y: 0 };
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        initialX: currentPos.x,
        initialY: currentPos.y,
        layerId,
      };
    },
    [layers, layerPositions],
  );

  // Handle mouse move and mouse up during drag
  React.useEffect(() => {
    if (!draggingLayerId || !dragStartRef.current) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) {
        return;
      }

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const newPos = {
        x: dragStartRef.current.initialX + deltaX,
        y: dragStartRef.current.initialY + deltaY,
      };

      setLayerPositions((prev) => ({ ...prev, [dragStartRef.current!.layerId]: newPos }));

      const layer = layers.find((l) => l.id === dragStartRef.current!.layerId);
      layer?.onPositionChange?.(newPos);
    };

    const handleMouseUp = () => {
      setDraggingLayerId(null);
      dragStartRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingLayerId, layers]);

  // Build layer style with draggable position
  const buildDraggableLayerStyle = React.useCallback(
    (layer: LayerDefinition): React.CSSProperties => {
      const baseStyle = buildLayerStyleObject(layer);

      if (layer.draggable) {
        const pos = layerPositions[layer.id];
        const isDragging = draggingLayerId === layer.id;

        return {
          ...baseStyle,
          ...(pos && { transform: `translate(${pos.x}px, ${pos.y}px)` }),
          cursor: isDragging ? "grabbing" : "grab",
        };
      }

      return baseStyle;
    },
    [layerPositions, draggingLayerId],
  );

  return (
    <div className={`${styles.gridLayout} ${config.className || ""} ${className || ""}`} style={gridStyle}>
      {visibleLayers.map((layer) => (
        <div
          key={layer.id}
          data-layer-id={layer.id}
          data-draggable={layer.draggable || undefined}
          className={`${styles.gridLayer} ${layer.className || ""}`}
          style={buildDraggableLayerStyle(layer)}
          onMouseDown={layer.draggable ? (e) => handleLayerDragStart(layer.id, e) : undefined}
        >
          {layer.component}
        </div>
      ))}

      {/* Render resize handles for resizable columns */}
      {resizableColumns.map(({ index }) => {
        // Position handle at the left edge of the resizable column
        // This is the boundary between column[index-1] and column[index]
        const areaInColumn = config.areas.find((row) => row[index]);
        if (!areaInColumn) {
          return null;
        }

        return (
          <div
            key={getResizeHandleKey("col", index)}
            data-resizable="true"
            style={{ gridArea: areaInColumn[index] }}
            className={styles.gridLayer}
          >
            <div className={styles.resizeHandleVertical}>
              <ResizeHandle direction="vertical" onResize={(delta) => handleResize("col", index, delta)} />
            </div>
          </div>
        );
      })}

      {/* Render resize handles for resizable rows */}
      {resizableRows.map(({ index }) => {
        // Position handle at the top edge of the resizable row
        // This is the boundary between row[index-1] and row[index]
        const areaInRow = config.areas[index]?.[0];
        if (!areaInRow) {
          return null;
        }

        return (
          <div
            key={getResizeHandleKey("row", index)}
            data-resizable="true"
            style={{ gridArea: areaInRow }}
            className={styles.gridLayer}
          >
            <div className={styles.resizeHandleHorizontal}>
              <ResizeHandle direction="horizontal" onResize={(delta) => handleResize("row", index, delta)} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
