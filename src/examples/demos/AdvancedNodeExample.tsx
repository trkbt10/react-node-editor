import * as React from "react";
import { NodeEditor } from "../../NodeEditor";
import type {
  NodeDefinition,
  NodeRenderProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../../types/NodeDefinition";
import type { NodeEditorData } from "../../types/core";
import { Button, Textarea } from "../../components/elements";
import { ExampleLayout } from "./parts/ExampleLayout";
import { ExampleHeader } from "./parts/ExampleHeader";
import classes from "./AdvancedNodeExample.module.css";

// =============================================
// Code Editor Node
// =============================================

type CodeData = {
  id: string;
  language: string;
  code: string;
  compiled?: boolean;
  errors?: string[];
};

const CodeEditorRenderer = ({ node, isSelected, isDragging, externalData, onUpdateNode }: NodeRenderProps) => {
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

  const getLanguageColor = (lang?: string) => {
    switch (lang) {
      case "javascript":
        return "#f7df1e";
      case "typescript":
        return "#3178c6";
      case "python":
        return "#3776ab";
      case "rust":
        return "#dea584";
      default:
        return "#6b7280";
    }
  };

  const getTextColor = (bgColor: string) => {
    // Simple contrast calculation
    const color = bgColor.replace("#", "");
    const r = parseInt(color.slice(0, 2), 16);
    const g = parseInt(color.slice(2, 4), 16);
    const b = parseInt(color.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#ffffff";
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

const CodeInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
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

// =============================================
// Chart/Data Visualization Node
// =============================================

type ChartData = {
  id: string;
  type: "bar" | "line" | "pie";
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
};

const ChartRenderer = ({ isSelected, isDragging, externalData }: NodeRenderProps) => {
  const chartData = externalData as ChartData | undefined;

  const renderMiniChart = () => {
    if (!chartData?.data) {
      return null;
    }

    const maxValue = Math.max(...chartData.data.map((d) => d.value));
    const chartHeight = 60;

    switch (chartData.type) {
      case "bar":
        return (
          <div style={{ display: "flex", alignItems: "end", height: chartHeight, gap: "2px" }}>
            {chartData.data.map((item, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: item.color || "#3b82f6",
                  height: `${(item.value / maxValue) * chartHeight}px`,
                  flex: 1,
                  borderRadius: "2px 2px 0 0",
                }}
                title={`${item.label}: ${item.value}`}
              />
            ))}
          </div>
        );

      case "line": {
        const points = chartData.data
          .map((item, index) => {
            const x = (index / (chartData.data.length - 1)) * 100;
            const y = 100 - (item.value / maxValue) * 80;
            return `${x},${y}`;
          })
          .join(" ");

        return (
          <svg width="100%" height={chartHeight} style={{ border: "1px solid #e5e7eb" }}>
            <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" />
            {chartData.data.map((item, index) => {
              const x = (index / (chartData.data.length - 1)) * 100;
              const y = 100 - (item.value / maxValue) * 80;
              return <circle key={index} cx={`${x}%`} cy={`${y}%`} r="3" fill="#3b82f6" />;
            })}
          </svg>
        );
      }

      case "pie": {
        let currentAngle = 0;
        const radius = chartHeight / 2 - 5;
        const centerX = 50;
        const centerY = 50;
        const total = chartData.data.reduce((sum, item) => sum + item.value, 0);

        return (
          <svg width="100%" height={chartHeight} viewBox="0 0 100 100">
            {chartData.data.map((item, index) => {
              const angle = (item.value / total) * 360;
              const x1 = centerX + radius * Math.cos((currentAngle * Math.PI) / 180);
              const y1 = centerY + radius * Math.sin((currentAngle * Math.PI) / 180);
              const x2 = centerX + radius * Math.cos(((currentAngle + angle) * Math.PI) / 180);
              const y2 = centerY + radius * Math.sin(((currentAngle + angle) * Math.PI) / 180);

              const largeArcFlag = angle > 180 ? 1 : 0;
              const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              currentAngle += angle;

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color || `hsl(${index * 60}, 70%, 60%)`}
                  stroke="white"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
        border: "2px solid #10b981",
        opacity: isDragging ? 0.7 : 1,
        minHeight: "120px",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <h4 style={{ margin: "0 0 4px", fontSize: "13px" }}>{chartData?.title || "Chart"}</h4>
        <span style={{ fontSize: "11px", color: "#6b7280" }}>
          {chartData?.type?.toUpperCase() || "CHART"} • {chartData?.data?.length || 0} items
        </span>
      </div>

      <div style={{ marginBottom: "8px" }}>{renderMiniChart()}</div>

      {chartData?.data && (
        <div style={{ fontSize: "10px", color: "#6b7280" }}>
          Range: {Math.min(...chartData.data.map((d) => d.value))} - {Math.max(...chartData.data.map((d) => d.value))}
        </div>
      )}
    </div>
  );
};

const ChartInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
  const chartData = externalData as ChartData | undefined;
  const [editedData, setEditedData] = React.useState<ChartData>({
    id: chartData?.id || "",
    type: chartData?.type || "bar",
    title: chartData?.title || "New Chart",
    data: chartData?.data || [
      { label: "A", value: 10, color: "#3b82f6" },
      { label: "B", value: 20, color: "#10b981" },
      { label: "C", value: 15, color: "#f59e0b" },
    ],
  });

  const addDataPoint = () => {
    setEditedData((prev) => ({
      ...prev,
      data: [...prev.data, { label: `Item ${prev.data.length + 1}`, value: 5 }],
    }));
  };

  const removeDataPoint = (index: number) => {
    setEditedData((prev) => ({
      ...prev,
      data: prev.data.filter((_, i) => i !== index),
    }));
  };

  const updateDataPoint = (index: number, updates: Partial<ChartData["data"][0]>) => {
    setEditedData((prev) => ({
      ...prev,
      data: prev.data.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    }));
  };

  const handleSave = async () => {
    if (onUpdateExternalData) {
      await onUpdateExternalData(editedData);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <h3>Chart Configuration</h3>

      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="chart-title" style={{ display: "block", marginBottom: "4px", fontSize: "12px" }}>
          Title:
        </label>
        <input
          id="chart-title"
          name="chartTitle"
          type="text"
          value={editedData.title}
          onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
          style={{ width: "100%", padding: "4px 8px" }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="chart-type" style={{ display: "block", marginBottom: "4px", fontSize: "12px" }}>
          Chart Type:
        </label>
        <select
          id="chart-type"
          name="chartType"
          value={editedData.type}
          onChange={(e) => setEditedData({ ...editedData, type: e.target.value as ChartData["type"] })}
          style={{ width: "100%", padding: "4px 8px" }}
        >
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
          <option value="pie">Pie Chart</option>
        </select>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label style={{ fontSize: "12px" }}>Data Points:</label>
          <button
            onClick={addDataPoint}
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>

        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
          {editedData.data.map((item, index) => (
            <div key={index} style={{ display: "flex", gap: "4px", marginBottom: "4px", alignItems: "center" }}>
              <input
                id={`data-label-${index}`}
                name={`dataLabel${index}`}
                aria-label={`Label for data point ${index + 1}`}
                type="text"
                value={item.label}
                onChange={(e) => updateDataPoint(index, { label: e.target.value })}
                style={{ flex: 1, padding: "2px 4px", fontSize: "11px" }}
                placeholder="Label"
              />
              <input
                id={`data-value-${index}`}
                name={`dataValue${index}`}
                aria-label={`Value for data point ${index + 1}`}
                type="number"
                value={item.value}
                onChange={(e) => updateDataPoint(index, { value: Number(e.target.value) })}
                style={{ width: "60px", padding: "2px 4px", fontSize: "11px" }}
              />
              <input
                id={`data-color-${index}`}
                name={`dataColor${index}`}
                aria-label={`Color for data point ${index + 1}`}
                type="color"
                value={item.color || "#3b82f6"}
                onChange={(e) => updateDataPoint(index, { color: e.target.value })}
                style={{ width: "30px", height: "24px", border: "none", cursor: "pointer" }}
              />
              <button
                onClick={() => removeDataPoint(index)}
                style={{
                  padding: "2px 6px",
                  fontSize: "11px",
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "2px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
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
        Save Chart
      </button>
    </div>
  );
};

// =============================================
// Form Builder Node
// =============================================

type FormData = {
  id: string;
  title: string;
  fields: Array<{
    id: string;
    type: "text" | "email" | "number" | "select" | "textarea" | "checkbox";
    label: string;
    required: boolean;
    options?: string[]; // for select fields
  }>;
};

const FormRenderer = ({ isSelected, isDragging, externalData }: NodeRenderProps) => {
  const formData = externalData as FormData | undefined;

  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: isSelected ? "#fef3c7" : "#ffffff",
        border: "2px solid #f59e0b",
        opacity: isDragging ? 0.7 : 1,
        minHeight: "100px",
        maxWidth: "250px",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <h4 style={{ margin: "0 0 4px", fontSize: "13px" }}>📝 {formData?.title || "Form"}</h4>
        <span style={{ fontSize: "11px", color: "#6b7280" }}>{formData?.fields?.length || 0} fields</span>
      </div>

      <div style={{ fontSize: "10px", color: "#6b7280" }}>
        {formData?.fields?.slice(0, 3).map((field, _index) => (
          <div key={field.id} style={{ marginBottom: "2px" }}>
            • {field.label} ({field.type}) {field.required && "*"}
          </div>
        ))}
        {formData && formData.fields.length > 3 && <div>... and {formData.fields.length - 3} more</div>}
      </div>
    </div>
  );
};

const FormInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
  const formData = externalData as FormData | undefined;
  const [editedData, setEditedData] = React.useState<FormData>({
    id: formData?.id || "",
    title: formData?.title || "New Form",
    fields: formData?.fields || [],
  });

  const addField = () => {
    const newField = {
      id: `field-${Date.now()}`,
      type: "text" as const,
      label: "New Field",
      required: false,
    };
    setEditedData((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
  };

  const updateField = (fieldId: string, updates: Partial<FormData["fields"][0]>) => {
    setEditedData((prev) => ({
      ...prev,
      fields: prev.fields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)),
    }));
  };

  const removeField = (fieldId: string) => {
    setEditedData((prev) => ({
      ...prev,
      fields: prev.fields.filter((field) => field.id !== fieldId),
    }));
  };

  const handleSave = async () => {
    if (onUpdateExternalData) {
      await onUpdateExternalData(editedData);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <h3>Form Builder</h3>

      <div style={{ marginBottom: "12px" }}>
        <label htmlFor="form-title" style={{ display: "block", marginBottom: "4px", fontSize: "12px" }}>
          Form Title:
        </label>
        <input
          id="form-title"
          name="formTitle"
          type="text"
          value={editedData.title}
          onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
          style={{ width: "100%", padding: "4px 8px" }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label style={{ fontSize: "12px" }}>Form Fields:</label>
          <button
            onClick={addField}
            style={{
              padding: "4px 8px",
              fontSize: "11px",
              backgroundColor: "#f59e0b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Add Field
          </button>
        </div>

        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {editedData.fields.map((field) => (
            <div
              key={field.id}
              style={{ border: "1px solid #e5e7eb", borderRadius: "4px", padding: "8px", marginBottom: "8px" }}
            >
              <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                <input
                  id={`field-label-${field.id}`}
                  name={`fieldLabel-${field.id}`}
                  aria-label={`Label for field ${field.id}`}
                  type="text"
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                  style={{ flex: 1, padding: "2px 4px", fontSize: "11px" }}
                  placeholder="Field Label"
                />
                <button
                  onClick={() => removeField(field.id)}
                  style={{
                    padding: "2px 6px",
                    fontSize: "11px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "2px",
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <select
                  id={`field-type-${field.id}`}
                  name={`fieldType-${field.id}`}
                  aria-label={`Type for field ${field.id}`}
                  value={field.type}
                  onChange={(e) => updateField(field.id, { type: e.target.value as FormData["fields"][0]["type"] })}
                  style={{ flex: 1, padding: "2px 4px", fontSize: "11px" }}
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="number">Number</option>
                  <option value="select">Select</option>
                  <option value="textarea">Textarea</option>
                  <option value="checkbox">Checkbox</option>
                </select>
                <label
                  htmlFor={`field-required-${field.id}`}
                  style={{ fontSize: "11px", display: "flex", alignItems: "center" }}
                >
                  <input
                    id={`field-required-${field.id}`}
                    name={`fieldRequired-${field.id}`}
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    style={{ marginRight: "4px" }}
                  />
                  Required
                </label>
              </div>

              {field.type === "select" && (
                <div style={{ marginTop: "4px" }}>
                  <input
                    id={`field-options-${field.id}`}
                    name={`fieldOptions-${field.id}`}
                    aria-label={`Options for select field ${field.id}`}
                    type="text"
                    value={field.options?.join(", ") || ""}
                    onChange={(e) =>
                      updateField(field.id, {
                        options: e.target.value
                          .split(",")
                          .map((o) => o.trim())
                          .filter(Boolean),
                      })
                    }
                    style={{ width: "100%", padding: "2px 4px", fontSize: "11px" }}
                    placeholder="Options (comma separated)"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        style={{
          width: "100%",
          padding: "8px 16px",
          backgroundColor: "#f59e0b",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Save Form
      </button>
    </div>
  );
};

// =============================================
// Node Definitions
// =============================================

const CodeNodeDefinition: NodeDefinition = {
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

const ChartNodeDefinition: NodeDefinition = {
  type: "chart",
  displayName: "Chart Visualization",
  description: "Data visualization node for charts and graphs",
  category: "Data",
  defaultData: {
    title: "Chart Node",
  },
  defaultSize: { width: 200, height: 140 },
  ports: [
    {
      id: "data-input",
      type: "input",
      label: "Data",
      position: "left",
    },
    {
      id: "chart-output",
      type: "output",
      label: "Visualization",
      position: "right",
    },
  ],
  renderNode: ChartRenderer,
  renderInspector: ChartInspectorRenderer,
  loadExternalData: async (ref: ExternalDataReference) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      id: ref.id,
      type: "bar",
      title: "Sample Chart",
      data: [
        { label: "Jan", value: 10, color: "#3b82f6" },
        { label: "Feb", value: 25, color: "#10b981" },
        { label: "Mar", value: 18, color: "#f59e0b" },
        { label: "Apr", value: 30, color: "#ef4444" },
      ],
    };
  },
  updateExternalData: async (_ref: ExternalDataReference, data: unknown) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log("Updated chart data:", data);
  },
};

const FormNodeDefinition: NodeDefinition = {
  type: "form-builder",
  displayName: "Form Builder",
  description: "Interactive form builder with various field types",
  category: "UI",
  defaultData: {
    title: "Form Builder",
  },
  defaultSize: { width: 250, height: 120 },
  ports: [
    {
      id: "form-config",
      type: "input",
      label: "Config",
      position: "left",
    },
    {
      id: "form-data",
      type: "output",
      label: "Form Data",
      position: "right",
    },
    {
      id: "validation",
      type: "output",
      label: "Validation",
      position: "bottom",
    },
  ],
  renderNode: FormRenderer,
  renderInspector: FormInspectorRenderer,
  loadExternalData: async (ref: ExternalDataReference) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return {
      id: ref.id,
      title: "Contact Form",
      fields: [
        { id: "name", type: "text", label: "Full Name", required: true },
        { id: "email", type: "email", label: "Email Address", required: true },
        { id: "message", type: "textarea", label: "Message", required: false },
      ],
    };
  },
  updateExternalData: async (_ref: ExternalDataReference, data: unknown) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    console.log("Updated form data:", data);
  },
};

// =============================================
// Example Data
// =============================================

const advancedInitialData: NodeEditorData = {
  nodes: {
    "code-1": {
      id: "code-1",
      type: "code-editor",
      position: { x: 50, y: 50 },
      size: { width: 280, height: 160 },
      data: { title: "Frontend Code", language: "typescript" },
    },
    "chart-1": {
      id: "chart-1",
      type: "chart",
      position: { x: 400, y: 50 },
      size: { width: 200, height: 140 },
      data: { title: "Performance Chart" },
    },
    "form-1": {
      id: "form-1",
      type: "form-builder",
      position: { x: 50, y: 280 },
      size: { width: 250, height: 120 },
      data: { title: "User Registration" },
    },
    "code-2": {
      id: "code-2",
      type: "code-editor",
      position: { x: 400, y: 250 },
      size: { width: 280, height: 160 },
      data: { title: "Backend API", language: "python" },
    },
    "group-1": {
      id: "group-1",
      type: "group",
      position: { x: 750, y: 100 },
      size: { width: 300, height: 200 },
      data: { title: "Data Processing Group" },
      expanded: true,
    },
    "chart-2": {
      id: "chart-2",
      type: "chart",
      position: { x: 800, y: 150 },
      size: { width: 180, height: 120 },
      data: { title: "Analytics Dashboard" },
      parentId: "group-1",
    },
  },
  connections: {
    "conn-1": {
      id: "conn-1",
      fromNodeId: "code-1",
      fromPortId: "output",
      toNodeId: "chart-1",
      toPortId: "data-input",
    },
    "conn-2": {
      id: "conn-2",
      fromNodeId: "form-1",
      fromPortId: "form-data",
      toNodeId: "code-2",
      toPortId: "input",
    },
    "conn-3": {
      id: "conn-3",
      fromNodeId: "chart-1",
      fromPortId: "chart-output",
      toNodeId: "chart-2",
      toPortId: "data-input",
    },
  },
};

const advancedExternalDataRefs: Record<string, ExternalDataReference> = {
  "code-1": { id: "frontend-ts", type: "code" },
  "code-2": { id: "backend-py", type: "code" },
  "chart-1": { id: "perf-chart", type: "chart" },
  "chart-2": { id: "analytics-chart", type: "chart" },
  "form-1": { id: "registration-form", type: "form" },
};

// =============================================
// Main Component
// =============================================

export const AdvancedNodeExample: React.FC = () => {
  const [currentTheme, setCurrentTheme] = React.useState("default");

  const themeActions = (
    <>
      <label className={classes.themeLabel}>Theme:</label>
      <select value={currentTheme} onChange={(e) => setCurrentTheme(e.target.value)} className={classes.themeSelect}>
        <option value="default">Default</option>
        <option value="dark">Dark</option>
        <option value="high-contrast">High Contrast</option>
      </select>
    </>
  );

  const contentClass = currentTheme === "dark" ? `${classes.content} ${classes.contentDark}` : classes.content;

  return (
    <ExampleLayout
      header={
        <ExampleHeader
          title="Advanced Node Editor"
          description="Custom renderers: Code Editor, Chart Visualization, Form Builder"
          actions={themeActions}
        />
      }
    >
      <div className={contentClass}>
        <NodeEditor
          initialData={advancedInitialData}
          nodeDefinitions={[CodeNodeDefinition, ChartNodeDefinition, FormNodeDefinition]}
          externalDataRefs={advancedExternalDataRefs}
          onDataChange={(data) => {
            console.log("Advanced editor data changed:", data);
          }}
          onSave={async (data) => {
            console.log("Saving advanced editor data:", data);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }}
        />
      </div>
    </ExampleLayout>
  );
};

export default AdvancedNodeExample;
