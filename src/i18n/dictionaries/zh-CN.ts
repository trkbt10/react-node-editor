/**
 * @file Simplified Chinese translation dictionary for the node editor
 */
import type { I18nMessages } from "../types";

export const zhCNMessages: I18nMessages = {
  // General UI
  loading: "加载中...",
  error: "错误",
  success: "成功",
  warning: "警告",
  cancel: "取消",
  confirm: "确认",
  save: "保存",
  delete: "删除",
  edit: "编辑",
  copy: "复制",
  cut: "剪切",
  paste: "粘贴",
  addConnection: "添加连接…",
  untitled: "无标题",

  // Node Editor UI
  addNode: "添加节点",
  deleteNode: "删除节点",
  duplicateNode: "复制节点",
  groupNodes: "分组节点",
  ungroupNodes: "取消分组",
  selectAll: "全选",
  clearSelection: "清除选择",

  // Toolbar
  resetView: "重置视图",
  zoomIn: "放大",
  zoomOut: "缩小",
  autoLayout: "自动布局",
  gridSnap: "网格吸附",
  gridSnapOn: "网格吸附：开启",
  gridSnapOff: "网格吸附：关闭",

  // Context Menu
  contextMenuAddNode: "添加节点",
  contextMenuDeleteNode: "删除节点",
  contextMenuDuplicateNode: "复制节点",
  contextMenuEditNode: "编辑节点",
  contextMenuGroupSelected: "分组所选",
  contextMenuDeleteConnection: "删除连接",
  contextMenuStyleInfo: "设置样式：信息",
  contextMenuStyleSuccess: "设置样式：成功",
  contextMenuStyleWarning: "设置样式：警告",
  contextMenuStyleError: "设置样式：错误",
  contextMenuExpandGroup: "展开组",
  contextMenuCollapseGroup: "折叠组",

  // Status Bar
  statusSelection: "选中：",
  statusTotal: "总计：",
  statusMode: "模式：",
  statusZoom: "缩放：",
  statusPosition: "位置：",
  statusGrid: "网格：",
  statusNone: "无",

  // Operation Modes
  modeReady: "就绪",
  modeMoving: "移动中",
  modeConnecting: "连接中",
  modeDisconnecting: "断开中",
  modeSelecting: "选择中",
  modePanning: "平移中",

  // Node Types
  nodeStandard: "标准节点",
  nodeGroup: "组节点",
  nodeInput: "输入节点",
  nodeOutput: "输出节点",

  // Inspector Panel
  inspectorTitle: "检查器",
  inspectorNodeProperties: "节点属性",
  inspectorConnectionProperties: "连接属性",
  inspectorPosition: "位置",
  inspectorSize: "尺寸",
  inspectorData: "数据",
  inspectorVisible: "可见",
  inspectorLocked: "锁定",
  inspectorExpanded: "展开",
  inspectorGridSettings: "网格设置",
  inspectorShowGrid: "显示网格",
  inspectorSnapToGrid: "吸附到网格",
  inspectorGridSize: "网格大小",
  inspectorSnapThreshold: "吸附阈值",
  inspectorGeneralSettings: "通用设置",
  inspectorAutoSave: "启用自动保存",
  inspectorAutoSaveInterval: "自动保存间隔（秒）",
  inspectorEmptyStatePrompt: "选择节点或连接可查看其属性",
  inspectorMultipleSelection: "多重选择",
  inspectorTabLayers: "图层",
  inspectorLayersNodeCount: "{{count}} 个节点",
  inspectorTabProperties: "属性",
  inspectorTabHistory: "历史",
  inspectorTabSettings: "设置",
  inspectorActions: "操作",
  inspectorInteractionHelpTitle: "交互指南",
  inspectorInteractionHelpSectionClipboard: "剪贴板与编辑",
  inspectorInteractionHelpSectionSelection: "选择与布局",
  inspectorInteractionHelpSectionHistory: "历史与保存",
  inspectorInteractionHelpUnassigned: "未分配",

  // Auto Layout Panel
  autoLayoutPanelDescription: "使用内置预设自动排列节点。",
  autoLayoutPanelNodeCount: "{{count}} 个节点",
  autoLayoutPanelNoNodes: "没有节点",
  autoLayoutPanelPrimaryAction: "应用自动布局",
  autoLayoutPanelPrimaryHint: "自动布局默认使用分层布局。",
  autoLayoutPanelRun: "应用",
  autoLayoutPanelGridTitle: "网格布局",
  autoLayoutPanelGridDescription: "将节点放置在均匀的网格上以保持间距。",
  autoLayoutPanelForceTitle: "力导向布局",
  autoLayoutPanelForceDescription: "使用物理模拟聚类已连接的节点。",

  // History Panel
  historyUndo: "撤销",
  historyRedo: "重做",
  historyEmpty: "暂无历史",
  historyTitle: "历史",

  // Keyboard Shortcuts
  shortcutUndo: "撤销 (Ctrl+Z)",
  shortcutRedo: "重做 (Ctrl+Y)",
  shortcutSelectAll: "全选 (Ctrl+A)",
  shortcutDelete: "删除 (Delete)",
  shortcutCopy: "复制 (Ctrl+C)",
  shortcutPaste: "粘贴 (Ctrl+V)",
  shortcutDuplicate: "重复 (Ctrl+D)",
  shortcutGroup: "分组 (Ctrl+G)",
  shortcutAutoLayout: "自动布局 (Ctrl+L)",
  shortcutSave: "保存 (Ctrl+S)",

  // Validation Messages
  validationNodeTitle: "节点标题为必填项",
  validationConnectionExists: "连接已存在",
  validationInvalidConnection: "无效的连接",
  validationCircularConnection: "不允许循环连接",

  // Version Management
  versionSnapshot: "快照",
  versionCreated: "创建时间",
  versionModified: "修改时间",
  versionAuthor: "作者",
  versionDescription: "描述",
  versionTags: "标签",

  // Layer Management
  layerVisible: "可见",
  layerHidden: "隐藏",
  layerLocked: "已锁定",
  layerUnlocked: "已解锁",
  layerToggleVisibility: "切换可见性",
  layerToggleLock: "切换锁定",

  // Drag and Drop
  dragHint: "拖动以移动",
  dropHint: "拖到此处",
  connectHint: "拖动以连接",
  disconnectHint: "拖动以断开",
  snapHint: "吸附到网格",

  // Alignment Controls
  alignmentTitle: "对齐",
  alignmentCountLabel: "{{count}} 个节点",
  alignmentSelectPrompt: "选择至少 2 个节点",

  // Error Messages
  errorNodeNotFound: "未找到节点",
  errorConnectionNotFound: "未找到连接",
  errorInvalidAction: "无效的操作",
  errorSaveFailed: "保存失败",
  errorLoadFailed: "加载失败",
  errorExportFailed: "导出失败",
  errorImportFailed: "导入失败",

  // Units and Formatting
  unitPixels: "px",
  unitPercent: "%",
  formatNodes: "节点",
  formatConnections: "连接",
  formatSnapGrid: "吸附",
  fieldTitle: "标题",
  fieldContent: "内容",
  labelTitlePlaceholder: "标题",
  labelSubtitlePlaceholder: "副标题",
  labelCaptionPlaceholder: "说明",
  fieldBackground: "背景",
  fieldOpacity: "不透明度",
  fieldTextColor: "文本颜色",
  inspectorGroupAppearanceTitle: "外观",
};
