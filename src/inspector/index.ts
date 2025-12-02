/**
 * @file Public inspector exports to help build custom inspector experiences.
 * This file directly imports from component files to avoid circular dependencies.
 */

// Inspector panel components
export {
  InspectorPanel,
  InspectorLayersTab,
  InspectorHistoryTab,
  InspectorSettingsTab,
} from "../components/inspector/InspectorPanel";
export type {
  InspectorPanelProps,
  InspectorPanelTabConfig,
  InspectorSettingsPanelConfig,
  InspectorSettingsTabProps,
} from "../components/inspector/InspectorPanel";

// Inspector renderer components
export { NodeInspector } from "../components/inspector/panels/NodeInspector";
export type { NodeInspectorProps } from "../components/inspector/panels/NodeInspector";
export { NodeBehaviorInspector } from "../components/inspector/panels/NodeBehaviorInspector";
export { NodeActionsBehaviorInspector } from "../components/inspector/panels/NodeActionsBehaviorInspector";
export { GroupBehaviorInspector } from "../components/inspector/panels/GroupBehaviorInspector";
export { GeneralSettingsPanel } from "../components/inspector/panels/GeneralSettingsPanel";
export { GridSettingsPanel } from "../components/inspector/panels/GridSettingsPanel";
export { HistoryPanel } from "../components/inspector/panels/HistoryPanel";
export { InspectorPropertiesTab } from "../components/inspector/panels/InspectorPropertiesTab";
export { InteractionHelpPanel } from "../components/inspector/panels/InteractionHelpPanel";
export { NodePalettePanel } from "../components/inspector/panels/NodePalettePanel";
export { NodeTreeListPanel } from "../components/inspector/panels/NodeTreeListPanel";

// Inspector part components (form controls and UI elements)
export { InspectorSection } from "../components/inspector/parts/InspectorSection";
export type { InspectorSectionProps } from "../components/inspector/parts/InspectorSection";
export { PropertySection } from "../components/inspector/parts/PropertySection";
export type { PropertySectionProps } from "../components/inspector/parts/PropertySection";
export { InspectorField } from "../components/inspector/parts/InspectorField";
export type { InspectorFieldProps } from "../components/inspector/parts/InspectorField";
export { InspectorSectionTitle } from "../components/inspector/parts/InspectorSectionTitle";
export type { InspectorSectionTitleProps } from "../components/inspector/parts/InspectorSectionTitle";
export { InspectorLabel } from "../components/inspector/parts/InspectorLabel";
export type { InspectorLabelProps } from "../components/inspector/parts/InspectorLabel";
export { InspectorInput } from "../components/inspector/parts/InspectorInput";
export type { InspectorInputProps } from "../components/inspector/parts/InspectorInput";
export { InspectorNumberInput } from "../components/inspector/parts/InspectorNumberInput";
export type { InspectorNumberInputProps } from "../components/inspector/parts/InspectorNumberInput";
export { InspectorTextarea } from "../components/inspector/parts/InspectorTextarea";
export type { InspectorTextareaProps } from "../components/inspector/parts/InspectorTextarea";
export { InspectorButton } from "../components/inspector/parts/InspectorButton";
export type { InspectorButtonProps } from "../components/inspector/parts/InspectorButton";
export { InspectorIconButton } from "../components/inspector/parts/InspectorIconButton";
export type { InspectorIconButtonProps } from "../components/inspector/parts/InspectorIconButton";
export { InspectorButtonGroup } from "../components/inspector/parts/InspectorButtonGroup";
export type {
  InspectorButtonGroupProps,
  InspectorButtonGroupOption,
} from "../components/inspector/parts/InspectorButtonGroup";
export { InspectorToggleGroup } from "../components/inspector/parts/InspectorToggleGroup";
export type {
  InspectorToggleGroupProps,
  InspectorToggleGroupOption,
} from "../components/inspector/parts/InspectorToggleGroup";
export { InspectorSelect } from "../components/inspector/parts/InspectorSelect";
export type { InspectorSelectProps } from "../components/inspector/parts/InspectorSelect";
export {
  InspectorDefinitionList,
  InspectorDefinitionItem,
} from "../components/inspector/parts/InspectorDefinitionList";
export type {
  InspectorDefinitionListProps,
  InspectorDefinitionItemProps,
} from "../components/inspector/parts/InspectorDefinitionList";
export { InspectorShortcutButton } from "../components/inspector/parts/InspectorShortcutButton";
export type { InspectorShortcutButtonProps } from "../components/inspector/parts/InspectorShortcutButton";
export { InspectorShortcutBindingValue } from "../components/inspector/parts/InspectorShortcutBindingValue";
export type { InspectorShortcutBindingValueProps } from "../components/inspector/parts/InspectorShortcutBindingValue";
export { PositionInputsGrid } from "../components/inspector/parts/PositionInputsGrid";
export type { PositionInputsGridProps } from "../components/inspector/parts/PositionInputsGrid";
export { ReadOnlyField } from "../components/inspector/parts/ReadOnlyField";
export type { ReadOnlyFieldProps } from "../components/inspector/parts/ReadOnlyField";
export { InspectorTabbedContainer } from "../components/inspector/parts/InspectorTabbedContainer";
export type {
  InspectorTabbedContainerProps,
  InspectorTabConfig,
} from "../components/inspector/parts/InspectorTabbedContainer";
