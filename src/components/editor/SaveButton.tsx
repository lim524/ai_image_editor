"use client";

import { useCallback, useState } from "react";
import { useEditorStore } from "@/stores/editorStore";

interface SaveButtonProps {
  onSave: () => Promise<void>;
  disabled?: boolean;
}

export function SaveButton({ onSave, disabled }: SaveButtonProps) {
  const saveState = useEditorStore((s) => s.saveState);
  const [busy, setBusy] = useState(false);

  const handleSave = useCallback(async () => {
    if (disabled || busy) return;
    setBusy(true);
    try {
      await onSave();
    } catch (e) {
      console.error("Manual save failed:", e);
      useEditorStore.getState().setSaveState("error");
    } finally {
      setBusy(false);
    }
  }, [disabled, busy, onSave]);

  const isSaving = saveState === "saving" || busy;
  const isDirty = saveState === "dirty";

  return (
    <button
      type="button"
      onClick={() => void handleSave()}
      disabled={disabled || isSaving}
      title="저장 (Ctrl+S)"
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 ${
        isDirty
          ? "bg-violet-600 hover:bg-violet-500 text-white ring-1 ring-violet-400/50"
          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
      }`}
    >
      {isSaving ? "저장 중…" : "저장하기"}
    </button>
  );
}
