/**
 * @file Korean translation dictionary for the node editor
 */
import type { I18nMessages } from "../types";

export const koMessages: I18nMessages = {
  // General UI
  loading: "불러오는 중...",
  error: "오류",
  success: "성공",
  warning: "경고",
  cancel: "취소",
  confirm: "확인",
  save: "저장",
  delete: "삭제",
  edit: "편집",
  copy: "복사",
  cut: "잘라내기",
  paste: "붙여넣기",
  addConnection: "연결 추가…",
  untitled: "제목 없음",

  // Node Editor UI
  addNode: "노드 추가",
  deleteNode: "노드 삭제",
  duplicateNode: "노드 복제",
  groupNodes: "노드 그룹화",
  ungroupNodes: "그룹 해제",
  selectAll: "모두 선택",
  clearSelection: "선택 해제",

  // Toolbar
  resetView: "뷰 초기화",
  zoomIn: "확대",
  zoomOut: "축소",
  autoLayout: "자동 레이아웃",
  gridSnap: "그리드 스냅",
  gridSnapOn: "그리드 스냅: 켜짐",
  gridSnapOff: "그리드 스냅: 꺼짐",

  // Context Menu
  contextMenuAddNode: "노드 추가",
  contextMenuDeleteNode: "노드 삭제",
  contextMenuDuplicateNode: "노드 복제",
  contextMenuEditNode: "노드 편집",
  contextMenuGroupSelected: "선택 항목 그룹화",
  contextMenuDeleteConnection: "연결 삭제",
  contextMenuStyleInfo: "스타일 설정: 정보",
  contextMenuStyleSuccess: "스타일 설정: 성공",
  contextMenuStyleWarning: "스타일 설정: 경고",
  contextMenuStyleError: "스타일 설정: 오류",
  contextMenuExpandGroup: "그룹 확장",
  contextMenuCollapseGroup: "그룹 접기",

  // Status Bar
  statusSelection: "선택:",
  statusTotal: "총계:",
  statusMode: "모드:",
  statusZoom: "확대/축소:",
  statusPosition: "위치:",
  statusGrid: "그리드:",
  statusNone: "없음",

  // Operation Modes
  modeReady: "준비 완료",
  modeMoving: "이동 중",
  modeConnecting: "연결 중",
  modeDisconnecting: "연결 해제 중",
  modeSelecting: "선택 중",
  modePanning: "패닝 중",

  // Node Types
  nodeStandard: "표준 노드",
  nodeGroup: "그룹 노드",
  nodeInput: "입력 노드",
  nodeOutput: "출력 노드",

  // Inspector Panel
  inspectorTitle: "인스펙터",
  inspectorNodeProperties: "노드 속성",
  inspectorConnectionProperties: "연결 속성",
  inspectorPosition: "위치",
  inspectorSize: "크기",
  inspectorData: "데이터",
  inspectorVisible: "표시",
  inspectorLocked: "잠금",
  inspectorExpanded: "확장",
  inspectorGridSettings: "그리드 설정",
  inspectorShowGrid: "그리드 표시",
  inspectorSnapToGrid: "그리드에 맞추기",
  inspectorGridSize: "그리드 크기",
  inspectorSnapThreshold: "스냅 임계값",
  inspectorGeneralSettings: "일반 설정",
  inspectorAutoSave: "자동 저장 활성화",
  inspectorAutoSaveInterval: "자동 저장 간격(초)",
  inspectorEmptyStatePrompt: "노드 또는 연결을 선택하면 속성이 표시됩니다",
  inspectorMultipleSelection: "복수 선택",
  inspectorTabLayers: "레이어",
  inspectorLayersNodeCount: "{{count}}개 노드",
  inspectorTabProperties: "속성",
  inspectorTabHistory: "히스토리",
  inspectorTabSettings: "설정",
  inspectorNodeLibrary: "Node Library",
  inspectorNodeLibrarySearchPlaceholder: "Search nodes…",
  inspectorNodeLibraryEmptyState: "No nodes match your search",
  inspectorNodeLibraryLimitReached: "Limit reached",
  inspectorActions: "동작",
  inspectorInteractionHelpTitle: "상호작용 가이드",
  inspectorInteractionHelpSectionClipboard: "클립보드 및 편집",
  inspectorInteractionHelpSectionSelection: "선택 및 레이아웃",
  inspectorInteractionHelpSectionHistory: "기록 및 저장",
  inspectorInteractionHelpUnassigned: "미할당",

  // Auto Layout Panel
  autoLayoutPanelDescription:
    "내장 프리셋을 사용하여 노드를 자동으로 배치합니다.",
  autoLayoutPanelNodeCount: "{{count}}개 노드",
  autoLayoutPanelNoNodes: "노드가 없습니다",
  autoLayoutPanelPrimaryAction: "자동 레이아웃 적용",
  autoLayoutPanelPrimaryHint:
    "자동 레이아웃은 기본적으로 계층형 레이아웃을 사용합니다.",
  autoLayoutPanelRun: "적용",
  autoLayoutPanelGridTitle: "그리드 레이아웃",
  autoLayoutPanelGridDescription:
    "노드를 균일한 그리드에 배치하여 간격을 유지합니다.",
  autoLayoutPanelForceTitle: "힘 기반 레이아웃",
  autoLayoutPanelForceDescription:
    "물리 시뮬레이션으로 연결된 노드를 클러스터링합니다.",

  // History Panel
  historyUndo: "실행 취소",
  historyRedo: "다시 실행",
  historyEmpty: "기록이 아직 없습니다",
  historyTitle: "기록",

  // Keyboard Shortcuts
  shortcutUndo: "실행 취소 (Ctrl+Z)",
  shortcutRedo: "다시 실행 (Ctrl+Y)",
  shortcutSelectAll: "모두 선택 (Ctrl+A)",
  shortcutDelete: "삭제 (Delete)",
  shortcutCopy: "복사 (Ctrl+C)",
  shortcutPaste: "붙여넣기 (Ctrl+V)",
  shortcutDuplicate: "복제 (Ctrl+D)",
  shortcutGroup: "그룹화 (Ctrl+G)",
  shortcutAutoLayout: "자동 레이아웃 (Ctrl+L)",
  shortcutSave: "저장 (Ctrl+S)",

  // Validation Messages
  validationNodeTitle: "노드 제목은 필수입니다",
  validationConnectionExists: "연결이 이미 존재합니다",
  validationInvalidConnection: "유효하지 않은 연결입니다",
  validationCircularConnection: "순환 연결은 허용되지 않습니다",

  // Version Management
  versionSnapshot: "스냅샷",
  versionCreated: "생성",
  versionModified: "수정",
  versionAuthor: "작성자",
  versionDescription: "설명",
  versionTags: "태그",

  // Layer Management
  layerVisible: "표시",
  layerHidden: "숨김",
  layerLocked: "잠금",
  layerUnlocked: "잠금 해제",
  layerToggleVisibility: "표시 전환",
  layerToggleLock: "잠금 전환",

  // Drag and Drop
  dragHint: "드래그하여 이동",
  dropHint: "여기에 놓기",
  connectHint: "드래그하여 연결",
  disconnectHint: "드래그하여 연결 해제",
  snapHint: "그리드에 맞추기",

  // Alignment Controls
  alignmentTitle: "정렬",
  alignmentCountLabel: "{{count}}개 노드",
  alignmentSelectPrompt: "노드를 2개 이상 선택하세요",

  // Error Messages
  errorNodeNotFound: "노드를 찾을 수 없습니다",
  errorConnectionNotFound: "연결을 찾을 수 없습니다",
  errorInvalidAction: "잘못된 작업입니다",
  errorSaveFailed: "저장에 실패했습니다",
  errorLoadFailed: "불러오기에 실패했습니다",
  errorExportFailed: "내보내기에 실패했습니다",
  errorImportFailed: "가져오기에 실패했습니다",

  // Units and Formatting
  unitPixels: "px",
  unitPercent: "%",
  formatNodes: "노드",
  formatConnections: "연결",
  formatSnapGrid: "스냅",
  fieldTitle: "제목",
  fieldContent: "내용",
  labelTitlePlaceholder: "제목",
  labelSubtitlePlaceholder: "부제목",
  labelCaptionPlaceholder: "캡션",
  fieldBackground: "배경",
  fieldOpacity: "불투명도",
  fieldTextColor: "텍스트 색상",
  inspectorGroupAppearanceTitle: "모양",
};
