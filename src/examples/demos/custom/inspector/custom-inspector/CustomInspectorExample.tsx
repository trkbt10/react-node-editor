/**
 * @file Example demonstrating custom inspector panels and tabs
 *
 * This example shows three main customization patterns:
 * 1. Node-level renderInspector: Custom inspector content per node type
 * 2. InspectorPanel tabs: Adding custom tabs to the inspector
 * 3. InspectorPanel settingsPanels: Adding custom panels to the Settings tab
 *
 * All inspector UI is built using only the provided inspector parts components,
 * ensuring consistent theming across light and dark modes.
 */
import * as React from "react";
import { NodeEditor } from "../../../../../NodeEditor";
import { asNodeDefinition, type NodeDefinition, type InspectorRenderProps } from "../../../../../types/NodeDefinition";
import type { NodeEditorData } from "../../../../../types/core";
import { StandardNodeDefinition } from "../../../../../node-definitions/standard";
import {
  InspectorPanel,
  InspectorLayersTab,
  InspectorSettingsTab,
  PropertySection,
  InspectorInput,
  InspectorTextarea,
  InspectorButton,
  InspectorButtonGroup,
  InspectorDefinitionList,
  InspectorDefinitionItem,
  InspectorPropertiesTab,
  InspectorSection,
  InspectorField,
  InspectorLabel,
  InspectorNumberInput,
  InspectorSelect,
  PositionInputsGrid,
  ReadOnlyField,
  InspectorSectionTitle,
  type InspectorPanelTabConfig,
  type InspectorSettingsPanelConfig,
  type InspectorButtonGroupOption,
} from "../../../../../inspector";
import { defaultEditorGridConfig } from "../../../../../core";
import { NodeCanvas } from "../../../../../components/canvas/NodeCanvas";
import classes from "./CustomInspectorExample.module.css";

// =============================================================================
// 1. Custom Node Data Types
// =============================================================================

type PersonNodeData = {
  name: string;
  email: string;
  role: "developer" | "designer" | "manager";
  bio: string;
};

type ProjectNodeData = {
  projectName: string;
  status: "planning" | "active" | "completed";
  priority: "low" | "medium" | "high";
  deadline: string;
};

type AnalyticsNodeData = {
  metricName: string;
  value: number;
  threshold: number;
  unit: string;
  createdAt: string;
};

// =============================================================================
// 2. Custom Inspector Renderers (Pattern 1: renderInspector)
// =============================================================================

/**
 * Custom inspector for Person nodes.
 * Uses the built-in inspector UI components for consistent styling.
 */
function PersonInspectorRenderer({
  node,
  onUpdateNode,
}: InspectorRenderProps<PersonNodeData>): React.ReactElement {
  const data = node.data ?? ({} as PersonNodeData);

  const handleChange = <K extends keyof PersonNodeData>(key: K, value: PersonNodeData[K]) => {
    onUpdateNode({ data: { ...data, [key]: value } });
  };

  return (
    <PropertySection title="Person Details">
      <InspectorDefinitionList>
        <InspectorDefinitionItem label="Name">
          <InspectorInput
            value={data.name ?? ""}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Enter name"
          />
        </InspectorDefinitionItem>

        <InspectorDefinitionItem label="Email">
          <InspectorInput
            type="email"
            value={data.email ?? ""}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="email@example.com"
          />
        </InspectorDefinitionItem>

        <InspectorDefinitionItem label="Role">
          <InspectorSelect
            value={data.role ?? "developer"}
            onChange={(e) => handleChange("role", e.target.value as PersonNodeData["role"])}
          >
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
            <option value="manager">Manager</option>
          </InspectorSelect>
        </InspectorDefinitionItem>

        <InspectorDefinitionItem label="Bio">
          <InspectorTextarea
            value={data.bio ?? ""}
            onChange={(e) => handleChange("bio", e.target.value)}
            placeholder="Brief biography..."
            rows={3}
          />
        </InspectorDefinitionItem>
      </InspectorDefinitionList>
    </PropertySection>
  );
}

