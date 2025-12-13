/**
 * @file Chart Node - Data visualization node for charts and graphs
 */
import * as React from "react";
import type {
  NodeDefinition,
  NodeRendererProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../../../../../types/NodeDefinition";
import { getTextColor } from "./colorUtils";

export type ChartData = {
  id: string;
  type: "bar" | "line" | "pie";
  title: string;
  data: Array<{ label: string; value: number; color?: string }>;
};

export const ChartRenderer = ({ node, isSelected, isDragging, externalData }: NodeRendererProps) => {
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

  const chartColor = "#10b981";

  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
        border: `2px solid ${chartColor}`,
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
        <h4 style={{ margin: "0 0 4px", fontSize: "13px" }}>{chartData?.title || "Chart"}</h4>
        <span
          style={{
            fontSize: "11px",
            backgroundColor: chartColor,
            color: getTextColor(chartColor),
            padding: "2px 8px",
            borderRadius: "4px",
            fontWeight: "600",
          }}
        >
          {chartData?.type?.toUpperCase() || "CHART"} • {chartData?.data?.length || 0} items
        </span>
      </div>

      <div style={{ marginBottom: "8px", flex: 1, overflow: "hidden" }}>{renderMiniChart()}</div>

      {chartData?.data && (
        <div style={{ fontSize: "10px", color: "#6b7280" }}>
          Range: {Math.min(...chartData.data.map((d) => d.value))} - {Math.max(...chartData.data.map((d) => d.value))}
        </div>
      )}
    </div>
  );
};

export const ChartInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
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

export const ChartNodeDefinition: NodeDefinition = {
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
