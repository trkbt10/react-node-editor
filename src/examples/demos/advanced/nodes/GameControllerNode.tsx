/**
 * @file Game Controller Node - Interactive game controller visualization
 */
import * as React from "react";
import type {
  NodeDefinition,
  NodeRenderProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../../../../types/NodeDefinition";
import classes from "./GameControllerNode.module.css";

export type GameControllerData = {
  id: string;
  controllerType: "xbox" | "playstation" | "nintendo";
  buttons: {
    a: boolean;
    b: boolean;
    x: boolean;
    y: boolean;
    lb: boolean;
    rb: boolean;
    lt: number; // 0-100
    rt: number; // 0-100
  };
  dpad: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
  };
  leftStick: { x: number; y: number }; // -100 to 100
  rightStick: { x: number; y: number }; // -100 to 100
  connected: boolean;
  battery: number; // 0-100
};

export const GameControllerRenderer = ({ node, isSelected, isDragging, externalData }: NodeRenderProps) => {
  const controllerData = externalData as GameControllerData | undefined;

  const getControllerColor = (type?: string) => {
    switch (type) {
      case "xbox":
        return "#107c10";
      case "playstation":
        return "#003791";
      case "nintendo":
        return "#e60012";
      default:
        return "#6b7280";
    }
  };

  const controllerColor = getControllerColor(controllerData?.controllerType);

  const renderStick = (x: number, y: number) => {
    const centerX = 50;
    const centerY = 50;
    const stickX = centerX + (x / 100) * 30;
    const stickY = centerY + (y / 100) * 30;

    return (
      <svg width="100%" height="100%" viewBox="0 0 100 100">
        <circle cx={centerX} cy={centerY} r="35" fill="#e5e7eb" />
        <circle cx={stickX} cy={stickY} r="20" fill={controllerColor} />
      </svg>
    );
  };

  return (
    <div
      className={`${classes.container} ${isSelected ? classes.selected : ""} ${isDragging ? classes.dragging : ""}`}
      style={{
        width: node.size?.width,
        height: node.size?.height,
        border: `2px solid ${controllerColor}`,
      }}
    >
      <div className={classes.header}>
        <div className={classes.titleInfo}>
          <div className={classes.title}>🎮 {controllerData?.controllerType?.toUpperCase() || "CONTROLLER"}</div>
          <div className={classes.status}>
            {controllerData?.connected ? "✓ Connected" : "✗ Disconnected"} | Battery: {controllerData?.battery || 0}%
          </div>
        </div>
      </div>

      <div className={classes.controllerLayout}>
        <div className={classes.leftSection}>
          <div className={classes.dpad}>
            <div className={`${classes.dpadButton} ${classes.dpadUp} ${controllerData?.dpad.up ? classes.active : ""}`}>
              ▲
            </div>
            <div className={classes.dpadCenter}>
              <div
                className={`${classes.dpadButton} ${classes.dpadLeft} ${controllerData?.dpad.left ? classes.active : ""}`}
              >
                ◀
              </div>
              <div
                className={`${classes.dpadButton} ${classes.dpadRight} ${controllerData?.dpad.right ? classes.active : ""}`}
              >
                ▶
              </div>
            </div>
            <div
              className={`${classes.dpadButton} ${classes.dpadDown} ${controllerData?.dpad.down ? classes.active : ""}`}
            >
              ▼
            </div>
          </div>
          <div className={classes.stick}>
            {renderStick(controllerData?.leftStick.x || 0, controllerData?.leftStick.y || 0)}
          </div>
        </div>

        <div className={classes.rightSection}>
          <div className={classes.faceButtons}>
            <div
              className={`${classes.faceButton} ${classes.buttonY} ${controllerData?.buttons.y ? classes.active : ""}`}
              style={{ backgroundColor: controllerData?.buttons.y ? controllerColor : "#e5e7eb" }}
            >
              Y
            </div>
            <div className={classes.faceButtonRow}>
              <div
                className={`${classes.faceButton} ${classes.buttonX} ${controllerData?.buttons.x ? classes.active : ""}`}
                style={{ backgroundColor: controllerData?.buttons.x ? controllerColor : "#e5e7eb" }}
              >
                X
              </div>
              <div
                className={`${classes.faceButton} ${classes.buttonB} ${controllerData?.buttons.b ? classes.active : ""}`}
                style={{ backgroundColor: controllerData?.buttons.b ? controllerColor : "#e5e7eb" }}
              >
                B
              </div>
            </div>
            <div
              className={`${classes.faceButton} ${classes.buttonA} ${controllerData?.buttons.a ? classes.active : ""}`}
              style={{ backgroundColor: controllerData?.buttons.a ? controllerColor : "#e5e7eb" }}
            >
              A
            </div>
          </div>
          <div className={classes.stick}>
            {renderStick(controllerData?.rightStick.x || 0, controllerData?.rightStick.y || 0)}
          </div>
        </div>
      </div>

      <div className={classes.triggers}>
        <div className={classes.trigger}>
          <div className={classes.triggerLabel}>LT</div>
          <div className={classes.triggerBar}>
            <div
              className={classes.triggerFill}
              style={{ width: `${controllerData?.buttons.lt || 0}%`, backgroundColor: controllerColor }}
            />
          </div>
        </div>
        <div className={classes.trigger}>
          <div className={classes.triggerLabel}>RT</div>
          <div className={classes.triggerBar}>
            <div
              className={classes.triggerFill}
              style={{ width: `${controllerData?.buttons.rt || 0}%`, backgroundColor: controllerColor }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const GameControllerInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
  const controllerData = externalData as GameControllerData | undefined;
  const [editedData, setEditedData] = React.useState<GameControllerData>({
    id: controllerData?.id || "",
    controllerType: controllerData?.controllerType || "xbox",
    buttons: controllerData?.buttons || {
      a: false,
      b: false,
      x: false,
      y: false,
      lb: false,
      rb: false,
      lt: 0,
      rt: 0,
    },
    dpad: controllerData?.dpad || {
      up: false,
      down: false,
      left: false,
      right: false,
    },
    leftStick: controllerData?.leftStick || { x: 0, y: 0 },
    rightStick: controllerData?.rightStick || { x: 0, y: 0 },
    connected: controllerData?.connected ?? true,
    battery: controllerData?.battery || 75,
  });

  const handleSave = async () => {
    if (onUpdateExternalData) {
      await onUpdateExternalData(editedData);
    }
  };

  const randomizeInputs = () => {
    setEditedData((prev) => ({
      ...prev,
      buttons: {
        a: Math.random() > 0.5,
        b: Math.random() > 0.5,
        x: Math.random() > 0.5,
        y: Math.random() > 0.5,
        lb: Math.random() > 0.5,
        rb: Math.random() > 0.5,
        lt: Math.random() * 100,
        rt: Math.random() * 100,
      },
      dpad: {
        up: Math.random() > 0.5,
        down: Math.random() > 0.5,
        left: Math.random() > 0.5,
        right: Math.random() > 0.5,
      },
      leftStick: {
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
      },
      rightStick: {
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
      },
    }));
  };

  return (
    <div className={classes.inspector}>
      <h3>Game Controller</h3>

      <div className={classes.formGroup}>
        <label htmlFor="controller-type" className={classes.label}>
          Controller Type:
        </label>
        <select
          id="controller-type"
          name="controllerType"
          value={editedData.controllerType}
          onChange={(e) =>
            setEditedData({ ...editedData, controllerType: e.target.value as GameControllerData["controllerType"] })
          }
          className={classes.select}
        >
          <option value="xbox">Xbox</option>
          <option value="playstation">PlayStation</option>
          <option value="nintendo">Nintendo</option>
        </select>
      </div>

      <div className={classes.formGroup}>
        <label className={classes.label}>Face Buttons:</label>
        <div className={classes.buttonGrid}>
          <label className={classes.checkboxLabel}>
            <input
              type="checkbox"
              checked={editedData.buttons.a}
              onChange={(e) => setEditedData({ ...editedData, buttons: { ...editedData.buttons, a: e.target.checked } })}
            />
            A
          </label>
          <label className={classes.checkboxLabel}>
            <input
              type="checkbox"
              checked={editedData.buttons.b}
              onChange={(e) => setEditedData({ ...editedData, buttons: { ...editedData.buttons, b: e.target.checked } })}
            />
            B
          </label>
          <label className={classes.checkboxLabel}>
            <input
              type="checkbox"
              checked={editedData.buttons.x}
              onChange={(e) => setEditedData({ ...editedData, buttons: { ...editedData.buttons, x: e.target.checked } })}
            />
            X
          </label>
          <label className={classes.checkboxLabel}>
            <input
              type="checkbox"
              checked={editedData.buttons.y}
              onChange={(e) => setEditedData({ ...editedData, buttons: { ...editedData.buttons, y: e.target.checked } })}
            />
            Y
          </label>
        </div>
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="left-trigger" className={classes.label}>
          Left Trigger: {Math.round(editedData.buttons.lt)}%
        </label>
        <input
          id="left-trigger"
          name="leftTrigger"
          type="range"
          min="0"
          max="100"
          value={editedData.buttons.lt}
          onChange={(e) =>
            setEditedData({ ...editedData, buttons: { ...editedData.buttons, lt: Number(e.target.value) } })
          }
          className={classes.slider}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="right-trigger" className={classes.label}>
          Right Trigger: {Math.round(editedData.buttons.rt)}%
        </label>
        <input
          id="right-trigger"
          name="rightTrigger"
          type="range"
          min="0"
          max="100"
          value={editedData.buttons.rt}
          onChange={(e) =>
            setEditedData({ ...editedData, buttons: { ...editedData.buttons, rt: Number(e.target.value) } })
          }
          className={classes.slider}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="battery" className={classes.label}>
          Battery: {editedData.battery}%
        </label>
        <input
          id="battery"
          name="battery"
          type="range"
          min="0"
          max="100"
          value={editedData.battery}
          onChange={(e) => setEditedData({ ...editedData, battery: Number(e.target.value) })}
          className={classes.slider}
        />
      </div>

      <div className={classes.formGroup}>
        <label className={classes.checkboxLabel}>
          <input
            type="checkbox"
            checked={editedData.connected}
            onChange={(e) => setEditedData({ ...editedData, connected: e.target.checked })}
          />
          Connected
        </label>
      </div>

      <button onClick={randomizeInputs} className={classes.randomButton}>
        🎲 Randomize Inputs
      </button>

      <button onClick={handleSave} className={classes.saveButton}>
        Save Changes
      </button>
    </div>
  );
};

export const GameControllerNodeDefinition: NodeDefinition = {
  type: "game-controller",
  displayName: "Game Controller",
  description: "Interactive game controller visualization",
  category: "Gaming",
  defaultData: {
    title: "Game Controller",
  },
  defaultSize: { width: 340, height: 220 },
  ports: [
    {
      id: "input-data",
      type: "input",
      label: "Input Data",
      position: "left",
    },
    {
      id: "output-actions",
      type: "output",
      label: "Actions",
      position: "right",
    },
  ],
  renderNode: GameControllerRenderer,
  renderInspector: GameControllerInspectorRenderer,
  loadExternalData: async (ref: ExternalDataReference) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      id: ref.id,
      controllerType: "xbox",
      buttons: {
        a: false,
        b: true,
        x: false,
        y: false,
        lb: false,
        rb: false,
        lt: 25,
        rt: 50,
      },
      dpad: {
        up: false,
        down: false,
        left: true,
        right: false,
      },
      leftStick: { x: -30, y: 40 },
      rightStick: { x: 20, y: -50 },
      connected: true,
      battery: 75,
    };
  },
  updateExternalData: async (_ref: ExternalDataReference, data: unknown) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log("Updated game controller data:", data);
  },
};
