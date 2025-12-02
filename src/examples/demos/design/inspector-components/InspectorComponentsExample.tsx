/**
 * @file Preview of inspector form components for design verification
 */
import * as React from "react";

import { H2 } from "../../../../components/elements/Heading";
import { PropertySection } from "../../../../components/inspector/parts/PropertySection";
import { InspectorFieldRow } from "../../../../components/inspector/parts/InspectorFieldRow";
import { InspectorInput } from "../../../../components/inspector/parts/InspectorInput";
import { InspectorSelect } from "../../../../components/inspector/parts/InspectorSelect";
import { InspectorButtonGroup } from "../../../../components/inspector/parts/InspectorButtonGroup";
import { InspectorToggleGroup } from "../../../../components/inspector/parts/InspectorToggleGroup";
import { InspectorIconButton } from "../../../../components/inspector/parts/InspectorIconButton";
import { InspectorButton } from "../../../../components/inspector/parts/InspectorButton";
import classes from "./InspectorComponentsExample.module.css";

const AlignLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="14" y2="12" />
    <line x1="4" y1="18" x2="18" y2="18" />
  </svg>
);

const AlignCenterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="5" y1="18" x2="19" y2="18" />
  </svg>
);

const AlignRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="10" y1="12" x2="20" y2="12" />
    <line x1="6" y1="18" x2="20" y2="18" />
  </svg>
);

const ResizeWidthIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="12" x2="20" y2="12" />
    <polyline points="8 8 4 12 8 16" />
    <polyline points="16 8 20 12 16 16" />
  </svg>
);

const ResizeHeightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="4" x2="12" y2="20" />
    <polyline points="8 8 12 4 16 8" />
    <polyline points="8 16 12 20 16 16" />
  </svg>
);

const ResizeBothIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="6" y="6" width="12" height="12" />
    <polyline points="6 9 3 12 6 15" />
    <polyline points="18 9 21 12 18 15" />
    <polyline points="9 6 12 3 15 6" />
    <polyline points="9 18 12 21 15 18" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const alignmentOptions = [
  { value: "left", label: <AlignLeftIcon />, "aria-label": "Align left" },
  { value: "center", label: <AlignCenterIcon />, "aria-label": "Align center" },
  { value: "right", label: <AlignRightIcon />, "aria-label": "Align right" },
];

const resizingOptions = [
  { value: "width", label: <ResizeWidthIcon />, "aria-label": "Resize width" },
  { value: "height", label: <ResizeHeightIcon />, "aria-label": "Resize height" },
  { value: "both", label: <ResizeBothIcon />, "aria-label": "Resize both" },
];

/**
 * Showcase of inspector form components with interactive state
 */
