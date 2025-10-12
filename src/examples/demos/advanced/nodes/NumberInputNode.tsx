/**
 * @file Number Input Node - Numeric value input with slider
 */
import * as React from "react";
import type {
  NodeDefinition,
  NodeRenderProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../../../../types/NodeDefinition";
import classes from "./NumberInputNode.module.css";

export type NumberInputData = {
  id: string;
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
};

export const NumberInputRenderer = ({ node, isSelected, isDragging, externalData, onUpdateNode }: NodeRenderProps) => {
  const numberData = externalData as NumberInputData | undefined;
  const [value, setValue] = React.useState(numberData?.value || 0);

  React.useEffect(() => {
    if (numberData?.value !== undefined) {
      setValue(numberData.value);
    }
  }, [numberData?.value]);

  const handleChange = (newValue: number) => {
    setValue(newValue);
    onUpdateNode({
      data: {
        ...node.data,
        value: newValue,
        timestamp: Date.now(),
      },
    });
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
        <div className={classes.title}>🔢 {numberData?.label || "Number"}</div>
        <div className={classes.value}>{value}</div>
      </div>

      <div className={classes.sliderContainer}>
        <input
          type="range"
          min={numberData?.min || 0}
          max={numberData?.max || 100}
          step={numberData?.step || 1}
          value={value}
          onChange={(e) => handleChange(Number(e.target.value))}
          className={classes.slider}
        />
      </div>

      <div className={classes.range}>
        {numberData?.min || 0} - {numberData?.max || 100}
      </div>
    </div>
  );
};

export const NumberInputInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
  const numberData = externalData as NumberInputData | undefined;
  const [editedData, setEditedData] = React.useState<NumberInputData>({
    id: numberData?.id || "",
    value: numberData?.value || 0,
    min: numberData?.min || 0,
    max: numberData?.max || 100,
    step: numberData?.step || 1,
    label: numberData?.label || "Number",
  });

  const handleSave = async () => {
    if (onUpdateExternalData) {
      await onUpdateExternalData(editedData);
    }
  };

  return (
    <div className={classes.inspector}>
      <h3>Number Input</h3>

      <div className={classes.formGroup}>
        <label htmlFor="number-label" className={classes.label}>
          Label:
        </label>
        <input
          id="number-label"
          name="numberLabel"
          type="text"
          value={editedData.label}
          onChange={(e) => setEditedData({ ...editedData, label: e.target.value })}
          className={classes.input}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="number-value" className={classes.label}>
          Current Value: {editedData.value}
        </label>
        <input
          id="number-value"
          name="numberValue"
          type="number"
          value={editedData.value}
          onChange={(e) => setEditedData({ ...editedData, value: Number(e.target.value) })}
          className={classes.input}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="number-min" className={classes.label}>
          Minimum:
        </label>
        <input
          id="number-min"
          name="numberMin"
          type="number"
          value={editedData.min}
          onChange={(e) => setEditedData({ ...editedData, min: Number(e.target.value) })}
          className={classes.input}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="number-max" className={classes.label}>
          Maximum:
        </label>
        <input
          id="number-max"
          name="numberMax"
          type="number"
          value={editedData.max}
          onChange={(e) => setEditedData({ ...editedData, max: Number(e.target.value) })}
          className={classes.input}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="number-step" className={classes.label}>
          Step:
        </label>
        <input
          id="number-step"
          name="numberStep"
          type="number"
          value={editedData.step}
          onChange={(e) => setEditedData({ ...editedData, step: Number(e.target.value) })}
          className={classes.input}
          step="0.1"
        />
      </div>

      <button onClick={handleSave} className={classes.saveButton}>
        Save Changes
      </button>
    </div>
  );
};

export const NumberInputNodeDefinition: NodeDefinition = {
  type: "number-input",
  displayName: "Number Input",
  description: "Numeric value input with configurable range",
  category: "Input",
  defaultData: {
    title: "Number Input",
  },
  defaultSize: { width: 200, height: 140 },
  ports: [
    {
      id: "value-output",
      type: "output",
      label: "Value",
      position: "right",
    },
  ],
  renderNode: NumberInputRenderer,
  renderInspector: NumberInputInspectorRenderer,
  loadExternalData: async (ref: ExternalDataReference) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      id: ref.id,
      value: 10,
      min: 0,
      max: 100,
      step: 1,
      label: "Number",
    };
  },
  updateExternalData: async (_ref: ExternalDataReference, data: unknown) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log("Updated number input data:", data);
  },
};
