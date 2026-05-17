"use client";

import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";
import type { CanvasEditorHandle } from "@/components/editor/CanvasEditor";
import { useEditorStore } from "@/stores/editorStore";
import { SHORTCUT_DEFINITIONS } from "./defaults";
import { chordsMatch, eventToChord, isTypingTarget, parseShortcutKeys } from "./parse";
import { loadShortcutBindings } from "./storage";
import {
  DOCK_FROM_SHORTCUT,
  TOOL_FROM_SHORTCUT,
  type ShortcutActionId,
} from "./types";

interface UseEditorShortcutsOptions {
  editorRef: RefObject<CanvasEditorHandle | null>;
  onSave: () => Promise<void>;
  enabled?: boolean;
}

export function useEditorShortcuts({
  editorRef,
  onSave,
  enabled = true,
}: UseEditorShortcutsOptions) {
  const [bindings, setBindings] = useState(loadShortcutBindings);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const reloadBindings = useCallback(() => {
    setBindings(loadShortcutBindings());
  }, []);

  const runAction = useCallback(
    (actionId: ShortcutActionId) => {
      const store = useEditorStore.getState();
      const canvas = editorRef.current?.getCanvas();

      switch (actionId) {
        case "undo":
          editorRef.current?.undo();
          break;
        case "redo":
          editorRef.current?.redo();
          break;
        case "save":
          void onSave();
          break;
        case "delete":
          editorRef.current?.deleteSelected();
          break;
        case "deselect":
          canvas?.discardActiveObject();
          canvas?.requestRenderAll();
          store.setSelection("none", null, null, null);
          break;
        case "duplicate":
          window.dispatchEvent(new CustomEvent("editor:duplicate"));
          break;
        case "layer.bring-forward":
          window.dispatchEvent(new CustomEvent("editor:layer-order", { detail: { dir: "up" } }));
          break;
        case "layer.send-backward":
          window.dispatchEvent(new CustomEvent("editor:layer-order", { detail: { dir: "down" } }));
          break;
        case "layer.bring-to-front":
          window.dispatchEvent(new CustomEvent("editor:layer-order", { detail: { dir: "front" } }));
          break;
        case "layer.send-to-back":
          window.dispatchEvent(new CustomEvent("editor:layer-order", { detail: { dir: "back" } }));
          break;
        case "assets.open":
          break;
        case "shortcuts.open":
          setSettingsOpen(true);
          break;
        default: {
          if (DOCK_FROM_SHORTCUT[actionId]) {
            break;
          }
          const tool = TOOL_FROM_SHORTCUT[actionId];
          if (tool) store.setActiveTool(tool);
        }
      }
    },
    [editorRef, onSave]
  );

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const chord = eventToChord(e);
      for (const binding of bindings) {
        const parsed = parseShortcutKeys(binding.keys);
        if (!parsed || !chordsMatch(chord, parsed)) continue;
        e.preventDefault();
        runAction(binding.actionId);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bindings, enabled, runAction]);

  useEffect(() => {
    const onReload = () => reloadBindings();
    window.addEventListener("shortcuts:updated", onReload);
    return () => window.removeEventListener("shortcuts:updated", onReload);
  }, [reloadBindings]);

  const shortcutsForHelp = SHORTCUT_DEFINITIONS.map((def) => {
    const binding = bindings.find((b) => b.actionId === def.id);
    return {
      ...def,
      keys: binding?.keys ?? def.defaultKeys,
    };
  });

  return {
    bindings,
    shortcutsForHelp,
    settingsOpen,
    setSettingsOpen,
    reloadBindings,
  };
}
