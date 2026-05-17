"use client";

import { useEffect, useState } from "react";
import { SHORTCUT_DEFINITIONS } from "@/lib/shortcuts/defaults";
import { formatShortcutKeys } from "@/lib/shortcuts/parse";
import {
  loadShortcutBindings,
  resetShortcutBindings,
  saveShortcutBindings,
} from "@/lib/shortcuts/storage";
import type { ShortcutActionId, ShortcutBinding } from "@/lib/shortcuts/types";

interface ShortcutSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutSettings({ open, onClose }: ShortcutSettingsProps) {
  const [bindings, setBindings] = useState<ShortcutBinding[]>([]);
  const [recordingId, setRecordingId] = useState<ShortcutActionId | null>(null);

  useEffect(() => {
    if (open) setBindings(loadShortcutBindings());
  }, [open]);

  useEffect(() => {
    if (!recordingId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setRecordingId(null);
        return;
      }
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("ctrl");
      if (e.shiftKey) parts.push("shift");
      if (e.altKey) parts.push("alt");
      const key = e.key.toLowerCase();
      if (!["control", "shift", "alt", "meta"].includes(key)) {
        parts.push(key === " " ? "space" : key);
      }
      const hasMainKey = parts.some(
        (p) => !["ctrl", "shift", "alt", "meta"].includes(p)
      );
      if (!hasMainKey) return;

      const keys = parts.join("+");
      setBindings((prev) =>
        prev.map((b) =>
          b.actionId === recordingId ? { ...b, keys } : b
        )
      );
      setRecordingId(null);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [recordingId]);

  const handleSave = () => {
    saveShortcutBindings(bindings);
    window.dispatchEvent(new CustomEvent("shortcuts:updated"));
    onClose();
  };

  const handleReset = () => {
    setBindings(resetShortcutBindings());
    window.dispatchEvent(new CustomEvent("shortcuts:updated"));
  };

  if (!open) return null;

  const categories = [...new Set(SHORTCUT_DEFINITIONS.map((d) => d.category))];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="px-5 py-4 border-b border-zinc-800 shrink-0">
          <h3 className="font-semibold text-zinc-100">
            {"\uB2E8\uCD95\uD0A4 \uC124\uC815"}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {"\uD0A4 \uC785\uB825 \uCE78\uC744 \uB20C\uB7EC \uC6D0\uD558\uB294 \uC870\uD569\uC744 \uB20C\uC138\uC694. Esc\uB85C \uCDE8\uC18C."}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {categories.map((cat) => (
            <section key={cat}>
              <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
                {cat}
              </h4>
              <ul className="space-y-1.5">
                {SHORTCUT_DEFINITIONS.filter((d) => d.category === cat).map(
                  (def) => {
                    const binding = bindings.find((b) => b.actionId === def.id);
                    const keys = binding?.keys ?? def.defaultKeys;
                    return (
                      <li
                        key={def.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="flex-1 text-zinc-300">{def.label}</span>
                        <button
                          type="button"
                          onClick={() => setRecordingId(def.id)}
                          className={`min-w-[7rem] px-2 py-1 rounded text-xs border ${
                            recordingId === def.id
                              ? "border-violet-500 bg-violet-950 text-violet-200 animate-pulse"
                              : "border-zinc-700 bg-zinc-800 text-violet-300 hover:border-zinc-600"
                          }`}
                        >
                          {recordingId === def.id
                            ? "\uD0A4 \uC785\uB825\u2026"
                            : formatShortcutKeys(keys)}
                        </button>
                      </li>
                    );
                  }
                )}
              </ul>
            </section>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-zinc-800 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-xs rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200"
          >
            {"\uAE30\uBCF8\uAC12"}
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700"
          >
            {"\uCDE8\uC18C"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs rounded-lg bg-violet-600 hover:bg-violet-500 font-medium"
          >
            {"\uC800\uC7A5"}
          </button>
        </div>
      </div>
    </>
  );
}
