/**
 * @file JavaScript Code Node - Code editor for particle physics functions
 */
import * as React from "react";
import type {
  NodeDefinition,
  NodeRendererProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../../../../../types/NodeDefinition";
import classes from "./JavaScriptCodeNode.module.css";

export type JavaScriptCodeData = {
  id: string;
  code: string;
  label: string;
};

export const JavaScriptCodeRenderer = ({
  node,
  isSelected,
  isDragging,
  externalData,
  onUpdateNode,
}: NodeRendererProps) => {
  const codeData = externalData as JavaScriptCodeData | undefined;
  const [localCode, setLocalCode] = React.useState(codeData?.code || "");

  React.useEffect(() => {
    if (codeData?.code !== undefined) {
      setLocalCode(codeData.code);
    }
  }, [codeData?.code]);

  const handleCodeChange = (newCode: string) => {
    setLocalCode(newCode);
  };

  const handleApply = () => {
    onUpdateNode({
      data: {
        ...node.data,
        code: localCode,
        timestamp: Date.now(),
      },
    });
  };

  const lineCount = localCode.split("\n").length;

  return (
    <div
      className={`${classes.container} ${isSelected ? classes.selected : ""} ${isDragging ? classes.dragging : ""}`}
      style={{
        width: node.size?.width,
        height: node.size?.height,
        border: "2px solid #f59e0b",
      }}
    >
      <div className={classes.header}>
        <div className={classes.title}>📝 {codeData?.label || "JavaScript"}</div>
        <div className={classes.badge}>{lineCount} lines</div>
      </div>

      <textarea
        className={classes.codeEditor}
        value={localCode}
        onChange={(e) => handleCodeChange(e.target.value)}
        placeholder="// Write JavaScript code here&#x0A;particle.x += particle.vx;&#x0A;particle.y += particle.vy;"
        spellCheck={false}
      />

      <div className={classes.footer}>
        <button onClick={handleApply} className={classes.applyButton} type="button">
          Apply Code
        </button>
        <div className={classes.info}>{localCode.length} chars</div>
      </div>
    </div>
  );
};

export const JavaScriptCodeInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
  const codeData = externalData as JavaScriptCodeData | undefined;
  const [editedData, setEditedData] = React.useState<JavaScriptCodeData>({
    id: codeData?.id || "",
    code: codeData?.code || "",
    label: codeData?.label || "JavaScript",
  });

  const handleSave = async () => {
    if (onUpdateExternalData) {
      await onUpdateExternalData(editedData);
    }
  };

  return (
    <div className={classes.inspector}>
      <h3>JavaScript Code</h3>

      <div className={classes.formGroup}>
        <label htmlFor="code-label" className={classes.label}>
          Label:
        </label>
        <input
          id="code-label"
          name="codeLabel"
          type="text"
          value={editedData.label}
          onChange={(e) => setEditedData({ ...editedData, label: e.target.value })}
          className={classes.input}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="code-content" className={classes.label}>
          Code:
        </label>
        <textarea
          id="code-content"
          name="codeContent"
          value={editedData.code}
          onChange={(e) => setEditedData({ ...editedData, code: e.target.value })}
          className={classes.codeEditor}
          rows={12}
          spellCheck={false}
        />
      </div>

      <div className={classes.usage}>
        <strong>Usage for Particle Physics:</strong>
        <ul>
          <li>Available variables: particle, gravity, lifetime</li>
          <li>particle.x, particle.y: Position</li>
          <li>particle.vx, particle.vy: Velocity</li>
          <li>particle.life: Remaining life (0-1)</li>
          <li>Example: particle.x += particle.vx;</li>
        </ul>
      </div>

      <button onClick={handleSave} className={classes.saveButton}>
        Save Changes
      </button>
    </div>
  );
};

export const JavaScriptCodeNodeDefinition: NodeDefinition = {
  type: "javascript-code",
  displayName: "JavaScript Code",
  description: "Code editor for custom particle physics functions",
  category: "Code",
  defaultData: {
    title: "JavaScript Code",
  },
  defaultSize: { width: 320, height: 240 },
  ports: [
    {
      id: "code-output",
      type: "output",
      label: "Code",
      position: "right",
    },
  ],
  renderNode: JavaScriptCodeRenderer,
  renderInspector: JavaScriptCodeInspectorRenderer,
  loadExternalData: async (ref: ExternalDataReference) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      id: ref.id,
      code: `// Custom particle physics
particle.x += particle.vx;
particle.y += particle.vy;
particle.vy += gravity * 0.1;
particle.life -= 1 / (lifetime * 60);`,
      label: "Physics Code",
    };
  },
  updateExternalData: async (_ref: ExternalDataReference, data: unknown) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log("Updated JavaScript code data:", data);
  },
};