// Priority options for InspectorButtonGroup
const priorityOptions: InspectorButtonGroupOption<ProjectNodeData["priority"]>[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

/**
 * Custom inspector for Project nodes.
 * Demonstrates different field types and styling.
 */
function ProjectInspectorRenderer({
  node,
  onUpdateNode,
  onDeleteNode,
}: InspectorRenderProps<ProjectNodeData>): React.ReactElement {
  const data = node.data ?? ({} as ProjectNodeData);

  const handleChange = <K extends keyof ProjectNodeData>(key: K, value: ProjectNodeData[K]) => {
    onUpdateNode({ data: { ...data, [key]: value } });
  };

  return (
    <>
      <PropertySection title="Project Info">
        <InspectorDefinitionList>
          <InspectorDefinitionItem label="Project Name">
            <InspectorInput
              value={data.projectName ?? ""}
              onChange={(e) => handleChange("projectName", e.target.value)}
              placeholder="Project name"
            />
          </InspectorDefinitionItem>

          <InspectorDefinitionItem label="Status">
            <InspectorSelect
              value={data.status ?? "planning"}
              onChange={(e) => handleChange("status", e.target.value as ProjectNodeData["status"])}
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </InspectorSelect>
          </InspectorDefinitionItem>

          <InspectorDefinitionItem label="Priority">
            <InspectorButtonGroup
              options={priorityOptions}
              value={data.priority ?? "medium"}
              onChange={(value) => handleChange("priority", value)}
              aria-label="Select priority"
            />
          </InspectorDefinitionItem>

          <InspectorDefinitionItem label="Deadline">
            <InspectorInput
              type="date"
              value={data.deadline ?? ""}
              onChange={(e) => handleChange("deadline", e.target.value)}
            />
          </InspectorDefinitionItem>
        </InspectorDefinitionList>
      </PropertySection>

      <PropertySection title="Actions">
        <InspectorButton variant="danger" onClick={onDeleteNode}>
          Delete Project
        </InspectorButton>
      </PropertySection>
    </>
  );
}

/**
 * Custom inspector for Analytics nodes.
 * Demonstrates additional inspector parts: InspectorField, InspectorLabel,
 * InspectorNumberInput, PositionInputsGrid, ReadOnlyField, InspectorSectionTitle.
 */
function AnalyticsInspectorRenderer({
  node,
  onUpdateNode,
}: InspectorRenderProps<AnalyticsNodeData>): React.ReactElement {
  const data = node.data ?? ({} as AnalyticsNodeData);

  const handleChange = <K extends keyof AnalyticsNodeData>(key: K, value: AnalyticsNodeData[K]) => {
    onUpdateNode({ data: { ...data, [key]: value } });
  };

  const isAboveThreshold = (data.value ?? 0) >= (data.threshold ?? 0);

  return (
    <>
      {/* Pattern: Using InspectorSectionTitle for standalone title */}
      <InspectorSection>
        <InspectorSectionTitle>Metric Configuration</InspectorSectionTitle>

        {/* Pattern: Using InspectorField with InspectorLabel for vertical layout */}
        <InspectorField label={<InspectorLabel>Metric Name</InspectorLabel>}>
          <InspectorInput
            value={data.metricName ?? ""}
            onChange={(e) => handleChange("metricName", e.target.value)}
            placeholder="e.g., Page Views"
          />
        </InspectorField>

        <InspectorField label={<InspectorLabel>Unit</InspectorLabel>}>
          <InspectorInput
            value={data.unit ?? ""}
            onChange={(e) => handleChange("unit", e.target.value)}
            placeholder="e.g., views/day"
          />
        </InspectorField>
      </InspectorSection>

      <PropertySection title="Numeric Values">
        {/* Pattern: Using PositionInputsGrid for compact number inputs */}
        <PositionInputsGrid>
          <InspectorNumberInput
            label="Value"
            value={data.value ?? 0}
            onChange={(value) => handleChange("value", value)}
          />
          <InspectorNumberInput
            label="Threshold"
            value={data.threshold ?? 0}
            onChange={(value) => handleChange("threshold", value)}
          />
        </PositionInputsGrid>

        {/* Status indicator using InspectorDefinitionList */}
        <InspectorDefinitionList>
          <InspectorDefinitionItem label="Status">
            <ReadOnlyField>{isAboveThreshold ? "Above Threshold" : "Below Threshold"}</ReadOnlyField>
          </InspectorDefinitionItem>
        </InspectorDefinitionList>
      </PropertySection>

      <PropertySection title="Metadata">
        {/* Pattern: Using ReadOnlyField for non-editable data */}
        <InspectorDefinitionList>
          <InspectorDefinitionItem label="Node ID">
            <ReadOnlyField>{node.id}</ReadOnlyField>
          </InspectorDefinitionItem>
          <InspectorDefinitionItem label="Created">
            <ReadOnlyField>{data.createdAt || "Unknown"}</ReadOnlyField>
          </InspectorDefinitionItem>
          <InspectorDefinitionItem label="Position">
            <ReadOnlyField>
              X: {Math.round(node.position.x)}, Y: {Math.round(node.position.y)}
            </ReadOnlyField>
          </InspectorDefinitionItem>
        </InspectorDefinitionList>
      </PropertySection>
    </>
  );
}

// =============================================================================
// 3. Node Definitions with Custom Inspectors
// =============================================================================

const PersonNodeDefinition: NodeDefinition<PersonNodeData> = {
  type: "person",
  displayName: "Person",
  description: "Represents a team member",
  category: "Team",
  defaultData: {
    name: "",
    email: "",
    role: "developer",
    bio: "",
  },
  ports: [
    { id: "reports-to", type: "output", position: "top", label: "Reports To" },
    { id: "works-on", type: "output", position: "right", label: "Works On" },
  ],
  // Pattern 1: Provide a React component for custom inspector
  renderInspector: PersonInspectorRenderer,
};

const ProjectNodeDefinition: NodeDefinition<ProjectNodeData> = {
  type: "project",
  displayName: "Project",
  description: "Represents a project",
  category: "Work",
  defaultData: {
    projectName: "",
    status: "planning",
    priority: "medium",
    deadline: "",
  },
  ports: [
    { id: "assigned", type: "input", position: "left", label: "Assigned" },
    { id: "depends-on", type: "input", position: "top", label: "Depends On" },
    { id: "blocks", type: "output", position: "bottom", label: "Blocks" },
  ],
  renderInspector: ProjectInspectorRenderer,
};

const AnalyticsNodeDefinition: NodeDefinition<AnalyticsNodeData> = {
  type: "analytics",
  displayName: "Analytics",
  description: "Represents a metric or KPI",
  category: "Data",
  defaultData: {
    metricName: "",
    value: 0,
    threshold: 100,
    unit: "",
    createdAt: new Date().toISOString().split("T")[0],
  },
  ports: [
    { id: "data-in", type: "input", position: "left", label: "Data In" },
    { id: "data-out", type: "output", position: "right", label: "Data Out" },
  ],
  renderInspector: AnalyticsInspectorRenderer,
};

// =============================================================================
// 4. Custom Tab Components (Pattern 2: InspectorPanel tabs)
// =============================================================================

/**
 * Custom "Statistics" tab showing editor statistics.
 */
const StatisticsTab: React.FC = () => {
  // In a real app, you'd use useEditorData() or similar to get actual counts
  return (
    <InspectorSection>
      <PropertySection title="Editor Statistics">
        <InspectorDefinitionList>
          <InspectorDefinitionItem label="Total Nodes">
            <ReadOnlyField>5</ReadOnlyField>
          </InspectorDefinitionItem>
          <InspectorDefinitionItem label="Connections">
            <ReadOnlyField>3</ReadOnlyField>
          </InspectorDefinitionItem>
          <InspectorDefinitionItem label="Selected">
            <ReadOnlyField>0</ReadOnlyField>
          </InspectorDefinitionItem>
        </InspectorDefinitionList>
      </PropertySection>

      <PropertySection title="Node Types">
        <InspectorDefinitionList>
          <InspectorDefinitionItem label="Person">
            <ReadOnlyField>2</ReadOnlyField>
          </InspectorDefinitionItem>
          <InspectorDefinitionItem label="Project">
            <ReadOnlyField>1</ReadOnlyField>
          </InspectorDefinitionItem>
          <InspectorDefinitionItem label="Analytics">
            <ReadOnlyField>1</ReadOnlyField>
          </InspectorDefinitionItem>
          <InspectorDefinitionItem label="Standard">
            <ReadOnlyField>1</ReadOnlyField>
          </InspectorDefinitionItem>
        </InspectorDefinitionList>
      </PropertySection>
    </InspectorSection>
  );
};

/**
 * Custom "Help" tab with usage instructions.
 */
const HelpTab: React.FC = () => {
  return (
    <InspectorSection>
      <PropertySection title="Quick Start">
        <InspectorDefinitionList>
          <InspectorDefinitionItem label="Select">
            <ReadOnlyField>Click a node to edit properties</ReadOnlyField>
          </InspectorDefinitionItem>
          <InspectorDefinitionItem label="Connect">
            <ReadOnlyField>Drag from ports to create connections</ReadOnlyField>
          </InspectorDefinitionItem>
          <InspectorDefinitionItem label="Create">
            <ReadOnlyField>Double-click canvas for new node</ReadOnlyField>
          </InspectorDefinitionItem>
        </InspectorDefinitionList>
      </PropertySection>

      <PropertySection title="Node Types">
        <InspectorDefinitionList>
          <InspectorDefinitionItem label="Person">
            <ReadOnlyField>Name, email, role, bio fields</ReadOnlyField>
          </InspectorDefinitionItem>
          <InspectorDefinitionItem label="Project">
            <ReadOnlyField>Status, priority, deadline fields</ReadOnlyField>
          </InspectorDefinitionItem>
          <InspectorDefinitionItem label="Analytics">
            <ReadOnlyField>Numeric inputs, read-only fields</ReadOnlyField>
          </InspectorDefinitionItem>
          <InspectorDefinitionItem label="Standard">
            <ReadOnlyField>Default inspector (no renderInspector)</ReadOnlyField>
          </InspectorDefinitionItem>
        </InspectorDefinitionList>
      </PropertySection>
    </InspectorSection>
  );
};

// =============================================================================
// 5. Custom Settings Panel (Pattern 3: settingsPanels)
// =============================================================================

/**
 * Custom settings panel for export options.
 */
const ExportSettingsPanel: React.FC = () => {
  const [format, setFormat] = React.useState<"json" | "yaml">("json");
  const [includeMetadata, setIncludeMetadata] = React.useState(true);

  const handleExport = () => {
    alert(`Exporting as ${format.toUpperCase()}${includeMetadata ? " with metadata" : ""}`);
  };

  return (
    <InspectorDefinitionList>
      <InspectorDefinitionItem label="Format">
        <InspectorSelect value={format} onChange={(e) => setFormat(e.target.value as "json" | "yaml")}>
          <option value="json">JSON</option>
          <option value="yaml">YAML</option>
        </InspectorSelect>
      </InspectorDefinitionItem>

      <InspectorDefinitionItem label="Include Metadata">
        <input
          type="checkbox"
          checked={includeMetadata}
          onChange={(e) => setIncludeMetadata(e.target.checked)}
        />
      </InspectorDefinitionItem>

      <InspectorDefinitionItem label="">
        <InspectorButton variant="primary" size="small" onClick={handleExport}>
          Export Data
        </InspectorButton>
      </InspectorDefinitionItem>
    </InspectorDefinitionList>
  );
};

// =============================================================================
// 6. Custom InspectorPanel with All Patterns
// =============================================================================

const CustomInspectorPanel: React.FC = () => {
  // Pattern 3: Custom settings panels added to the Settings tab
  const settingsPanels: InspectorSettingsPanelConfig[] = React.useMemo(
    () => [
      {
        title: "Export Options",
        component: ExportSettingsPanel,
      },
    ],
    [],
  );

  // Pattern 2: Custom tabs replacing or extending the default tabs
  const tabs: InspectorPanelTabConfig[] = React.useMemo(
    () => [
      {
        id: "layers",
        label: "Layers",
        render: () => <InspectorLayersTab />,
      },
      {
        id: "properties",
        label: "Properties",
        render: () => <InspectorPropertiesTab />,
      },
      {
        id: "statistics",
        label: "Stats",
        render: () => <StatisticsTab />,
      },
      {
        id: "settings",
        label: "Settings",
        render: () => <InspectorSettingsTab panels={settingsPanels} />,
      },
      {
        id: "help",
        label: "Help",
        render: () => <HelpTab />,
      },
    ],
    [settingsPanels],
  );

  return <InspectorPanel tabs={tabs} />;
};

// =============================================================================
// 7. Minimal Custom Inspector (Simpler Pattern)
// =============================================================================

/**
 * A simpler inspector that only shows node properties for selected nodes.
 * Uses InspectorPanel with single tab for consistent styling.
 */
const MinimalInspector: React.FC = () => {
  const tabs: InspectorPanelTabConfig[] = React.useMemo(
    () => [
      {
        id: "properties",
        label: "Properties",
        render: () => <InspectorPropertiesTab />,
      },
    ],
    [],
  );

  return <InspectorPanel tabs={tabs} />;
};

// =============================================================================
// 8. Initial Data
// =============================================================================

const initialData: NodeEditorData = {
  nodes: {
    "person-1": {
      id: "person-1",
      type: "person",
      position: { x: 100, y: 100 },
      data: {
        name: "Alice Johnson",
        email: "alice@example.com",
        role: "developer",
        bio: "Senior frontend developer with 5 years of experience.",
      },
    },
    "person-2": {
      id: "person-2",
      type: "person",
      position: { x: 100, y: 300 },
      data: {
        name: "Bob Smith",
        email: "bob@example.com",
        role: "designer",
        bio: "UI/UX designer passionate about accessibility.",
      },
    },
    "project-1": {
      id: "project-1",
      type: "project",
      position: { x: 400, y: 180 },
      data: {
        projectName: "Node Editor v2",
        status: "active",
        priority: "high",
        deadline: "2024-06-30",
      },
    },
    "analytics-1": {
      id: "analytics-1",
      type: "analytics",
      position: { x: 700, y: 100 },
      data: {
        metricName: "Daily Active Users",
        value: 1250,
        threshold: 1000,
        unit: "users/day",
        createdAt: "2024-01-15",
      },
    },
    "standard-1": {
      id: "standard-1",
      type: "standard",
      position: { x: 400, y: 380 },
      data: {
        title: "Standard Node",
        content: "This node uses the default inspector (no renderInspector).",
      },
    },
  },
  connections: {
    "conn-1": {
      id: "conn-1",
      fromNodeId: "person-1",
      fromPortId: "works-on",
      toNodeId: "project-1",
      toPortId: "assigned",
    },
    "conn-2": {
      id: "conn-2",
      fromNodeId: "person-2",
      fromPortId: "works-on",
      toNodeId: "project-1",
      toPortId: "assigned",
    },
    "conn-3": {
      id: "conn-3",
      fromNodeId: "project-1",
      fromPortId: "blocks",
      toNodeId: "analytics-1",
      toPortId: "data-in",
    },
  },
};

// =============================================================================
// 9. Example Component with Mode Selection
// =============================================================================

// Mode options for InspectorButtonGroup
const modeOptions: InspectorButtonGroupOption<"full" | "minimal">[] = [
  { value: "full", label: "Full" },
  { value: "minimal", label: "Minimal" },
];

export const CustomInspectorExample: React.FC = () => {
  const [mode, setMode] = React.useState<"full" | "minimal">("full");

  const gridLayers = React.useMemo(
    () => [
      { id: "canvas", component: <NodeCanvas />, gridArea: "canvas" },
      {
        id: "inspector",
        component: mode === "full" ? <CustomInspectorPanel /> : <MinimalInspector />,
        gridArea: "inspector",
      },
    ],
    [mode],
  );

  return (
    <div className={classes.exampleContainer}>
      <div className={classes.modeSelector}>
        <InspectorDefinitionList>
          <InspectorDefinitionItem label="Inspector Mode">
            <InspectorButtonGroup options={modeOptions} value={mode} onChange={setMode} aria-label="Inspector mode" />
          </InspectorDefinitionItem>
        </InspectorDefinitionList>
      </div>

      <div className={classes.editorContainer}>
        <NodeEditor
          initialData={initialData}
          nodeDefinitions={[
            asNodeDefinition(PersonNodeDefinition),
            asNodeDefinition(ProjectNodeDefinition),
            asNodeDefinition(AnalyticsNodeDefinition),
            asNodeDefinition(StandardNodeDefinition),
          ]}
          gridConfig={defaultEditorGridConfig}
          gridLayers={gridLayers}
          onDataChange={(data) => {
            console.log("Data changed:", data);
          }}
        />
      </div>
    </div>
  );
};

export default CustomInspectorExample;
