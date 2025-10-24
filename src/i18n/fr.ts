/**
 * @file French translation dictionary for the node editor
 */
import type { I18nMessages } from "./types";

export const frMessages: I18nMessages = {
  // General UI
  loading: "Chargement...",
  error: "Erreur",
  success: "Succès",
  warning: "Avertissement",
  cancel: "Annuler",
  confirm: "Confirmer",
  save: "Enregistrer",
  delete: "Supprimer",
  edit: "Modifier",
  copy: "Copier",
  cut: "Couper",
  paste: "Coller",
  addConnection: "Ajouter une connexion…",
  untitled: "Sans titre",

  // Node Editor UI
  addNode: "Ajouter un nœud",
  deleteNode: "Supprimer le nœud",
  duplicateNode: "Dupliquer le nœud",
  groupNodes: "Grouper les nœuds",
  ungroupNodes: "Dégrouper les nœuds",
  selectAll: "Tout sélectionner",
  clearSelection: "Effacer la sélection",

  // Toolbar
  resetView: "Réinitialiser la vue",
  zoomIn: "Zoom avant",
  zoomOut: "Zoom arrière",
  autoLayout: "Agencement automatique",
  gridSnap: "Accrochage à la grille",
  gridSnapOn: "Accrochage à la grille : ACTIVÉ",
  gridSnapOff: "Accrochage à la grille : DÉSACTIVÉ",

  // Context Menu
  contextMenuAddNode: "Ajouter un nœud",
  contextMenuDeleteNode: "Supprimer le nœud",
  contextMenuDuplicateNode: "Dupliquer le nœud",
  contextMenuEditNode: "Modifier le nœud",
  contextMenuGroupSelected: "Grouper la sélection",
  contextMenuDeleteConnection: "Supprimer la connexion",
  contextMenuStyleInfo: "Définir le style : Info",
  contextMenuStyleSuccess: "Définir le style : Succès",
  contextMenuStyleWarning: "Définir le style : Avertissement",
  contextMenuStyleError: "Définir le style : Erreur",
  contextMenuExpandGroup: "Développer le groupe",
  contextMenuCollapseGroup: "Réduire le groupe",

  // Status Bar
  statusSelection: "Sélection :",
  statusTotal: "Total :",
  statusMode: "Mode :",
  statusZoom: "Zoom :",
  statusPosition: "Position :",
  statusGrid: "Grille :",
  statusNone: "Aucun",

  // Operation Modes
  modeReady: "Prêt",
  modeMoving: "Déplacement",
  modeConnecting: "Connexion",
  modeDisconnecting: "Déconnexion",
  modeSelecting: "Sélection",
  modePanning: "Panoramique",

  // Node Types
  nodeStandard: "Nœud standard",
  nodeGroup: "Nœud de groupe",
  nodeInput: "Nœud d'entrée",
  nodeOutput: "Nœud de sortie",

  // Inspector Panel
  inspectorTitle: "Inspecteur",
  inspectorNodeProperties: "Propriétés du nœud",
  inspectorConnectionProperties: "Propriétés de la connexion",
  inspectorPosition: "Position",
  inspectorSize: "Taille",
  inspectorData: "Données",
  inspectorVisible: "Visible",
  inspectorLocked: "Verrouillé",
  inspectorExpanded: "Développé",
  inspectorGridSettings: "Paramètres de la grille",
  inspectorShowGrid: "Afficher la grille",
  inspectorSnapToGrid: "Accrocher à la grille",
  inspectorGridSize: "Taille de la grille",
  inspectorSnapThreshold: "Seuil d'accrochage",
  inspectorGeneralSettings: "Paramètres généraux",
  inspectorAutoSave: "Activer l'enregistrement automatique",
  inspectorAutoSaveInterval: "Intervalle d'enregistrement automatique (secondes)",
  inspectorEmptyStatePrompt:
    "Sélectionnez un nœud ou une connexion pour afficher ses propriétés",
  inspectorMultipleSelection: "Sélection multiple",
  inspectorTabLayers: "Calques",
  inspectorLayersNodeCount: "{{count}} nœuds",
  inspectorTabProperties: "Propriétés",
  inspectorTabHistory: "Historique",
  inspectorTabSettings: "Paramètres",
  inspectorNodeLibrary: "Node Library",
  inspectorNodeLibrarySearchPlaceholder: "Search nodes…",
  inspectorNodeLibraryEmptyState: "No nodes match your search",
  inspectorNodeLibraryLimitReached: "Limit reached",
  inspectorActions: "Actions",
  inspectorInteractionHelpTitle: "Guide d'interaction",
  inspectorInteractionHelpSectionClipboard: "Presse-papiers et édition",
  inspectorInteractionHelpSectionSelection: "Sélection et disposition",
  inspectorInteractionHelpSectionHistory: "Historique et sauvegarde",
  inspectorInteractionHelpUnassigned: "Non attribué",

  // Auto Layout Panel
  autoLayoutPanelDescription:
    "Organisez automatiquement les nœuds à l'aide des préréglages intégrés.",
  autoLayoutPanelNodeCount: "{{count}} nœuds",
  autoLayoutPanelNoNodes: "Aucun nœud",
  autoLayoutPanelPrimaryAction: "Appliquer l'agencement automatique",
  autoLayoutPanelPrimaryHint:
    "L'agencement automatique utilise par défaut le mode hiérarchique.",
  autoLayoutPanelRun: "Appliquer",
  autoLayoutPanelGridTitle: "Agencement en grille",
  autoLayoutPanelGridDescription:
    "Placez les nœuds sur une grille régulière pour conserver l'espacement.",
  autoLayoutPanelForceTitle: "Agencement forcé",
  autoLayoutPanelForceDescription:
    "Utilisez une simulation physique pour regrouper les nœuds connectés.",

  // History Panel
  historyUndo: "Annuler",
  historyRedo: "Rétablir",
  historyEmpty: "Aucun historique pour le moment",
  historyTitle: "Historique",

  // Keyboard Shortcuts
  shortcutUndo: "Annuler (Ctrl+Z)",
  shortcutRedo: "Rétablir (Ctrl+Y)",
  shortcutSelectAll: "Tout sélectionner (Ctrl+A)",
  shortcutDelete: "Supprimer (Delete)",
  shortcutCopy: "Copier (Ctrl+C)",
  shortcutPaste: "Coller (Ctrl+V)",
  shortcutDuplicate: "Dupliquer (Ctrl+D)",
  shortcutGroup: "Grouper (Ctrl+G)",
  shortcutAutoLayout: "Agencement automatique (Ctrl+L)",
  shortcutSave: "Enregistrer (Ctrl+S)",

  // Validation Messages
  validationNodeTitle: "Le titre du nœud est requis",
  validationConnectionExists: "La connexion existe déjà",
  validationInvalidConnection: "Connexion invalide",
  validationCircularConnection: "Les connexions circulaires sont interdites",

  // Version Management
  versionSnapshot: "Instantané",
  versionCreated: "Créé",
  versionModified: "Modifié",
  versionAuthor: "Auteur",
  versionDescription: "Description",
  versionTags: "Étiquettes",

  // Layer Management
  layerVisible: "Visible",
  layerHidden: "Masqué",
  layerLocked: "Verrouillé",
  layerUnlocked: "Déverrouillé",
  layerToggleVisibility: "Basculer la visibilité",
  layerToggleLock: "Basculer le verrouillage",

  // Drag and Drop
  dragHint: "Glissez pour déplacer",
  dropHint: "Déposez ici",
  connectHint: "Glissez pour connecter",
  disconnectHint: "Glissez pour déconnecter",
  snapHint: "Accrochez à la grille",

  // Alignment Controls
  alignmentTitle: "Alignement",
  alignmentCountLabel: "{{count}} nœuds",
  alignmentSelectPrompt: "Sélectionnez au moins 2 nœuds",

  // Error Messages
  errorNodeNotFound: "Nœud introuvable",
  errorConnectionNotFound: "Connexion introuvable",
  errorInvalidAction: "Action invalide",
  errorSaveFailed: "Échec de l'enregistrement",
  errorLoadFailed: "Échec du chargement",
  errorExportFailed: "Échec de l'exportation",
  errorImportFailed: "Échec de l'importation",

  // Units and Formatting
  unitPixels: "px",
  unitPercent: "%",
  formatNodes: "nœuds",
  formatConnections: "connexions",
  formatSnapGrid: "accrochage",
  fieldTitle: "Titre",
  fieldContent: "Contenu",
  labelTitlePlaceholder: "Titre",
  labelSubtitlePlaceholder: "Sous-titre",
  labelCaptionPlaceholder: "Légende",
  fieldBackground: "Arrière-plan",
  fieldOpacity: "Opacité",
  fieldTextColor: "Couleur du texte",
  inspectorGroupAppearanceTitle: "Apparence",
};
