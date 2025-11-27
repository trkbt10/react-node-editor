/**
 * @file Spanish translation dictionary for the node editor
 */
import type { I18nMessages } from "./types";

export const esMessages: I18nMessages = {
  // General UI
  loading: "Cargando...",
  error: "Error",
  success: "Éxito",
  warning: "Advertencia",
  cancel: "Cancelar",
  confirm: "Confirmar",
  save: "Guardar",
  delete: "Eliminar",
  edit: "Editar",
  copy: "Copiar",
  cut: "Cortar",
  paste: "Pegar",
  addConnection: "Agregar conexión…",
  untitled: "Sin título",

  // Node Editor UI
  addNode: "Agregar nodo",
  deleteNode: "Eliminar nodo",
  duplicateNode: "Duplicar nodo",
  groupNodes: "Agrupar nodos",
  ungroupNodes: "Desagrupar nodos",
  selectAll: "Seleccionar todo",
  clearSelection: "Limpiar selección",

  // Toolbar
  resetView: "Restablecer vista",
  zoomIn: "Acercar",
  zoomOut: "Alejar",
  autoLayout: "Distribución automática",
  gridSnap: "Ajuste a la cuadrícula",
  gridSnapOn: "Ajuste a la cuadrícula: ACTIVADO",
  gridSnapOff: "Ajuste a la cuadrícula: DESACTIVADO",

  // Context Menu
  contextMenuAddNode: "Agregar nodo",
  contextMenuDeleteNode: "Eliminar nodo",
  contextMenuDuplicateNode: "Duplicar nodo",
  contextMenuEditNode: "Editar nodo",
  contextMenuGroupSelected: "Agrupar selección",
  contextMenuDeleteConnection: "Eliminar conexión",
  contextMenuStyleInfo: "Establecer estilo: Información",
  contextMenuStyleSuccess: "Establecer estilo: Éxito",
  contextMenuStyleWarning: "Establecer estilo: Advertencia",
  contextMenuStyleError: "Establecer estilo: Error",
  contextMenuExpandGroup: "Expandir grupo",
  contextMenuCollapseGroup: "Contraer grupo",

  // Status Bar
  statusSelection: "Selección:",
  statusTotal: "Total:",
  statusMode: "Modo:",
  statusZoom: "Zoom:",
  statusPosition: "Posición:",
  statusGrid: "Cuadrícula:",
  statusNone: "Ninguno",

  // Operation Modes
  modeReady: "Listo",
  modeMoving: "Moviendo",
  modeConnecting: "Conectando",
  modeDisconnecting: "Desconectando",
  modeSelecting: "Seleccionando",
  modePanning: "Desplazando",

  // Node Types
  nodeStandard: "Nodo estándar",
  nodeGroup: "Nodo de grupo",
  nodeInput: "Nodo de entrada",
  nodeOutput: "Nodo de salida",

  // Inspector Panel
  inspectorTitle: "Inspector",
  inspectorNodeProperties: "Propiedades del nodo",
  inspectorConnectionProperties: "Propiedades de la conexión",
  inspectorPosition: "Posición",
  inspectorSize: "Tamaño",
  inspectorData: "Datos",
  inspectorVisible: "Visible",
  inspectorLocked: "Bloqueado",
  inspectorExpanded: "Expandido",
  inspectorGridSettings: "Configuración de la cuadrícula",
  inspectorShowGrid: "Mostrar cuadrícula",
  inspectorSnapToGrid: "Ajustar a la cuadrícula",
  inspectorGridSize: "Tamaño de la cuadrícula",
  inspectorSnapThreshold: "Umbral de ajuste",
  inspectorGeneralSettings: "Configuración general",
  inspectorAutoSave: "Habilitar guardado automático",
  inspectorAutoSaveInterval: "Intervalo de guardado automático (segundos)",
  inspectorEmptyStatePrompt: "Selecciona un nodo o conexión para ver sus propiedades",
  inspectorMultipleSelection: "Selección múltiple",
  inspectorTabLayers: "Capas",
  inspectorLayersNodeCount: "{{count}} nodos",
  inspectorTabProperties: "Propiedades",
  inspectorTabHistory: "Historial",
  inspectorTabSettings: "Configuración",
  inspectorNodeLibrary: "Node Library",
  inspectorNodeLibrarySearchPlaceholder: "Search nodes…",
  inspectorNodeLibraryEmptyState: "No nodes match your search",
  inspectorNodeLibraryLimitReached: "Limit reached",
  inspectorActions: "Acciones",
  inspectorInteractionHelpTitle: "Guía de interacción",
  inspectorInteractionHelpSectionClipboard: "Portapapeles y edición",
  inspectorInteractionHelpSectionSelection: "Selección y disposición",
  inspectorInteractionHelpSectionHistory: "Historial y guardado",
  inspectorInteractionHelpUnassigned: "Sin asignar",

  // Auto Layout Panel
  autoLayoutPanelDescription:
    "Organiza los nodos automáticamente usando las distribuciones predeterminadas.",
  autoLayoutPanelNodeCount: "{{count}} nodos",
  autoLayoutPanelNoNodes: "No hay nodos",
  autoLayoutPanelPrimaryAction: "Aplicar distribución automática",
  autoLayoutPanelPrimaryHint:
    "La distribución automática usa el diseño jerárquico por defecto.",
  autoLayoutPanelRun: "Aplicar",
  autoLayoutPanelGridTitle: "Distribución en cuadrícula",
  autoLayoutPanelGridDescription:
    "Coloca los nodos en una cuadrícula uniforme para mantener el espaciado.",
  autoLayoutPanelForceTitle: "Distribución de fuerzas",
  autoLayoutPanelForceDescription:
    "Usa una simulación física para agrupar nodos conectados.",

  // History Panel
  historyUndo: "Deshacer",
  historyRedo: "Rehacer",
  historyEmpty: "Aún no hay historial",
  historyTitle: "Historial",

  // Keyboard Shortcuts
  shortcutUndo: "Deshacer (Ctrl+Z)",
  shortcutRedo: "Rehacer (Ctrl+Y)",
  shortcutSelectAll: "Seleccionar todo (Ctrl+A)",
  shortcutDelete: "Eliminar (Delete)",
  shortcutCopy: "Copiar (Ctrl+C)",
  shortcutPaste: "Pegar (Ctrl+V)",
  shortcutDuplicate: "Duplicar (Ctrl+D)",
  shortcutGroup: "Agrupar (Ctrl+G)",
  shortcutAutoLayout: "Distribución automática (Ctrl+L)",
  shortcutSave: "Guardar (Ctrl+S)",

  // Validation Messages
  validationNodeTitle: "El título del nodo es obligatorio",
  validationConnectionExists: "La conexión ya existe",
  validationInvalidConnection: "Conexión no válida",
  validationCircularConnection: "No se permiten conexiones circulares",

  // Version Management
  versionSnapshot: "Instantánea",
  versionCreated: "Creado",
  versionModified: "Modificado",
  versionAuthor: "Autor",
  versionDescription: "Descripción",
  versionTags: "Etiquetas",

  // Layer Management
  layerVisible: "Visible",
  layerHidden: "Oculto",
  layerLocked: "Bloqueado",
  layerUnlocked: "Desbloqueado",
  layerToggleVisibility: "Alternar visibilidad",
  layerToggleLock: "Alternar bloqueo",

  // Drag and Drop
  dragHint: "Arrastra para mover",
  dropHint: "Suelta aquí",
  connectHint: "Arrastra para conectar",
  disconnectHint: "Arrastra para desconectar",
  snapHint: "Ajusta a la cuadrícula",

  // Alignment Controls
  alignmentTitle: "Alineación",
  alignmentCountLabel: "{{count}} nodos",
  alignmentSelectPrompt: "Selecciona 2 o más nodos",

  // Error Messages
  errorNodeNotFound: "Nodo no encontrado",
  errorConnectionNotFound: "Conexión no encontrada",
  errorInvalidAction: "Acción no válida",
  errorSaveFailed: "Error al guardar",
  errorLoadFailed: "Error al cargar",
  errorExportFailed: "Error al exportar",
  errorImportFailed: "Error al importar",

  // Units and Formatting
  unitPixels: "px",
  unitPercent: "%",
  formatNodes: "nodos",
  formatConnections: "conexiones",
  formatSnapGrid: "ajuste",
  fieldTitle: "Título",
  fieldContent: "Contenido",
  labelTitlePlaceholder: "Título",
  labelSubtitlePlaceholder: "Subtítulo",
  labelCaptionPlaceholder: "Leyenda",
  fieldBackground: "Fondo",
  fieldOpacity: "Opacidad",
  fieldTextColor: "Color del texto",
  inspectorGroupAppearanceTitle: "Apariencia",

  // Node Search Menu
  nodeSearchPlaceholder: "Buscar nodos…",
  nodeSearchAriaLabel: "Buscar nodos",
  nodeSearchHintNavigate: "Navegar",
  nodeSearchHintCreate: "Crear",
  nodeSearchHintCategory: "Categoría",
  nodeSearchHintClose: "Cerrar",
  nodeSearchFooter: "{{current}} de {{total}} • {{categories}} categorías",
  nodeSearchNoResults: 'No se encontraron nodos para "{{query}}"',
  nodeSearchCategoriesHeader: "Categorías",
  nodeSearchAllNodes: "Todos los nodos",
  nodeSearchEmptyCategory: "No hay nodos en esta categoría",
};
