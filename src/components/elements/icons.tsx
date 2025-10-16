/**
 * @file Icon components
 */
import React from "react";
import styles from "./icons.module.css";

export type IconProps = {
  size?: number | string;
  color?: string;
} & React.SVGAttributes<SVGElement>;

const createIcon = (path: React.ReactNode | string, viewBox: string = "0 0 24 24") => {
  return React.forwardRef<SVGSVGElement, IconProps>(
    ({ size = 16, color = "currentColor", className = "", ...props }, ref) => (
      <svg
        ref={ref}
        className={[styles.icon, className].filter(Boolean).join(" ")}
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {typeof path === "string" ? <path d={path} /> : path}
      </svg>
    ),
  );
};

// Alignment Icons
export const AlignLeftIcon = createIcon("M17 10H3M21 6H3M21 14H3M17 18H3");

export const AlignCenterIcon = createIcon("M18 10H6M21 6H3M21 14H3M18 18H6");

export const AlignRightIcon = createIcon("M21 10H7M21 6H3M21 14H3M21 18H7");

export const AlignTopIcon = createIcon("M3 3H21M8 8V21M16 8V21M12 8V21");

export const AlignMiddleIcon = createIcon("M3 12H21M8 3V21M16 3V21M12 3V21");

export const AlignBottomIcon = createIcon("M3 21H21M8 3V16M16 3V16M12 3V16");

export const DistributeHorizontalIcon = createIcon("M3 3V21M21 3V21M8 6H16M8 12H16M8 18H16");

export const DistributeVerticalIcon = createIcon("M3 3H21M3 21H21M6 8V16M12 8V16M18 8V16");

// Close Icon
export const CloseIcon = createIcon("M18 6L6 18M6 6L18 18");

// Additional common icons
export const CheckIcon = createIcon("M20 6L9 17L4 12");

export const ChevronDownIcon = createIcon("M6 9L12 15L18 9");

export const ChevronUpIcon = createIcon("M18 15L12 9L6 15");

export const ChevronLeftIcon = createIcon("M15 18L9 12L15 6");

export const ChevronRightIcon = createIcon("M9 18L15 12L9 6");

export const PlusIcon = createIcon("M12 5V19M5 12H19");

export const MinusIcon = createIcon("M5 12H19");

export const EditIcon = createIcon(
  "M11 4H4A2 2 0 0 0 2 6V18A2 2 0 0 0 4 20H16A2 2 0 0 0 18 18V11M18.5 2.5A2.121 2.121 0 0 1 21 5L5.5 20.5L2 22L3.5 18.5L18.5 2.5Z",
);

export const DeleteIcon = createIcon(
  "M3 6H5H21M8 6V4A2 2 0 0 1 10 2H14A2 2 0 0 1 16 4V6M19 6V20A2 2 0 0 1 17 22H7A2 2 0 0 1 5 20V6H19Z",
);

export const SearchIcon = createIcon("M21 21L16.514 16.506L21 21ZM18 10.5A7.5 7.5 0 1 1 3 10.5A7.5 7.5 0 0 1 18 10.5Z");

export const SettingsIcon = createIcon(
  "M12 15A3 3 0 1 0 12 9A3 3 0 0 0 12 15ZM19.4 15A1.65 1.65 0 0 0 19.04 13.36L20.55 12L19.04 10.64A1.65 1.65 0 0 0 19.4 9L18.76 7.4A1.65 1.65 0 0 0 17.45 6.63L15.55 7.1A7.1 7.1 0 0 0 14.12 6.16L13.91 4.23A1.65 1.65 0 0 0 12.29 3H11.71A1.65 1.65 0 0 0 10.09 4.23L9.88 6.16A7.1 7.1 0 0 0 8.45 7.1L6.55 6.63A1.65 1.65 0 0 0 5.24 7.4L4.6 9A1.65 1.65 0 0 0 4.96 10.64L3.45 12L4.96 13.36A1.65 1.65 0 0 0 4.6 15L5.24 16.6A1.65 1.65 0 0 0 6.55 17.37L8.45 16.9A7.1 7.1 0 0 0 9.88 17.84L10.09 19.77A1.65 1.65 0 0 0 11.71 21H12.29A1.65 1.65 0 0 0 13.91 19.77L14.12 17.84A7.1 7.1 0 0 0 15.55 16.9L17.45 17.37A1.65 1.65 0 0 0 18.76 16.6L19.4 15Z",
);

// Clipboard & edit actions
export const CopyIcon = createIcon(
  "M16 16H8A2 2 0 0 1 6 14V6A2 2 0 0 1 8 4H16A2 2 0 0 1 18 6V14A2 2 0 0 1 16 16ZM4 8V18A2 2 0 0 0 6 20H14",
);

export const CutIcon = createIcon(
  <>
    <circle cx="6" cy="7" r="3" />
    <circle cx="6" cy="17" r="3" />
    <circle cx="11.5" cy="12" r="1" />
    <line x1="6" y1="9" x2="11" y2="12" />
    <line x1="6" y1="15" x2="11" y2="12" />
    <line x1="11" y1="12" x2="20" y2="4" />
    <line x1="11" y1="12" x2="20" y2="20" />
  </>,
  );

export const PasteIcon = createIcon(
  "M19 21H8A2 2 0 0 1 6 19V7H10V5A2 2 0 0 1 12 3H14A2 2 0 0 1 16 5V7H20V19A2 2 0 0 1 18 21ZM12 7H14",
);

export const DuplicateIcon = createIcon("M8 8H20V20H8V8ZM4 4H16V8H4V4Z");

// Lock/Unlock Icons
export const LockIcon = createIcon(
  <>
    <rect x="6" y="11" width="12" height="9" rx="2" ry="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>,
  "0 0 24 24",
);

export const UnlockIcon = createIcon(
  <>
    <rect x="6" y="11" width="12" height="9" rx="2" ry="2" />
    <path d="M16 11V7a4 4 0 1 0-8 0" />
  </>,
  "0 0 24 24",
);
