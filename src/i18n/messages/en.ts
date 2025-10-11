import type { I18nMessages } from "../types";

export const enMessages: I18nMessages = {
  // General UI
  loading: "Loading...",
  error: "Error",
  success: "Success",
  warning: "Warning",
  cancel: "Cancel",
  confirm: "Confirm",
  save: "Save",
  delete: "Delete",
  edit: "Edit",
  copy: "Copy",
  cut: "Cut",
  paste: "Paste",
  addConnection: "Add Connection…",
  untitled: "Untitled",

  // Node Editor UI
  addNode: "Add Node",
  deleteNode: "Delete Node",
  duplicateNode: "Duplicate Node",
  groupNodes: "Group Nodes",
  ungroupNodes: "Ungroup Nodes",
  selectAll: "Select All",
  clearSelection: "Clear Selection",

  // Toolbar
  resetView: "Reset View",
  zoomIn: "Zoom In",
  zoomOut: "Zoom Out",
  autoLayout: "Auto Layout",
  gridSnap: "Grid Snap",
  gridSnapOn: "Grid Snap: ON",
  gridSnapOff: "Grid Snap: OFF",

  // Context Menu
  contextMenuAddNode: "Add Node",
  contextMenuDeleteNode: "Delete Node",
  contextMenuDuplicateNode: "Duplicate Node",
  contextMenuEditNode: "Edit Node",
  contextMenuGroupSelected: "Group Selected",
  contextMenuDeleteConnection: "Delete Connection",
  contextMenuStyleInfo: "Set Style: Info",
  contextMenuStyleSuccess: "Set Style: Success",
  contextMenuStyleWarning: "Set Style: Warning",
  contextMenuStyleError: "Set Style: Error",
  contextMenuExpandGroup: "Expand Group",
  contextMenuCollapseGroup: "Collapse Group",

  // Status Bar
  statusSelection: "Selection:",
  statusTotal: "Total:",
  statusMode: "Mode:",
  statusZoom: "Zoom:",
  statusPosition: "Position:",
  statusGrid: "Grid:",
  statusNone: "None",

  // Operation Modes
  modeReady: "Ready",
  modeMoving: "Moving",
  modeConnecting: "Connecting",
  modeDisconnecting: "Disconnecting",
  modeSelecting: "Selecting",
  modePanning: "Panning",

  // Node Types
  nodeStandard: "Standard Node",
  nodeGroup: "Group Node",
  nodeInput: "Input Node",
  nodeOutput: "Output Node",

  // Inspector Panel
  inspectorTitle: "Inspector",
  inspectorNodeProperties: "Node Properties",
  inspectorConnectionProperties: "Connection Properties",
  inspectorPosition: "Position",
  inspectorSize: "Size",
  inspectorData: "Data",
  inspectorVisible: "Visible",
  inspectorLocked: "Locked",
  inspectorExpanded: "Expanded",
  inspectorGridSettings: "Grid Settings",
  inspectorShowGrid: "Show Grid",
  inspectorSnapToGrid: "Snap to Grid",
  inspectorGridSize: "Grid Size",
  inspectorSnapThreshold: "Snap Threshold",
  inspectorGeneralSettings: "General Settings",
  inspectorAutoSave: "Enable Auto Save",
  inspectorAutoSaveInterval: "Auto Save Interval (seconds)",
  inspectorEmptyStatePrompt: "Select a node or connection to view its properties",
  inspectorMultipleSelection: "Multiple Selection",
  inspectorTabLayers: "Layers",
  inspectorLayersNodeCount: "{{count}} nodes",
  inspectorTabProperties: "Properties",
  inspectorTabHistory: "History",
  inspectorTabSettings: "Settings",
  inspectorActions: "Actions",

  // History Panel
  historyUndo: "Undo",
  historyRedo: "Redo",
  historyEmpty: "No history yet",
  historyTitle: "History",

  // Keyboard Shortcuts
  shortcutUndo: "Undo (Ctrl+Z)",
  shortcutRedo: "Redo (Ctrl+Y)",
  shortcutSelectAll: "Select All (Ctrl+A)",
  shortcutDelete: "Delete (Delete)",
  shortcutCopy: "Copy (Ctrl+C)",
  shortcutPaste: "Paste (Ctrl+V)",
  shortcutDuplicate: "Duplicate (Ctrl+D)",
  shortcutGroup: "Group (Ctrl+G)",
  shortcutAutoLayout: "Auto Layout (Ctrl+L)",
  shortcutSave: "Save (Ctrl+S)",

  // Validation Messages
  validationNodeTitle: "Node title is required",
  validationConnectionExists: "Connection already exists",
  validationInvalidConnection: "Invalid connection",
  validationCircularConnection: "Circular connection not allowed",

  // Version Management
  versionSnapshot: "Snapshot",
  versionCreated: "Created",
  versionModified: "Modified",
  versionAuthor: "Author",
  versionDescription: "Description",
  versionTags: "Tags",

  // Layer Management
  layerVisible: "Visible",
  layerHidden: "Hidden",
  layerLocked: "Locked",
  layerUnlocked: "Unlocked",
  layerToggleVisibility: "Toggle Visibility",
  layerToggleLock: "Toggle Lock",

  // Drag and Drop
  dragHint: "Drag to move",
  dropHint: "Drop here",
  connectHint: "Drag to connect",
  disconnectHint: "Drag to disconnect",
  snapHint: "Snap to grid",

  // Error Messages
  errorNodeNotFound: "Node not found",
  errorConnectionNotFound: "Connection not found",
  errorInvalidAction: "Invalid action",
  errorSaveFailed: "Save failed",
  errorLoadFailed: "Load failed",
  errorExportFailed: "Export failed",
  errorImportFailed: "Import failed",

  // Units and Formatting
  unitPixels: "px",
  unitPercent: "%",
  formatNodes: "nodes",
  formatConnections: "connections",
  formatSnapGrid: "snap",
  fieldTitle: "Title",
  fieldContent: "Content",
  labelTitlePlaceholder: "Title",
  labelSubtitlePlaceholder: "Subtitle",
  labelCaptionPlaceholder: "Caption",
  fieldBackground: "Background",
  fieldOpacity: "Opacity",
  fieldTextColor: "Text Color",
  inspectorGroupAppearanceTitle: "Appearance",
};
