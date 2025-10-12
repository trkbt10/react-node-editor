/**
 * @file Particle Size Node - Provides particle size control output
 */
import * as React from "react";
import type {
  NodeDefinition,
  NodeRenderProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../../../../types/NodeDefinition";
import classes from "./ParticleSizeNode.module.css";

export type ParticleSizeData = {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
};

export const ParticleSizeRenderer = ({ node, isSelected, isDragging, externalData, onUpdateNode }: NodeRenderProps) => {
  const sizeData = externalData as ParticleSizeData | undefined;
  const [value, setValue] = React.useState(sizeData?.value ?? 4);
  const lastExternalValueRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (sizeData?.value !== undefined) {
      setValue(sizeData.value);
      lastExternalValueRef.current = sizeData.value;
    }
  }, [sizeData?.value]);

  React.useEffect(() => {
    if (sizeData?.value === undefined) {
      lastExternalValueRef.current = undefined;
      return;
    }

    if (lastExternalValueRef.current === sizeData.value) {
      return;
    }

    lastExternalValueRef.current = sizeData.value;

    onUpdateNode({
      data: {
        ...node.data,
        value: sizeData.value,
        "size-output": sizeData.value,
      },
    });
  }, [node.data, onUpdateNode, sizeData?.value]);

  const handleChange = (newValue: number) => {
    setValue(newValue);
    onUpdateNode({
      data: {
        ...node.data,
        value: newValue,
        "size-output": newValue,
        updatedAt: Date.now(),
      },
    });
  };

  const sliderMin = sizeData?.min ?? 1;
  const sliderMax = sizeData?.max ?? 20;
  const sliderStep = sizeData?.step ?? 1;

  return (
    <div
      className={`${classes.container} ${isSelected ? classes.selected : ""} ${isDragging ? classes.dragging : ""}`}
      style={{
        width: node.size?.width,
        height: node.size?.height,
      }}
    >
      <div className={classes.header}>
        <div className={classes.title}>🌀 Particle Size</div>
        <div className={classes.value}>{value}px</div>
      </div>

      <input
        className={classes.slider}
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={value}
        onChange={(event) => handleChange(Number(event.target.value))}
      />

      <div className={classes.range}>
        {sliderMin}px - {sliderMax}px
      </div>
    </div>
  );
};

export const ParticleSizeInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
  const sizeData = externalData as ParticleSizeData | undefined;
  const [editedData, setEditedData] = React.useState<ParticleSizeData>({
    id: sizeData?.id ?? "",
    value: sizeData?.value ?? 4,
    min: sizeData?.min ?? 1,
    max: sizeData?.max ?? 20,
    step: sizeData?.step ?? 1,
  });

  const handleSave = async () => {
    if (onUpdateExternalData) {
      await onUpdateExternalData(editedData);
    }
  };

  return (
    <div className={classes.inspector}>
      <h3>Particle Size</h3>

      <div className={classes.formGroup}>
        <label htmlFor="particle-size-value" className={classes.label}>
          Current Size (px):
        </label>
        <input
          id="particle-size-value"
          className={classes.input}
          type="number"
          min={editedData.min}
          max={editedData.max}
          value={editedData.value}
          onChange={(event) => setEditedData({ ...editedData, value: Number(event.target.value) })}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="particle-size-min" className={classes.label}>
          Minimum (px):
        </label>
        <input
          id="particle-size-min"
          className={classes.input}
          type="number"
          value={editedData.min}
          onChange={(event) => setEditedData({ ...editedData, min: Number(event.target.value) })}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="particle-size-max" className={classes.label}>
          Maximum (px):
        </label>
        <input
          id="particle-size-max"
          className={classes.input}
          type="number"
          value={editedData.max}
          onChange={(event) => setEditedData({ ...editedData, max: Number(event.target.value) })}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="particle-size-step" className={classes.label}>
          Step (px):
        </label>
        <input
          id="particle-size-step"
          className={classes.input}
          type="number"
          step="0.5"
          value={editedData.step}
          onChange={(event) => setEditedData({ ...editedData, step: Number(event.target.value) })}
        />
      </div>

      <button className={classes.saveButton} onClick={handleSave} type="button">
        Save Changes
      </button>
    </div>
  );
};

export const ParticleSizeNodeDefinition: NodeDefinition = {
  type: "particle-size",
  displayName: "Particle Size",
  description: "Adjusts particle size output for connected systems",
  category: "Effects",
  defaultData: {
    title: "Particle Size",
  },
  defaultSize: { width: 220, height: 140 },
  ports: [
    {
      id: "size-output",
      type: "output",
      label: "Size",
      position: "right",
    },
  ],
  renderNode: ParticleSizeRenderer,
  renderInspector: ParticleSizeInspectorRenderer,
  loadExternalData: async (ref: ExternalDataReference) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      id: ref.id,
      value: 6,
      min: 1,
      max: 20,
      step: 1,
    } satisfies ParticleSizeData;
  },
  updateExternalData: async (_ref: ExternalDataReference, data: unknown) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log("Updated particle size data:", data);
  },
};
