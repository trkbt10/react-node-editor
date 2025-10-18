/**
 * @file Type definitions for internationalization system
 */

export type Locale = "en" | "ja" | "zh" | "zh-CN" | "ko" | "es" | "fr" | "de" | (string & Record<never, never>);

export type I18nMessages = {
  // General UI
  loading: string;
  error: string;
  success: string;
  warning: string;
  cancel: string;
  confirm: string;
  save: string;
  delete: string;
  edit: string;
  copy: string;
  cut?: string;
  paste: string;
  addConnection?: string;
  // Generic labels
  untitled: string;

  // Node Editor UI
  addNode: string;
  deleteNode: string;
  duplicateNode: string;
  groupNodes: string;
  ungroupNodes: string;
  selectAll: string;
  clearSelection: string;

  // Toolbar
  resetView: string;
  zoomIn: string;
  zoomOut: string;
  autoLayout: string;
  gridSnap: string;
  gridSnapOn: string;
  gridSnapOff: string;

  // Context Menu
  contextMenuAddNode: string;
  contextMenuDeleteNode: string;
  contextMenuDuplicateNode: string;
  contextMenuEditNode: string;
  contextMenuGroupSelected: string;
  contextMenuDeleteConnection: string;
  contextMenuStyleInfo: string;
  contextMenuStyleSuccess: string;
  contextMenuStyleWarning: string;
  contextMenuStyleError: string;
  contextMenuExpandGroup: string;
  contextMenuCollapseGroup: string;

  // Status Bar
  statusSelection: string;
  statusTotal: string;
  statusMode: string;
  statusZoom: string;
  statusPosition: string;
  statusGrid: string;
  statusNone: string;

  // Operation Modes
  modeReady: string;
  modeMoving: string;
  modeConnecting: string;
  modeDisconnecting: string;
  modeSelecting: string;
  modePanning: string;

  // Node Types
  nodeStandard: string;
  nodeGroup: string;
  nodeInput: string;
  nodeOutput: string;

  // Inspector Panel
  inspectorTitle: string;
  inspectorNodeProperties: string;
  inspectorConnectionProperties: string;
  inspectorPosition: string;
  inspectorSize: string;
  inspectorData: string;
  inspectorVisible: string;
  inspectorLocked: string;
  inspectorExpanded: string;
  inspectorGridSettings?: string;
  inspectorShowGrid?: string;
  inspectorSnapToGrid?: string;
  inspectorGridSize?: string;
  inspectorSnapThreshold?: string;
  inspectorGeneralSettings?: string;
  inspectorAutoSave?: string;
  inspectorAutoSaveInterval?: string;
  inspectorEmptyStatePrompt?: string;
  inspectorMultipleSelection?: string;
  inspectorTabLayers?: string;
  inspectorLayersNodeCount?: string;
  inspectorTabProperties?: string;
  inspectorTabHistory?: string;
  inspectorTabSettings?: string;
  inspectorNodeLibrary?: string;
  inspectorNodeLibrarySearchPlaceholder?: string;
  inspectorNodeLibraryEmptyState?: string;
  inspectorNodeLibraryLimitReached?: string;
  inspectorActions?: string;
  inspectorInteractionHelpTitle?: string;
  inspectorInteractionHelpSectionClipboard?: string;
  inspectorInteractionHelpSectionSelection?: string;
  inspectorInteractionHelpSectionHistory?: string;
  inspectorInteractionHelpUnassigned?: string;
  inspectorInteractionHelpSectionPointer?: string;
  inspectorInteractionHelpPointerNodeSelect?: string;
  inspectorInteractionHelpPointerNodeMultiSelect?: string;
  inspectorInteractionHelpPointerRangeSelect?: string;
  inspectorInteractionHelpPointerNodeContextMenu?: string;
  inspectorInteractionHelpPointerCanvasContextMenu?: string;
  inspectorInteractionHelpPointerCanvasClearSelection?: string;
  inspectorInteractionHelpPointerCanvasPan?: string;
  inspectorInteractionHelpPointerEmptyTargetSuffix?: string;
  inspectorInteractionHelpEdit?: string;
  inspectorInteractionHelpCancel?: string;
  inspectorInteractionHelpReset?: string;
  inspectorInteractionHelpClear?: string;
  inspectorInteractionHelpKeyboardPrompt?: string;
  inspectorInteractionHelpPointerPrompt?: string;

  // Auto Layout Panel
  autoLayoutPanelDescription: string;
  autoLayoutPanelNodeCount: string;
  autoLayoutPanelNoNodes: string;
  autoLayoutPanelPrimaryAction: string;
  autoLayoutPanelPrimaryHint: string;
  autoLayoutPanelRun: string;
  autoLayoutPanelGridTitle: string;
  autoLayoutPanelGridDescription: string;
  autoLayoutPanelForceTitle: string;
  autoLayoutPanelForceDescription: string;

  // History Panel
  historyUndo?: string;
  historyRedo?: string;
  historyEmpty?: string;
  historyTitle?: string;

  // Keyboard Shortcuts
  shortcutUndo: string;
  shortcutRedo: string;
  shortcutSelectAll: string;
  shortcutDelete: string;
  shortcutCopy: string;
  shortcutPaste: string;
  shortcutDuplicate: string;
  shortcutGroup: string;
  shortcutAutoLayout: string;
  shortcutSave: string;

  // Validation Messages
  validationNodeTitle: string;
  validationConnectionExists: string;
  validationInvalidConnection: string;
  validationCircularConnection: string;

  // Version Management
  versionSnapshot: string;
  versionCreated: string;
  versionModified: string;
  versionAuthor: string;
  versionDescription: string;
  versionTags: string;

  // Layer Management
  layerVisible: string;
  layerHidden: string;
  layerLocked: string;
  layerUnlocked: string;
  layerToggleVisibility: string;
  layerToggleLock: string;

  // Drag and Drop
  dragHint: string;
  dropHint: string;
  connectHint: string;
  disconnectHint: string;
  snapHint: string;

  // Error Messages
  errorNodeNotFound: string;
  errorConnectionNotFound: string;
  errorInvalidAction: string;
  errorSaveFailed: string;
  errorLoadFailed: string;
  errorExportFailed: string;
  errorImportFailed: string;

  // Units and Formatting
  unitPixels: string;
  unitPercent: string;
  formatNodes: string;
  formatConnections: string;
  formatSnapGrid: string;
  // Generic field labels
  fieldTitle?: string;
  fieldContent?: string;

  // Alignment controls
  alignmentTitle?: string;
  alignmentCountLabel?: string;
  alignmentSelectPrompt?: string;

  // Extended: Label/Group specific
  labelTitlePlaceholder?: string;
  labelSubtitlePlaceholder?: string;
  labelCaptionPlaceholder?: string;
  fieldBackground?: string;
  fieldOpacity?: string;
  fieldTextColor?: string;
  inspectorGroupAppearanceTitle?: string;
};

export type I18nKey = keyof I18nMessages;

export type I18nConfig = {
  locale: Locale;
  fallbackLocale: Locale;
  dictionaries: Partial<Record<Locale, I18nMessages>>;
};

export type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: I18nKey, params?: Record<string, string | number>) => string;
  availableLocales: Locale[];
};

export type I18nDictionaries = Partial<Record<Locale, I18nMessages>>;
