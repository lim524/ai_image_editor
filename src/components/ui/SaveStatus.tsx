"use client";

import { useEffect } from "react";
import { onSaveStatusChange } from "@/lib/db/persistence";
import { useEditorStore, type SaveState } from "@/stores/editorStore";

const LABELS: Record<SaveState, string> = {
  saved: "저장됨",
  saving: "저장 중…",
  dirty: "변경됨",
  error: "저장 실패",
};

const COLORS: Record<SaveState, string> = {
  saved: "text-emerald-400",
  saving: "text-amber-400",
  dirty: "text-zinc-400",
  error: "text-red-400",
};

export function SaveStatus() {
  const saveState = useEditorStore((s) => s.saveState);
  const setSaveState = useEditorStore((s) => s.setSaveState);

  useEffect(() => {
    return onSaveStatusChange((status) => {
      setSaveState(status);
    });
  }, [setSaveState]);

  return (
    <span className={`text-xs font-medium ${COLORS[saveState]}`}>
      {LABELS[saveState]}
    </span>
  );
}
