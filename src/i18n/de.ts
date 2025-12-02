/**
 * @file German translation dictionary for the node editor
 */
import type { I18nMessages } from "./types";

export const deMessages: I18nMessages = {
  // General UI
  loading: "Wird geladen...",
  error: "Fehler",
  success: "Erfolg",
  warning: "Warnung",
  cancel: "Abbrechen",
  confirm: "Bestätigen",
  save: "Speichern",
  delete: "Löschen",
  edit: "Bearbeiten",
  copy: "Kopieren",
  cut: "Ausschneiden",
  paste: "Einfügen",
  addConnection: "Verbindung hinzufügen…",
  untitled: "Ohne Titel",

  // Node Editor UI
  addNode: "Knoten hinzufügen",
  deleteNode: "Knoten löschen",
  duplicateNode: "Knoten duplizieren",
  groupNodes: "Knoten gruppieren",
  ungroupNodes: "Gruppierung aufheben",
  selectAll: "Alles auswählen",
  clearSelection: "Auswahl aufheben",

  // Toolbar
  resetView: "Ansicht zurücksetzen",
  zoomIn: "Vergrößern",
  zoomOut: "Verkleinern",
  autoLayout: "Automatisches Layout",
  gridSnap: "Rasterfang",
  gridSnapOn: "Rasterfang: AKTIV",
  gridSnapOff: "Rasterfang: INAKTIV",

  // Context Menu
  contextMenuAddNode: "Knoten hinzufügen",
  contextMenuDeleteNode: "Knoten löschen",
  contextMenuDuplicateNode: "Knoten duplizieren",
  contextMenuEditNode: "Knoten bearbeiten",
  contextMenuGroupSelected: "Auswahl gruppieren",
  contextMenuDeleteConnection: "Verbindung löschen",
  contextMenuStyleInfo: "Stil setzen: Info",
  contextMenuStyleSuccess: "Stil setzen: Erfolg",
  contextMenuStyleWarning: "Stil setzen: Warnung",
  contextMenuStyleError: "Stil setzen: Fehler",
  contextMenuExpandGroup: "Gruppe erweitern",
  contextMenuCollapseGroup: "Gruppe reduzieren",

  // Status Bar
  statusSelection: "Auswahl:",
  statusTotal: "Gesamt:",
  statusMode: "Modus:",
  statusZoom: "Zoom:",
  statusPosition: "Position:",
  statusGrid: "Raster:",
  statusNone: "Keine",

  // Operation Modes
  modeReady: "Bereit",
  modeMoving: "Bewegen",
  modeConnecting: "Verbinden",
  modeDisconnecting: "Trennen",
  modeSelecting: "Auswählen",
  modePanning: "Schwenken",

  // Node Types
  nodeStandard: "Standardknoten",
  nodeGroup: "Gruppenknoten",
  nodeInput: "Eingangsknoten",
  nodeOutput: "Ausgangsknoten",

  // Inspector Panel
  inspectorTitle: "Inspektor",
  inspectorNodeProperties: "Knoteneigenschaften",
  inspectorConnectionProperties: "Verbindungseigenschaften",
  connectionFrom: "Von",
  connectionTo: "Nach",
  inspectorPosition: "Position",
  inspectorSize: "Größe",
  inspectorData: "Daten",
  inspectorVisible: "Sichtbar",
  inspectorLocked: "Gesperrt",
  inspectorLock: "Sperren",
  inspectorUnlock: "Entsperren",
  inspectorShow: "Anzeigen",
  inspectorHide: "Ausblenden",
  inspectorExpanded: "Ausgeklappt",
  inspectorGridSettings: "Rastereinstellungen",
  inspectorShowGrid: "Raster anzeigen",
  inspectorSnapToGrid: "Am Raster ausrichten",
  inspectorGridSize: "Rastergröße",
  inspectorSnapThreshold: "Fangschwelle",
  inspectorGeneralSettings: "Allgemeine Einstellungen",
  inspectorAutoSave: "Automatisches Speichern aktivieren",
  inspectorAutoSaveInterval: "Intervall für Autospeichern (Sekunden)",
  inspectorEmptyStatePrompt:
    "Wähle einen Knoten oder eine Verbindung, um die Eigenschaften anzuzeigen",
  inspectorMultipleSelection: "Mehrfachauswahl",
  inspectorTabLayers: "Ebenen",
  inspectorLayersNodeCount: "{{count}} Knoten",
  inspectorTabProperties: "Eigenschaften",
  inspectorTabHistory: "Verlauf",
  inspectorTabSettings: "Einstellungen",
  inspectorNodeLibrary: "Node Library",
  inspectorNodeLibrarySearchPlaceholder: "Search nodes…",
  inspectorNodeLibraryEmptyState: "No nodes match your search",
  inspectorNodeLibraryLimitReached: "Limit reached",
  inspectorActions: "Aktionen",
  inspectorInteractionHelpTitle: "Interaktionsleitfaden",
  inspectorInteractionHelpSectionClipboard: "Zwischenablage und Bearbeitung",
  inspectorInteractionHelpSectionSelection: "Auswahl und Layout",
  inspectorInteractionHelpSectionHistory: "Verlauf und Speichern",
  inspectorInteractionHelpUnassigned: "Nicht zugewiesen",

  // Auto Layout Panel
  autoLayoutPanelDescription:
    "Ordne die Knoten automatisch mit den integrierten Layouts an.",
  autoLayoutPanelNodeCount: "{{count}} Knoten",
  autoLayoutPanelNoNodes: "Keine Knoten",
  autoLayoutPanelPrimaryAction: "Automatisches Layout anwenden",
  autoLayoutPanelPrimaryHint:
    "Das automatische Layout verwendet standardmäßig das hierarchische Layout.",
  autoLayoutPanelRun: "Anwenden",
  autoLayoutPanelGridTitle: "Rasterlayout",
  autoLayoutPanelGridDescription:
    "Platziere die Knoten in einem gleichmäßigen Raster, um Abstände zu wahren.",
  autoLayoutPanelForceTitle: "Kraftgesteuertes Layout",
  autoLayoutPanelForceDescription:
    "Nutze eine Physiksimulation, um verbundene Knoten zu gruppieren.",

  // History Panel
  historyUndo: "Rückgängig",
  historyRedo: "Wiederholen",
  historyEmpty: "Noch kein Verlauf",
  historyTitle: "Verlauf",

  // Keyboard Shortcuts
  shortcutUndo: "Rückgängig (Ctrl+Z)",
  shortcutRedo: "Wiederholen (Ctrl+Y)",
  shortcutSelectAll: "Alles auswählen (Ctrl+A)",
  shortcutDelete: "Löschen (Delete)",
  shortcutCopy: "Kopieren (Ctrl+C)",
  shortcutPaste: "Einfügen (Ctrl+V)",
  shortcutDuplicate: "Duplizieren (Ctrl+D)",
  shortcutGroup: "Gruppieren (Ctrl+G)",
  shortcutAutoLayout: "Automatisches Layout (Ctrl+L)",
  shortcutSave: "Speichern (Ctrl+S)",

  // Validation Messages
  validationNodeTitle: "Ein Knotentitel ist erforderlich",
  validationConnectionExists: "Verbindung existiert bereits",
  validationInvalidConnection: "Ungültige Verbindung",
  validationCircularConnection: "Zyklische Verbindungen sind nicht erlaubt",

  // Version Management
  versionSnapshot: "Schnappschuss",
  versionCreated: "Erstellt",
  versionModified: "Geändert",
  versionAuthor: "Autor",
  versionDescription: "Beschreibung",
  versionTags: "Tags",

  // Layer Management
  layerVisible: "Sichtbar",
  layerHidden: "Ausgeblendet",
  layerLocked: "Gesperrt",
  layerUnlocked: "Entsperrt",
  layerToggleVisibility: "Sichtbarkeit umschalten",
  layerToggleLock: "Sperre umschalten",

  // Drag and Drop
  dragHint: "Zum Verschieben ziehen",
  dropHint: "Hier ablegen",
  connectHint: "Zum Verbinden ziehen",
  disconnectHint: "Zum Trennen ziehen",
  snapHint: "Am Raster ausrichten",

  // Alignment Controls
  alignmentTitle: "Ausrichtung",
  alignmentCountLabel: "{{count}} Knoten",
  alignmentSelectPrompt: "Mindestens 2 Knoten auswählen",

  // Error Messages
  errorNodeNotFound: "Knoten nicht gefunden",
  errorConnectionNotFound: "Verbindung nicht gefunden",
  errorInvalidAction: "Ungültige Aktion",
  errorSaveFailed: "Speichern fehlgeschlagen",
  errorLoadFailed: "Laden fehlgeschlagen",
  errorExportFailed: "Export fehlgeschlagen",
  errorImportFailed: "Import fehlgeschlagen",

  // Units and Formatting
  unitPixels: "px",
  unitPercent: "%",
  formatNodes: "Knoten",
  formatConnections: "Verbindungen",
  formatSnapGrid: "Rasterfang",
  fieldTitle: "Titel",
  fieldContent: "Inhalt",
  labelTitlePlaceholder: "Titel",
  labelSubtitlePlaceholder: "Untertitel",
  labelCaptionPlaceholder: "Beschriftung",
  fieldBackground: "Hintergrund",
  fieldOpacity: "Deckkraft",
  fieldTextColor: "Textfarbe",
  inspectorGroupAppearanceTitle: "Erscheinungsbild",

  // Node Search Menu
  nodeSearchPlaceholder: "Knoten suchen…",
  nodeSearchAriaLabel: "Knoten suchen",
  nodeSearchHintNavigate: "Navigieren",
  nodeSearchHintCreate: "Erstellen",
  nodeSearchHintCategory: "Kategorie",
  nodeSearchHintClose: "Schließen",
  nodeSearchFooter: "{{current}} von {{total}} • {{categories}} Kategorien",
  nodeSearchNoResults: 'Keine Knoten für "{{query}}" gefunden',
  nodeSearchCategoriesHeader: "Kategorien",
  nodeSearchAllNodes: "Alle Knoten",
  nodeSearchEmptyCategory: "Keine Knoten in dieser Kategorie",
};
