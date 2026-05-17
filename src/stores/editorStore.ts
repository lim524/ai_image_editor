import { create } from "zustand";
import type { FabricObject } from "fabric";
import type { Layer, Panel, ProjectFormat } from "@/lib/db/types";
import type {
  BubbleStyleSnapshot,
  TextStyleSnapshot,
} from "@/lib/fabric/properties";

export type Tool = "select" | "image" | "bubble" | "text";

export type SaveState = "saved" | "saving" | "dirty" | "error";

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
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
  selectedObjectType: SelectedObjectType;
  selectedObject: FabricObject | null;
  textStyle: TextStyleSnapshot | null;
  bubbleStyle: BubbleStyleSnapshot | null;
  propertiesTick: number;

  setProject: (id: string, format: ProjectFormat) => void;
  setEpisode: (id: string) => void;
  setPanel: (id: string | null) => void;
  setPanels: (panels: Panel[]) => void;
  setLayers: (layers: Layer[]) => void;
  setActiveTool: (tool: Tool) => void;
  setSaveState: (state: SaveState) => void;
  setUndoState: (
    canUndo: boolean,
    canRedo: boolean,
    undoLabel?: string | null,
    redoLabel?: string | null
  ) => void;
  setSelection: (
    type: SelectedObjectType,
    obj: FabricObject | null,
    textStyle: TextStyleSnapshot | null,
    bubbleStyle: BubbleStyleSnapshot | null
  ) => void;
  bumpProperties: () => void;
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
  canUndo: false,
  canRedo: false,
  undoLabel: null,
  redoLabel: null,
  selectedObjectType: "none",
  selectedObject: null,
  textStyle: null,
  bubbleStyle: null,
  propertiesTick: 0,

  setProject: (id, format) => set({ projectId: id, format }),
  setEpisode: (id) => set({ episodeId: id }),
  setPanel: (id) => set({ panelId: id }),
  setPanels: (panels) => set({ panels }),
  setLayers: (layers) => set({ layers }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setSaveState: (state) => set({ saveState: state }),
  setUndoState: (canUndo, canRedo, undoLabel = null, redoLabel = null) =>
    set({ canUndo, canRedo, undoLabel, redoLabel }),
  setSelection: (type, obj, textStyle, bubbleStyle) =>
    set({
      selectedObjectType: type,
      selectedObject: obj,
      textStyle,
      bubbleStyle,
      propertiesTick: Date.now(),
    }),
  bumpProperties: () => set({ propertiesTick: Date.now() }),
  reset: () =>
    set({
      projectId: null,
      episodeId: null,
      panelId: null,
      panels: [],
      layers: [],
      activeTool: "select",
      saveState: "saved",
      canUndo: false,
      canRedo: false,
      undoLabel: null,
      redoLabel: null,
      selectedObjectType: "none",
      selectedObject: null,
      textStyle: null,
      bubbleStyle: null,
      propertiesTick: 0,
    }),
}));
