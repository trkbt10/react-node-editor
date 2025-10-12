/**
 * @file Form Builder Node - Interactive form builder with various field types
 */
import * as React from "react";
import type {
  NodeDefinition,
  NodeRenderProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../../../../types/NodeDefinition";
import { getTextColor } from "./colorUtils";

export type FormData = {
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

export const FormRenderer = ({ node, isSelected, isDragging, externalData }: NodeRenderProps) => {
  const formData = externalData as FormData | undefined;

  const formColor = "#f59e0b";

  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: isSelected ? "#fef3c7" : "#ffffff",
        border: `2px solid ${formColor}`,
        opacity: isDragging ? 0.7 : 1,
        width: node.size?.width,
        height: node.size?.height,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div style={{ marginBottom: "8px" }}>
        <h4 style={{ margin: "0 0 4px", fontSize: "13px" }}>📝 {formData?.title || "Form"}</h4>
        <span
          style={{
            fontSize: "11px",
            backgroundColor: formColor,
            color: getTextColor(formColor),
            padding: "2px 8px",
            borderRadius: "4px",
            fontWeight: "600",
          }}
        >
          {formData?.fields?.length || 0} fields
        </span>
      </div>

      <div style={{ fontSize: "10px", color: "#6b7280", flex: 1, overflow: "auto" }}>
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

export const FormInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
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

export const FormNodeDefinition: NodeDefinition = {
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
