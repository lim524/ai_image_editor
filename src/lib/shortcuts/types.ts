import type { DockPanel, Tool } from "@/stores/editorStore";

export type ShortcutActionId =
  | "undo"
  | "redo"
  | "save"
  | "delete"
  | "deselect"
  | "duplicate"
  | "tool.select"
  | "tool.text"
  | "tool.sfx"
  | "tool.bubble-oval"
  | "tool.bubble-round"
  | "tool.bubble-thought"
  | "tool.bubble-shout"
  | "tool.bubble-whisper"
  | "layer.bring-forward"
  | "layer.send-backward"
  | "layer.bring-to-front"
  | "layer.send-to-back"
  | "dock.cuts"
  | "dock.tools"
  | "dock.layers"
  | "dock.properties"
  | "assets.open"
  | "shortcuts.open";

export interface ShortcutDefinition {
  id: ShortcutActionId;
  label: string;
  defaultKeys: string;
  category: string;
}

export interface ShortcutBinding {
  actionId: ShortcutActionId;
  keys: string;
}

export const TOOL_FROM_SHORTCUT: Partial<Record<ShortcutActionId, Tool>> = {
  "tool.select": "select",
  "tool.text": "text",
  "tool.sfx": "sfx",
  "tool.bubble-oval": "bubble-oval",
  "tool.bubble-round": "bubble-round",
  "tool.bubble-thought": "bubble-thought",
  "tool.bubble-shout": "bubble-shout",
  "tool.bubble-whisper": "bubble-whisper",
};

export const DOCK_FROM_SHORTCUT: Partial<Record<ShortcutActionId, DockPanel>> = {
  "dock.cuts": "cuts",
  "dock.tools": "tools",
  "dock.layers": "layers",
  "dock.properties": "properties",
};
