import type { I18nMessages } from "../types";

export const jaMessages: I18nMessages = {
  // General UI
  loading: "読み込み中...",
  error: "エラー",
  success: "成功",
  warning: "警告",
  cancel: "キャンセル",
  confirm: "確認",
  save: "保存",
  delete: "削除",
  edit: "編集",
  copy: "コピー",
  cut: "切り取り",
  paste: "貼り付け",
  addConnection: "接続の追加…",
  untitled: "名称未設定",

  // Node Editor UI
  addNode: "ノード追加",
  deleteNode: "ノード削除",
  duplicateNode: "ノード複製",
  groupNodes: "ノードグループ化",
  ungroupNodes: "グループ解除",
  selectAll: "すべて選択",
  clearSelection: "選択解除",

  // Toolbar
  resetView: "ビューリセット",
  zoomIn: "ズームイン",
  zoomOut: "ズームアウト",
  autoLayout: "自動レイアウト",
  gridSnap: "グリッドスナップ",
  gridSnapOn: "グリッドスナップ: オン",
  gridSnapOff: "グリッドスナップ: オフ",

  // Context Menu
  contextMenuAddNode: "ノード追加",
  contextMenuDeleteNode: "ノード削除",
  contextMenuDuplicateNode: "ノード複製",
  contextMenuEditNode: "ノード編集",
  contextMenuGroupSelected: "選択項目をグループ化",
  contextMenuDeleteConnection: "接続削除",
  contextMenuStyleInfo: "スタイル設定: 情報",
  contextMenuStyleSuccess: "スタイル設定: 成功",
  contextMenuStyleWarning: "スタイル設定: 警告",
  contextMenuStyleError: "スタイル設定: エラー",
  contextMenuExpandGroup: "グループ展開",
  contextMenuCollapseGroup: "グループ折りたたみ",

  // Status Bar
  statusSelection: "選択:",
  statusTotal: "合計:",
  statusMode: "モード:",
  statusZoom: "ズーム:",
  statusPosition: "位置:",
  statusGrid: "グリッド:",
  statusNone: "なし",

  // Operation Modes
  modeReady: "待機中",
  modeMoving: "移動中",
  modeConnecting: "接続中",
  modeDisconnecting: "切断中",
  modeSelecting: "選択中",
  modePanning: "パン中",

  // Node Types
  nodeStandard: "標準ノード",
  nodeGroup: "グループノード",
  nodeInput: "入力ノード",
  nodeOutput: "出力ノード",

  // Inspector Panel
  inspectorTitle: "インスペクター",
  inspectorNodeProperties: "ノードプロパティ",
  inspectorConnectionProperties: "接続プロパティ",
  inspectorPosition: "位置",
  inspectorSize: "サイズ",
  inspectorData: "データ",
  inspectorVisible: "表示",
  inspectorLocked: "ロック",
  inspectorExpanded: "展開",
  inspectorGridSettings: "グリッド設定",
  inspectorShowGrid: "グリッド表示",
  inspectorSnapToGrid: "グリッドにスナップ",
  inspectorGridSize: "グリッドサイズ",
  inspectorSnapThreshold: "スナップ閾値",
  inspectorGeneralSettings: "全般設定",
  inspectorAutoSave: "自動保存を有効にする",
  inspectorAutoSaveInterval: "自動保存間隔（秒）",
  inspectorEmptyStatePrompt: "プロパティを表示するにはノードまたは接続を選択してください",
  inspectorMultipleSelection: "複数選択",
  inspectorTabLayers: "レイヤー",
  inspectorLayersNodeCount: "ノード数: {{count}}",
  inspectorTabProperties: "プロパティ",
  inspectorTabHistory: "履歴",
  inspectorTabSettings: "設定",
  inspectorActions: "操作",

  // History Panel
  historyUndo: "元に戻す",
  historyRedo: "やり直し",
  historyEmpty: "履歴はまだありません",
  historyTitle: "履歴",

  // Keyboard Shortcuts
  shortcutUndo: "元に戻す (Ctrl+Z)",
  shortcutRedo: "やり直し (Ctrl+Y)",
  shortcutSelectAll: "すべて選択 (Ctrl+A)",
  shortcutDelete: "削除 (Delete)",
  shortcutCopy: "コピー (Ctrl+C)",
  shortcutPaste: "貼り付け (Ctrl+V)",
  shortcutDuplicate: "複製 (Ctrl+D)",
  shortcutGroup: "グループ化 (Ctrl+G)",
  shortcutAutoLayout: "自動レイアウト (Ctrl+L)",
  shortcutSave: "保存 (Ctrl+S)",

  // Validation Messages
  validationNodeTitle: "ノードタイトルは必須です",
  validationConnectionExists: "接続が既に存在します",
  validationInvalidConnection: "無効な接続です",
  validationCircularConnection: "循環接続は許可されていません",

  // Version Management
  versionSnapshot: "スナップショット",
  versionCreated: "作成日時",
  versionModified: "変更日時",
  versionAuthor: "作成者",
  versionDescription: "説明",
  versionTags: "タグ",

  // Layer Management
  layerVisible: "表示",
  layerHidden: "非表示",
  layerLocked: "ロック",
  layerUnlocked: "ロック解除",
  layerToggleVisibility: "表示切り替え",
  layerToggleLock: "ロック切り替え",

  // Drag and Drop
  dragHint: "ドラッグして移動",
  dropHint: "ここにドロップ",
  connectHint: "ドラッグして接続",
  disconnectHint: "ドラッグして切断",
  snapHint: "グリッドにスナップ",

  // Error Messages
  errorNodeNotFound: "ノードが見つかりません",
  errorConnectionNotFound: "接続が見つかりません",
  errorInvalidAction: "無効な操作です",
  errorSaveFailed: "保存に失敗しました",
  errorLoadFailed: "読み込みに失敗しました",
  errorExportFailed: "エクスポートに失敗しました",
  errorImportFailed: "インポートに失敗しました",

  // Units and Formatting
  unitPixels: "px",
  unitPercent: "%",
  formatNodes: "ノード",
  formatConnections: "接続",
  formatSnapGrid: "スナップ",
  fieldTitle: "タイトル",
  fieldContent: "内容",
  labelTitlePlaceholder: "タイトル",
  labelSubtitlePlaceholder: "サブタイトル",
  labelCaptionPlaceholder: "キャプション",
  fieldBackground: "背景色",
  fieldOpacity: "透明度",
  fieldTextColor: "文字色",
  inspectorGroupAppearanceTitle: "外観",
};
