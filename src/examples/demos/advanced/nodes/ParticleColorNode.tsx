/**
 * @file Particle Color Node - Provides particle color control output
 */
import * as React from "react";
import type {
  NodeDefinition,
  NodeRenderProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../../../../types/NodeDefinition";
import classes from "./ParticleColorNode.module.css";

export type ParticleColorData = {
  id: string;
  color: string; // rgb(...) format
  palette: string[];
};

const hexToRgb = (hex: string) => {
  const normalized = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
};

const rgbToHex = (rgb: string) => {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) {
    return "#f97316";
  }
  const [r, g, b] = match.slice(1).map((component) => Number(component));
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const ensureRgb = (color: string) => {
  if (color.startsWith("rgb")) {
    return color;
  }
  if (color.startsWith("#")) {
    return hexToRgb(color);
  }
  return "rgb(249, 115, 22)";
};

const defaultPalette = ["#f97316", "#ec4899", "#8b5cf6", "#6366f1", "#22c55e", "#14b8a6"];

export const ParticleColorRenderer = ({ node, isSelected, isDragging, externalData, onUpdateNode }: NodeRenderProps) => {
  const colorData = externalData as ParticleColorData | undefined;
  const rgbColor = ensureRgb(colorData?.color ?? "rgb(249, 115, 22)");
  const [hexColor, setHexColor] = React.useState(rgbToHex(rgbColor));

  React.useEffect(() => {
    setHexColor(rgbToHex(ensureRgb(colorData?.color ?? rgbColor)));
  }, [colorData?.color, rgbColor]);

  React.useEffect(() => {
    if (!colorData?.color) {
      return;
    }

    const currentOutput = node.data["color-output"] as string | undefined;
    const currentColor = ensureRgb(colorData.color);

    if (currentOutput === currentColor) {
      return;
    }

    onUpdateNode({
      data: {
        ...node.data,
        color: currentColor,
        "color-output": currentColor,
      },
    });
  }, [colorData?.color, node, onUpdateNode]);

  const applyColor = (nextHex: string) => {
    const nextRgb = ensureRgb(nextHex);
    setHexColor(rgbToHex(nextRgb));
    onUpdateNode({
      data: {
        ...node.data,
        color: nextRgb,
        "color-output": nextRgb,
        updatedAt: Date.now(),
      },
    });
  };

  const handlePaletteSelect = (nextHex: string) => {
    applyColor(nextHex);
  };

  return (
    <div
      className={`${classes.container} ${isSelected ? classes.selected : ""} ${isDragging ? classes.dragging : ""}`}
      style={{
        width: node.size?.width,
        height: node.size?.height,
      }}
    >
      <div className={classes.header}>
        <div className={classes.title}>🌈 Particle Color</div>
        <div className={classes.previewWrapper}>
          <div className={classes.colorPreview} style={{ backgroundColor: hexColor }} />
          <span className={classes.previewText}>{hexColor}</span>
        </div>
      </div>

      <input
        className={classes.picker}
        type="color"
        value={hexColor}
        onChange={(event) => applyColor(event.target.value)}
      />

      <div className={classes.palette}>
        {(colorData?.palette ?? defaultPalette).map((paletteColor) => (
          <button
            key={paletteColor}
            type="button"
            className={classes.paletteButton}
            style={{ backgroundColor: paletteColor }}
            onClick={() => handlePaletteSelect(paletteColor)}
            aria-label={`Select ${paletteColor}`}
          />
        ))}
      </div>
    </div>
  );
};

export const ParticleColorInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
  const colorData = externalData as ParticleColorData | undefined;
  const [editedData, setEditedData] = React.useState<ParticleColorData>({
    id: colorData?.id ?? "",
    color: ensureRgb(colorData?.color ?? "rgb(249, 115, 22)"),
    palette: colorData?.palette ?? defaultPalette,
  });

  const handleSave = async () => {
    if (onUpdateExternalData) {
      await onUpdateExternalData(editedData);
    }
  };

  const currentHex = rgbToHex(editedData.color);

  return (
    <div className={classes.inspector}>
      <h3>Particle Color</h3>

      <div className={classes.formGroup}>
        <label htmlFor="particle-color-picker" className={classes.label}>
          Color:
        </label>
        <input
          id="particle-color-picker"
          className={classes.picker}
          type="color"
          value={currentHex}
          onChange={(event) => {
            const nextRgb = ensureRgb(event.target.value);
            setEditedData({ ...editedData, color: nextRgb });
          }}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="particle-color-rgb" className={classes.label}>
          RGB Value:
        </label>
        <input
          id="particle-color-rgb"
          className={classes.input}
          type="text"
          value={editedData.color}
          onChange={(event) => setEditedData({ ...editedData, color: ensureRgb(event.target.value) })}
        />
      </div>

      <button className={classes.saveButton} onClick={handleSave} type="button">
        Save Changes
      </button>
    </div>
  );
};

export const ParticleColorNodeDefinition: NodeDefinition = {
  type: "particle-color",
  displayName: "Particle Color",
  description: "Provides an RGB color output for particle systems",
  category: "Effects",
  defaultData: {
    title: "Particle Color",
  },
  defaultSize: { width: 220, height: 160 },
  ports: [
    {
      id: "color-output",
      type: "output",
      label: "Color",
      position: "right",
    },
  ],
  renderNode: ParticleColorRenderer,
  renderInspector: ParticleColorInspectorRenderer,
  loadExternalData: async (ref: ExternalDataReference) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      id: ref.id,
      color: "rgb(249, 115, 22)",
      palette: defaultPalette,
    } satisfies ParticleColorData;
  },
  updateExternalData: async (_ref: ExternalDataReference, data: unknown) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log("Updated particle color data:", data);
  },
};
