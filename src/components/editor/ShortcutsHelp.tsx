"use client";

import { useState } from "react";
import { formatShortcutKeys } from "@/lib/shortcuts/parse";
import type { ShortcutDefinition } from "@/lib/shortcuts/types";

interface ShortcutsHelpProps {
  shortcuts: (ShortcutDefinition & { keys: string })[];
  onOpenSettings: () => void;
}

export function ShortcutsHelp({ shortcuts, onOpenSettings }: ShortcutsHelpProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
        title="단축키 안내"
      >
        단축키
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)} />
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-96 max-h-[80vh] overflow-y-auto shadow-2xl">
            <h3 className="font-semibold mb-1">단축키</h3>
            <p className="text-xs text-zinc-500 mb-4">설정에서 키를 변경할 수 있습니다.</p>
            <ul className="space-y-2 text-sm">
              {shortcuts.map((s) => (
                <li key={s.id} className="flex justify-between gap-4">
                  <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-violet-300 text-xs shrink-0">
                    {formatShortcutKeys(s.keys)}
                  </kbd>
                  <span className="text-zinc-400 text-right">{s.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenSettings();
                }}
                className="flex-1 py-2 text-sm rounded-lg border border-zinc-700 hover:border-violet-500"
              >
                단축키 설정
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-500"
              >
                닫기
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
