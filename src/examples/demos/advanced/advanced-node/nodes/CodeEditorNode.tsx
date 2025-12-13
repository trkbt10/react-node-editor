/**
 * @file Code Editor Node - A code editor with syntax highlighting and compilation
 */
import * as React from "react";
import type {
  NodeDefinition,
  NodeRendererProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../../../../../types/NodeDefinition";
import { Button } from "../../../../../components/elements/Button";
import { Textarea } from "../../../../../components/elements/Textarea";
import { getLanguageColor, getTextColor } from "./colorUtils";

export type CodeData = {
  id: string;
  language: string;
  code: string;
  compiled?: boolean;
  errors?: string[];
};

export const CodeEditorRenderer = ({ node, isSelected, isDragging, externalData, onUpdateNode }: NodeRendererProps) => {
  const codeData = externalData as CodeData | undefined;
  const [isEditing, setIsEditing] = React.useState(false);
  const [localCode, setLocalCode] = React.useState(codeData?.code || "");

  React.useEffect(() => {
    setLocalCode(codeData?.code || "");
  }, [codeData?.code]);

  const handleSave = () => {
    onUpdateNode({
      data: {
        ...node.data,
        lastModified: new Date().toISOString(),
      },
    });
    setIsEditing(false);
  };

  const languageColor = getLanguageColor(codeData?.language);
  const textColor = getTextColor(languageColor);

  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: isSelected ? "#f3f4f6" : "#ffffff",
        border: `2px solid ${languageColor}`,
        opacity: isDragging ? 0.7 : 1,
        minHeight: "120px",
        width: node.size?.width,
        height: node.size?.height,
        fontFamily: "monospace",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            backgroundColor: languageColor,
            padding: "2px 8px",
            borderRadius: "4px",
            color: textColor,
          }}
        >
          {codeData?.language?.toUpperCase() || "CODE"}
        </span>
        {codeData?.compiled && <span style={{ fontSize: "12px", color: "#10b981" }}>✓ Compiled</span>}
      </div>

      {isEditing ? (
        <div>
          <Textarea
            id="code-editor-textarea"
            name="codeEditorContent"
            aria-label="Code editor"
            value={localCode}
            onChange={(e) => setLocalCode(e.target.value)}
            style={{
              width: "100%",
              height: "80px",
              fontFamily: "monospace",
              fontSize: "11px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              padding: "8px",
              resize: "none",
            }}
            placeholder="Enter your code here..."
          />
          <div style={{ marginTop: "8px", display: "flex", gap: "4px" }}>
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <pre
            style={{
              fontSize: "11px",
              color: "#374151",
              margin: 0,
              whiteSpace: "pre-wrap",
              maxHeight: "60px",
              overflow: "hidden",
            }}
          >
            {codeData?.code || "// Click to edit code"}
          </pre>
          <Button onClick={() => setIsEditing(true)}>Edit Code</Button>
          {codeData?.errors && codeData.errors.length > 0 && (
            <div style={{ fontSize: "10px", color: "#ef4444" }}>{codeData.errors.length} error(s)</div>
          )}
        </div>
      )}
    </div>
  );
};

export const CodeInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
  const codeData = externalData as CodeData | undefined;
  const [editedData, setEditedData] = React.useState<CodeData>({
    id: codeData?.id || "",
    language: codeData?.language || "javascript",
    code: codeData?.code || "",
    compiled: codeData?.compiled || false,
    errors: codeData?.errors || [],
  });

  const handleSave = async () => {
    if (onUpdateExternalData) {
      await onUpdateExternalData(editedData);
    }
  };

  const simulate = (action: "compile" | "run" | "test") => {
    switch (action) {
      case "compile":
        setEditedData((prev) => ({
          ...prev,
          compiled: Math.random() > 0.3,
          errors: Math.random() > 0.3 ? [] : ["Syntax error on line 5"],
        }));
        break;
      case "run":
        alert(`Running ${editedData.language} code...`);
        break;
      case "test":
        alert(`Running tests for ${editedData.language} code...`);
        break;
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <h3>Code Editor</h3>

      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="code-language" style={{ display: "block", marginBottom: "4px", fontSize: "12px" }}>
          Language:
        </label>
        <select
          id="code-language"
          name="codeLanguage"
          value={editedData.language}
          onChange={(e) => setEditedData({ ...editedData, language: e.target.value })}
          style={{ width: "100%", padding: "4px 8px" }}
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="rust">Rust</option>
          <option value="go">Go</option>
        </select>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="code-content" style={{ display: "block", marginBottom: "4px", fontSize: "12px" }}>
          Code:
        </label>
        <textarea
          id="code-content"
          name="codeContent"
          value={editedData.code}
          onChange={(e) => setEditedData({ ...editedData, code: e.target.value })}
          style={{
            width: "100%",
            height: "120px",
            fontFamily: "monospace",
            fontSize: "11px",
            padding: "8px",
          }}
          placeholder="Enter your code here..."
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
          <button
            onClick={() => simulate("compile")}
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              backgroundColor: "#8b5cf6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              flex: 1,
            }}
          >
            Compile
          </button>
          <button
            onClick={() => simulate("run")}
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              flex: 1,
            }}
          >
            Run
          </button>
          <button
            onClick={() => simulate("test")}
            style={{
              padding: "6px 12px",
              fontSize: "11px",
              backgroundColor: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              flex: 1,
            }}
          >
            Test
          </button>
        </div>

        <div style={{ fontSize: "11px" }}>
          Status:{" "}
          {editedData.compiled ? (
            <span style={{ color: "#10b981" }}>✓ Compiled</span>
          ) : (
            <span style={{ color: "#ef4444" }}>✗ Not compiled</span>
          )}
        </div>

        {editedData.errors && editedData.errors.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <strong style={{ fontSize: "11px", color: "#ef4444" }}>Errors:</strong>
            <ul style={{ margin: "4px 0", paddingLeft: "16px", fontSize: "10px", color: "#ef4444" }}>
              {editedData.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        style={{
          width: "100%",
          padding: "8px 16px",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Save Changes
      </button>
    </div>
  );
};

export const CodeNodeDefinition: NodeDefinition = {
  type: "code-editor",
  displayName: "Code Editor",
  description: "A code editor node with syntax highlighting and compilation",
  category: "Development",
  defaultData: {
    title: "Code Editor",
    language: "javascript",
  },
  defaultSize: { width: 280, height: 160 },
  ports: [
    {
      id: "input",
      type: "input",
      label: "Dependencies",
      position: "left",
    },
    {
      id: "output",
      type: "output",
      label: "Build Output",
      position: "right",
    },
    {
      id: "error",
      type: "output",
      label: "Errors",
      position: "bottom",
    },
  ],
  renderNode: CodeEditorRenderer,
  renderInspector: CodeInspectorRenderer,
  loadExternalData: async (ref: ExternalDataReference) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      id: ref.id,
      language: "javascript",
      code: "// Sample code\nconst greeting = 'Hello, World!';\nconsole.log(greeting);",
      compiled: true,
      errors: [],
    };
  },
  updateExternalData: async (_ref: ExternalDataReference, data: unknown) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log("Updated code data:", data);
  },
};
