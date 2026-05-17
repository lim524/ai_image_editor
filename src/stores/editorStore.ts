import { create } from "zustand";
import type { FabricObject } from "fabric";
import type { Layer, Panel, ProjectFormat } from "@/lib/db/types";
import type {
  BubbleStyleSnapshot,
  TextStyleSnapshot,
} from "@/lib/fabric/properties";

export type Tool =
  | "select"
  | "move"
  | "brush"
  | "eraser"
  | "crop"
  | "bubble-oval"
  | "bubble-round"
  | "bubble-thought"
  | "bubble-shout"
  | "bubble-whisper"
  | "text"
  | "sfx";

export type SaveState = "saved" | "saving" | "dirty" | "error";

export type DockPanel = "cuts" | "tools" | "layers" | "properties";

export type SelectedObjectType =
  | "none"
  | "text"
  | "sfx"
  | "bubble"
  | "image"
  | "mixed"
  | "other";

interface EditorState {
  projectId: string | null;
  episodeId: string | null;
  panelId: string | null;
  format: ProjectFormat;
  panels: Panel[];
  layers: Layer[];
  activeTool: Tool;
  saveState: SaveState;
  brightness: number;
  contrast: number;
  saturation: number;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
  showAssetLibrary: boolean;
  showVersionHistory: boolean;
  layoutMode: "edit" | "strip" | "page";
  selectedObjectType: SelectedObjectType;
  selectedObject: FabricObject | null;
  textStyle: TextStyleSnapshot | null;
  bubbleStyle: BubbleStyleSnapshot | null;
  propertiesTick: number;
  dockOpen: Record<DockPanel, boolean>;

  setProject: (id: string, format: ProjectFormat) => void;
  setEpisode: (id: string) => void;
  setPanel: (id: string | null) => void;
  setPanels: (panels: Panel[]) => void;
  setLayers: (layers: Layer[]) => void;
  setActiveTool: (tool: Tool) => void;
  setSaveState: (state: SaveState) => void;
  setAdjustments: (b: number, c: number, s: number) => void;
  setUndoState: (
    canUndo: boolean,
    canRedo: boolean,
    undoLabel?: string | null,
    redoLabel?: string | null
  ) => void;
  setShowAssetLibrary: (show: boolean) => void;
  setShowVersionHistory: (show: boolean) => void;
  setLayoutMode: (mode: "edit" | "strip" | "page") => void;
  setSelection: (
    type: SelectedObjectType,
    obj: FabricObject | null,
    textStyle: TextStyleSnapshot | null,
    bubbleStyle: BubbleStyleSnapshot | null
  ) => void;
  bumpProperties: () => void;
  toggleDock: (panel: DockPanel) => void;
  setDock: (panel: DockPanel, open: boolean) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  projectId: null,
  episodeId: null,
  panelId: null,
  format: "webtoon",
  panels: [],
  layers: [],
  activeTool: "select",
  saveState: "saved",
  brightness: 0,
  contrast: 0,
  saturation: 0,
  canUndo: false,
  canRedo: false,
  undoLabel: null,
  redoLabel: null,
  showAssetLibrary: false,
  showVersionHistory: false,
  layoutMode: "edit",
  selectedObjectType: "none",
  selectedObject: null,
  textStyle: null,
  bubbleStyle: null,
  propertiesTick: 0,
  dockOpen: {
    cuts: true,
    tools: true,
    layers: true,
    properties: true,
  },

  setProject: (id, format) => set({ projectId: id, format }),
  setEpisode: (id) => set({ episodeId: id }),
  setPanel: (id) => set({ panelId: id }),
  setPanels: (panels) => set({ panels }),
  setLayers: (layers) => set({ layers }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSaveState: (state) => set({ saveState: state }),
  setAdjustments: (brightness, contrast, saturation) =>
    set({ brightness, contrast, saturation }),
  setUndoState: (canUndo, canRedo, undoLabel = null, redoLabel = null) =>
    set({ canUndo, canRedo, undoLabel, redoLabel }),
  setShowAssetLibrary: (show) => set({ showAssetLibrary: show }),
  setShowVersionHistory: (show) => set({ showVersionHistory: show }),
  setLayoutMode: (mode) => set({ layoutMode: mode }),
  setSelection: (type, obj, textStyle, bubbleStyle) =>
    set({
      selectedObjectType: type,
      selectedObject: obj,
      textStyle,
      bubbleStyle,
      propertiesTick: Date.now(),
    }),
  bumpProperties: () => set({ propertiesTick: Date.now() }),
  toggleDock: (panel) =>
    set((s) => ({
      dockOpen: { ...s.dockOpen, [panel]: !s.dockOpen[panel] },
    })),
  setDock: (panel, open) =>
    set((s) => ({
      dockOpen: { ...s.dockOpen, [panel]: open },
    })),
  reset: () =>
    set({
      projectId: null,
      episodeId: null,
      panelId: null,
      panels: [],
      layers: [],
      activeTool: "select",
      saveState: "saved",
      brightness: 0,
      contrast: 0,
      saturation: 0,
      canUndo: false,
      canRedo: false,
      undoLabel: null,
      redoLabel: null,
      showAssetLibrary: false,
      showVersionHistory: false,
      layoutMode: "edit",
      selectedObjectType: "none",
      selectedObject: null,
      textStyle: null,
      bubbleStyle: null,
      propertiesTick: 0,
      dockOpen: {
        cuts: true,
        tools: true,
        layers: true,
        properties: true,
      },
    }),
}));