export function InspectorComponentsExample(): React.ReactElement {
  const [alignment, setAlignment] = React.useState<string>("left");
  const [resizing, setResizing] = React.useState<string>("width");
  const [toggleValues, setToggleValues] = React.useState<string[]>(["a"]);
  const [inputValue, setInputValue] = React.useState("100");
  const [selectValue, setSelectValue] = React.useState("montserrat");
  const [variant, setVariant] = React.useState<"default" | "outline" | "filled">("default");
  const [iconButtonActive, setIconButtonActive] = React.useState(false);

  return (
    <div className={classes.container}>
      <div className={classes.preview}>
        <div className={classes.previewHeader}>
          <H2 size="lg" weight="semibold">
            Inspector Form Components
          </H2>
          <p className={classes.previewSubtitle}>
            Interactive preview of inspector-specific form controls. Switch themes to see how they adapt.
          </p>
        </div>

        <div className={classes.previewContent}>
          <PropertySection title="Position">
            <div className={classes.sectionContent}>
              <InspectorFieldRow label="Alignment">
                <InspectorButtonGroup
                  options={alignmentOptions}
                  value={alignment}
                  onChange={setAlignment}
                  aria-label="Text alignment"
                />
              </InspectorFieldRow>
              <InspectorFieldRow label="Position">
                <div className={classes.inputGrid}>
                  <InspectorInput label="X" type="number" value="2044.94" onChange={() => {}} />
                  <InspectorInput label="Y" type="number" value="307.7" onChange={() => {}} />
                </div>
              </InspectorFieldRow>
            </div>
          </PropertySection>

          <PropertySection title="Layout">
            <div className={classes.sectionContent}>
              <InspectorFieldRow label="Resizing">
                <InspectorButtonGroup
                  options={resizingOptions}
                  value={resizing}
                  onChange={setResizing}
                  aria-label="Resizing mode"
                />
              </InspectorFieldRow>
              <InspectorFieldRow label="Dimensions">
                <div className={classes.inputGrid}>
                  <InspectorInput label="W" type="number" value="91" onChange={() => {}} />
                  <InspectorInput label="H" type="number" value="15" onChange={() => {}} />
                </div>
              </InspectorFieldRow>
            </div>
          </PropertySection>

          <PropertySection
            title="Appearance"
            headerRight={
              <div className={classes.headerActions}>
                <InspectorIconButton
                  icon={<EyeIcon />}
                  aria-label="Toggle visibility"
                  active={iconButtonActive}
                  onClick={() => setIconButtonActive(!iconButtonActive)}
                />
                <InspectorIconButton icon={<LockIcon />} aria-label="Toggle lock" />
              </div>
            }
          >
            <div className={classes.sectionContent}>
              <InspectorFieldRow label="Opacity">
                <InspectorInput type="text" value="100%" onChange={() => {}} />
              </InspectorFieldRow>
              <InspectorFieldRow label="Corner radius">
                <InspectorInput type="number" value="0" onChange={() => {}} />
              </InspectorFieldRow>
            </div>
          </PropertySection>

          <PropertySection
            title="Typography"
            headerRight={
              <InspectorIconButton icon={<SettingsIcon />} aria-label="Typography settings" size="small" />
            }
          >
            <div className={classes.sectionContent}>
              <InspectorSelect value={selectValue} onChange={(e) => setSelectValue(e.target.value)}>
                <option value="montserrat">Montserrat</option>
                <option value="inter">Inter</option>
                <option value="roboto">Roboto</option>
              </InspectorSelect>
              <div className={classes.inputGrid}>
                <InspectorSelect>
                  <option value="regular">Regular</option>
                  <option value="medium">Medium</option>
                  <option value="bold">Bold</option>
                </InspectorSelect>
                <InspectorSelect>
                  <option value="12">12</option>
                  <option value="14">14</option>
                  <option value="16">16</option>
                </InspectorSelect>
              </div>
            </div>
          </PropertySection>
        </div>
      </div>

      <div className={classes.controls}>
        <PropertySection title="Component Variants">
          <div className={classes.sectionContent}>
            <InspectorFieldRow label="Input Variant">
              <InspectorButtonGroup
                options={[
                  { value: "default", label: "Default" },
                  { value: "outline", label: "Outline" },
                  { value: "filled", label: "Filled" },
                ]}
                value={variant}
                onChange={(v) => setVariant(v as typeof variant)}
                aria-label="Input variant"
              />
            </InspectorFieldRow>
          </div>
        </PropertySection>

        <PropertySection title="Input States">
          <div className={classes.stateGrid}>
            <div className={classes.stateItem}>
              <span className={classes.stateLabel}>Normal</span>
              <InspectorInput variant={variant} value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
            </div>
            <div className={classes.stateItem}>
              <span className={classes.stateLabel}>With Label</span>
              <InspectorInput variant={variant} label="X" value="100" onChange={() => {}} />
            </div>
            <div className={classes.stateItem}>
              <span className={classes.stateLabel}>Error</span>
              <InspectorInput variant={variant} error value="Invalid" onChange={() => {}} />
            </div>
            <div className={classes.stateItem}>
              <span className={classes.stateLabel}>Disabled</span>
              <InspectorInput variant={variant} disabled value="Disabled" onChange={() => {}} />
            </div>
          </div>
        </PropertySection>

        <PropertySection title="Select States">
          <div className={classes.stateGrid}>
            <div className={classes.stateItem}>
              <span className={classes.stateLabel}>Normal</span>
              <InspectorSelect variant={variant}>
                <option>Option 1</option>
                <option>Option 2</option>
              </InspectorSelect>
            </div>
            <div className={classes.stateItem}>
              <span className={classes.stateLabel}>Error</span>
              <InspectorSelect variant={variant} error>
                <option>Invalid</option>
              </InspectorSelect>
            </div>
            <div className={classes.stateItem}>
              <span className={classes.stateLabel}>Disabled</span>
              <InspectorSelect variant={variant} disabled>
                <option>Disabled</option>
              </InspectorSelect>
            </div>
          </div>
        </PropertySection>

        <PropertySection title="Button Group">
          <div className={classes.sectionContent}>
            <InspectorFieldRow label="Default Size">
              <InspectorButtonGroup options={alignmentOptions} value={alignment} onChange={setAlignment} aria-label="Alignment" />
            </InspectorFieldRow>
            <InspectorFieldRow label="Compact Size">
              <InspectorButtonGroup options={alignmentOptions} value={alignment} onChange={setAlignment} size="compact" aria-label="Alignment compact" />
            </InspectorFieldRow>
          </div>
        </PropertySection>

        <PropertySection title="Toggle Group (Multi-select)">
          <div className={classes.sectionContent}>
            <InspectorToggleGroup
              options={[
                { value: "a", label: "A" },
                { value: "b", label: "B" },
                { value: "c", label: "C" },
              ]}
              value={toggleValues}
              onChange={(v) => setToggleValues(v as string[])}
              multiple
              aria-label="Multi-select options"
            />
            <span className={classes.stateLabel}>Selected: {toggleValues.join(", ") || "none"}</span>
          </div>
        </PropertySection>

        <PropertySection title="Icon Buttons">
          <div className={classes.iconButtonGrid}>
            <div className={classes.iconButtonItem}>
              <InspectorIconButton icon={<EyeIcon />} aria-label="Eye" />
              <span className={classes.iconLabel}>Default</span>
            </div>
            <div className={classes.iconButtonItem}>
              <InspectorIconButton icon={<EyeIcon />} aria-label="Eye" size="small" />
              <span className={classes.iconLabel}>Small</span>
            </div>
            <div className={classes.iconButtonItem}>
              <InspectorIconButton icon={<EyeIcon />} aria-label="Eye" active />
              <span className={classes.iconLabel}>Active</span>
            </div>
            <div className={classes.iconButtonItem}>
              <InspectorIconButton icon={<EyeIcon />} aria-label="Eye" disabled />
              <span className={classes.iconLabel}>Disabled</span>
            </div>
          </div>
        </PropertySection>

        <PropertySection title="Standard Buttons">
          <div className={classes.buttonGrid}>
            <InspectorButton variant="primary">Primary</InspectorButton>
            <InspectorButton variant="secondary">Secondary</InspectorButton>
            <InspectorButton variant="ghost">Ghost</InspectorButton>
            <InspectorButton variant="danger">Danger</InspectorButton>
          </div>
        </PropertySection>
      </div>
    </div>
  );
}
