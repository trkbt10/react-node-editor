/**
 * @file Game Pad Node - Simple game controller with directional buttons
 */
import * as React from "react";
import type {
  NodeDefinition,
  NodeRendererProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../../../../../types/NodeDefinition";
import classes from "./GamePadNode.module.css";

export type GamePadData = {
  id: string;
  position: { x: number; y: number }; // Current position (0-100)
  lastAction: "up" | "down" | "left" | "right" | "a" | "b" | null;
  moveSpeed: number; // pixels to move per button press
};

export const GamePadRenderer = ({ node, isSelected, isDragging, externalData, onUpdateNode }: NodeRendererProps) => {
  const gamePadData = externalData as GamePadData | undefined;
  const [position, setPosition] = React.useState({ x: 50, y: 50 });
  const [activeButton, setActiveButton] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (gamePadData?.position) {
      setPosition(gamePadData.position);
    }
  }, [gamePadData?.position]);

  const handleAction = (action: GamePadData["lastAction"]) => {
    if (!action) {
      return;
    }

    let newPosition = { ...position };

    // Update position based on action
    switch (action) {
      case "up":
        newPosition.y = Math.max(0, position.y - (gamePadData?.moveSpeed || 10));
        break;
      case "down":
        newPosition.y = Math.min(100, position.y + (gamePadData?.moveSpeed || 10));
        break;
      case "left":
        newPosition.x = Math.max(0, position.x - (gamePadData?.moveSpeed || 10));
        break;
      case "right":
        newPosition.x = Math.min(100, position.x + (gamePadData?.moveSpeed || 10));
        break;
      case "a":
      case "b":
        // Action buttons don't change position
        newPosition = position;
        break;
    }

    setPosition(newPosition);
    setActiveButton(action);

    // Determine button states
    const isAButton = action === "a";
    const isBButton = action === "b";

    // Send data through output ports
    onUpdateNode({
      data: {
        ...node.data,
        lastAction: action,
        position: newPosition,
        timestamp: Date.now(),
        // Output port data
        "position-output": newPosition,
        "a-output": isAButton,
        "b-output": isBButton,
      },
    });

    // Auto-release visual feedback and button states
    setTimeout(() => {
      setActiveButton(null);
      // Release button states after 200ms
      if (isAButton || isBButton) {
        onUpdateNode({
          data: {
            ...node.data,
            lastAction: action,
            position: newPosition,
            "position-output": newPosition,
            "a-output": false,
            "b-output": false,
          },
        });
      }
    }, 200);
  };

  return (
    <div
      className={`${classes.container} ${isSelected ? classes.selected : ""} ${isDragging ? classes.dragging : ""}`}
      style={{
        width: node.size?.width,
        height: node.size?.height,
        border: "2px solid #6366f1",
      }}
    >
      <div className={classes.header}>
        <div className={classes.title}>🎮 Game Pad</div>
        <div className={classes.position}>
          ({Math.round(position.x)}, {Math.round(position.y)})
        </div>
      </div>

      <div className={classes.controls}>
        <div className={classes.dpadSection}>
          <div className={classes.dpad}>
            <button
              className={`${classes.dpadButton} ${activeButton === "up" ? classes.active : ""}`}
              onClick={() => handleAction("up")}
              type="button"
            >
              ▲
            </button>
            <div className={classes.dpadMiddle}>
              <button
                className={`${classes.dpadButton} ${activeButton === "left" ? classes.active : ""}`}
                onClick={() => handleAction("left")}
                type="button"
              >
                ◀
              </button>
              <div className={classes.dpadCenter}>
                <div
                  className={classes.positionIndicator}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                  }}
                />
              </div>
              <button
                className={`${classes.dpadButton} ${activeButton === "right" ? classes.active : ""}`}
                onClick={() => handleAction("right")}
                type="button"
              >
                ▶
              </button>
            </div>
            <button
              className={`${classes.dpadButton} ${activeButton === "down" ? classes.active : ""}`}
              onClick={() => handleAction("down")}
              type="button"
            >
              ▼
            </button>
          </div>
        </div>

        <div className={classes.actionSection}>
          <button
            className={`${classes.actionButton} ${classes.buttonB} ${activeButton === "b" ? classes.active : ""}`}
            onClick={() => handleAction("b")}
            type="button"
          >
            B
          </button>
          <button
            className={`${classes.actionButton} ${classes.buttonA} ${activeButton === "a" ? classes.active : ""}`}
            onClick={() => handleAction("a")}
            type="button"
          >
            A
          </button>
        </div>
      </div>

      <div className={classes.footer}>
        {gamePadData?.lastAction && (
          <div className={classes.lastAction}>Last: {gamePadData.lastAction.toUpperCase()}</div>
        )}
      </div>
    </div>
  );
};

export const GamePadInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
  const gamePadData = externalData as GamePadData | undefined;
  const [editedData, setEditedData] = React.useState<GamePadData>({
    id: gamePadData?.id || "",
    position: gamePadData?.position || { x: 50, y: 50 },
    lastAction: gamePadData?.lastAction || null,
    moveSpeed: gamePadData?.moveSpeed || 10,
  });

  const handleSave = async () => {
    if (onUpdateExternalData) {
      await onUpdateExternalData(editedData);
    }
  };

  return (
    <div className={classes.inspector}>
      <h3>Game Pad Configuration</h3>

      <div className={classes.formGroup}>
        <div className={classes.label}>Current Position:</div>
        <div className={classes.positionDisplay}>
          X: {Math.round(editedData.position.x)} / Y: {Math.round(editedData.position.y)}
        </div>
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="move-speed" className={classes.label}>
          Move Speed: {editedData.moveSpeed}
        </label>
        <input
          id="move-speed"
          name="moveSpeed"
          type="range"
          min="5"
          max="25"
          value={editedData.moveSpeed}
          onChange={(e) => setEditedData({ ...editedData, moveSpeed: Number(e.target.value) })}
          className={classes.slider}
        />
      </div>

      <div className={classes.formGroup}>
        <div className={classes.label}>Last Action:</div>
        <div className={classes.actionDisplay}>{editedData.lastAction?.toUpperCase() || "None"}</div>
      </div>

      <div className={classes.formGroup}>
        <button
          onClick={() => setEditedData({ ...editedData, position: { x: 50, y: 50 } })}
          className={classes.resetButton}
        >
          Reset Position
        </button>
      </div>

      <div className={classes.info}>
        <p>
          Use directional buttons to control position (0-100). Position and actions are sent to connected nodes through
          the Actions output port.
        </p>
      </div>

      <button onClick={handleSave} className={classes.saveButton}>
        Save Changes
      </button>
    </div>
  );
};

export const GamePadNodeDefinition: NodeDefinition = {
  type: "gamepad",
  displayName: "Game Pad",
  description: "Simple game controller with directional buttons and position output",
  category: "Input",
  defaultData: {
    title: "Game Pad",
  },
  defaultSize: { width: 280, height: 220 },
  ports: [
    {
      id: "position-output",
      type: "output",
      label: "Position",
      position: "right",
    },
    {
      id: "a-output",
      type: "output",
      label: "A",
      position: "right",
    },
    {
      id: "b-output",
      type: "output",
      label: "B",
      position: "right",
    },
  ],
  renderNode: GamePadRenderer,
  renderInspector: GamePadInspectorRenderer,
  loadExternalData: async (ref: ExternalDataReference) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      id: ref.id,
      position: { x: 50, y: 50 },
      lastAction: null,
      moveSpeed: 10,
    };
  },
  updateExternalData: async (_ref: ExternalDataReference, data: unknown) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log("Updated gamepad data:", data);
  },
};
