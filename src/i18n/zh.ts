/**
 * @file Traditional Chinese translation dictionary for the node editor
 */
import type { I18nMessages } from "./types";

export const zhMessages: I18nMessages = {
  // General UI
  loading: "載入中...",
  error: "錯誤",
  success: "成功",
  warning: "警告",
  cancel: "取消",
  confirm: "確認",
  save: "儲存",
  delete: "刪除",
  edit: "編輯",
  copy: "複製",
  cut: "剪下",
  paste: "貼上",
  addConnection: "新增連線…",
  untitled: "未命名",

  // Node Editor UI
  addNode: "新增節點",
  deleteNode: "刪除節點",
  duplicateNode: "複製節點",
  groupNodes: "群組節點",
  ungroupNodes: "取消群組",
  selectAll: "全選",
  clearSelection: "清除選取",

  // Toolbar
  resetView: "重設視圖",
  zoomIn: "放大",
  zoomOut: "縮小",
  autoLayout: "自動排版",
  gridSnap: "格線吸附",
  gridSnapOn: "格線吸附：開啟",
  gridSnapOff: "格線吸附：關閉",

  // Context Menu
  contextMenuAddNode: "新增節點",
  contextMenuDeleteNode: "刪除節點",
  contextMenuDuplicateNode: "複製節點",
  contextMenuEditNode: "編輯節點",
  contextMenuGroupSelected: "群組所選",
  contextMenuDeleteConnection: "刪除連線",
  contextMenuStyleInfo: "設定樣式：資訊",
  contextMenuStyleSuccess: "設定樣式：成功",
  contextMenuStyleWarning: "設定樣式：警告",
  contextMenuStyleError: "設定樣式：錯誤",
  contextMenuExpandGroup: "展開群組",
  contextMenuCollapseGroup: "收合群組",

  // Status Bar
  statusSelection: "選取：",
  statusTotal: "總計：",
  statusMode: "模式：",
  statusZoom: "縮放：",
  statusPosition: "位置：",
  statusGrid: "格線：",
  statusNone: "無",

  // Operation Modes
  modeReady: "就緒",
  modeMoving: "移動中",
  modeConnecting: "連線中",
  modeDisconnecting: "斷開中",
  modeSelecting: "選取中",
  modePanning: "平移中",

  // Node Types
  nodeStandard: "標準節點",
  nodeGroup: "群組節點",
  nodeInput: "輸入節點",
  nodeOutput: "輸出節點",

  // Inspector Panel
  inspectorTitle: "檢查器",
  inspectorNodeProperties: "節點屬性",
  inspectorConnectionProperties: "連線屬性",
  inspectorPosition: "位置",
  inspectorSize: "大小",
  inspectorData: "資料",
  inspectorVisible: "可見",
  inspectorLocked: "已鎖定",
  inspectorExpanded: "展開",
  inspectorGridSettings: "格線設定",
  inspectorShowGrid: "顯示格線",
  inspectorSnapToGrid: "吸附至格線",
  inspectorGridSize: "格線大小",
  inspectorSnapThreshold: "吸附臨界值",
  inspectorGeneralSettings: "一般設定",
  inspectorAutoSave: "啟用自動儲存",
  inspectorAutoSaveInterval: "自動儲存間隔（秒）",
  inspectorEmptyStatePrompt: "選取節點或連線以檢視其屬性",
  inspectorMultipleSelection: "多重選取",
  inspectorTabLayers: "圖層",
  inspectorLayersNodeCount: "{{count}} 個節點",
  inspectorTabProperties: "屬性",
  inspectorTabHistory: "歷史",
  inspectorTabSettings: "設定",
  inspectorNodeLibrary: "Node Library",
  inspectorNodeLibrarySearchPlaceholder: "Search nodes…",
  inspectorNodeLibraryEmptyState: "No nodes match your search",
  inspectorNodeLibraryLimitReached: "Limit reached",
  inspectorActions: "操作",
  inspectorInteractionHelpTitle: "互動指南",
  inspectorInteractionHelpSectionClipboard: "剪貼簿與編輯",
  inspectorInteractionHelpSectionSelection: "選取與佈局",
  inspectorInteractionHelpSectionHistory: "歷史與儲存",
  inspectorInteractionHelpUnassigned: "未指派",

  // Auto Layout Panel
  autoLayoutPanelDescription: "使用內建預設自動排列節點。",
  autoLayoutPanelNodeCount: "{{count}} 個節點",
  autoLayoutPanelNoNodes: "沒有節點",
  autoLayoutPanelPrimaryAction: "套用自動排版",
  autoLayoutPanelPrimaryHint: "自動排版預設使用階層式佈局。",
  autoLayoutPanelRun: "套用",
  autoLayoutPanelGridTitle: "格線佈局",
  autoLayoutPanelGridDescription: "將節點放置在均勻的格線上以維持間距。",
  autoLayoutPanelForceTitle: "力導向佈局",
  autoLayoutPanelForceDescription: "使用物理模擬群組已連線的節點。",

  // History Panel
  historyUndo: "復原",
  historyRedo: "重做",
  historyEmpty: "尚無歷史",
  historyTitle: "歷史",

  // Keyboard Shortcuts
  shortcutUndo: "復原 (Ctrl+Z)",
  shortcutRedo: "重做 (Ctrl+Y)",
  shortcutSelectAll: "全選 (Ctrl+A)",
  shortcutDelete: "刪除 (Delete)",
  shortcutCopy: "複製 (Ctrl+C)",
  shortcutPaste: "貼上 (Ctrl+V)",
  shortcutDuplicate: "重複 (Ctrl+D)",
  shortcutGroup: "群組 (Ctrl+G)",
  shortcutAutoLayout: "自動排版 (Ctrl+L)",
  shortcutSave: "儲存 (Ctrl+S)",

  // Validation Messages
  validationNodeTitle: "必須輸入節點標題",
  validationConnectionExists: "連線已存在",
  validationInvalidConnection: "無效的連線",
  validationCircularConnection: "不允許迴圈連線",

  // Version Management
  versionSnapshot: "快照",
  versionCreated: "建立時間",
  versionModified: "修改時間",
  versionAuthor: "作者",
  versionDescription: "描述",
  versionTags: "標籤",

  // Layer Management
  layerVisible: "可見",
  layerHidden: "隱藏",
  layerLocked: "已鎖定",
  layerUnlocked: "已解鎖",
  layerToggleVisibility: "切換可見狀態",
  layerToggleLock: "切換鎖定狀態",

  // Drag and Drop
  dragHint: "拖曳以移動",
  dropHint: "拖曳到此處",
  connectHint: "拖曳以連線",
  disconnectHint: "拖曳以斷開",
  snapHint: "吸附至格線",

  // Alignment Controls
  alignmentTitle: "對齊",
  alignmentCountLabel: "{{count}} 個節點",
  alignmentSelectPrompt: "選取至少 2 個節點",

  // Error Messages
  errorNodeNotFound: "找不到節點",
  errorConnectionNotFound: "找不到連線",
  errorInvalidAction: "無效的操作",
  errorSaveFailed: "儲存失敗",
  errorLoadFailed: "載入失敗",
  errorExportFailed: "匯出失敗",
  errorImportFailed: "匯入失敗",

  // Units and Formatting
  unitPixels: "px",
  unitPercent: "%",
  formatNodes: "節點",
  formatConnections: "連線",
  formatSnapGrid: "格線吸附",
  fieldTitle: "標題",
  fieldContent: "內容",
  labelTitlePlaceholder: "標題",
  labelSubtitlePlaceholder: "副標題",
  labelCaptionPlaceholder: "註解",
  fieldBackground: "背景",
  fieldOpacity: "不透明度",
  fieldTextColor: "文字顏色",
  inspectorGroupAppearanceTitle: "外觀",

  // Node Search Menu
  nodeSearchPlaceholder: "搜尋節點…",
  nodeSearchAriaLabel: "搜尋節點",
  nodeSearchHintNavigate: "導覽",
  nodeSearchHintCreate: "建立",
  nodeSearchHintCategory: "類別",
  nodeSearchHintClose: "關閉",
  nodeSearchFooter: "{{current}} / {{total}} • {{categories}} 個類別",
  nodeSearchNoResults: "找不到「{{query}}」相關的節點",
  nodeSearchCategoriesHeader: "類別",
  nodeSearchAllNodes: "所有節點",
  nodeSearchEmptyCategory: "此類別中沒有節點",
};
