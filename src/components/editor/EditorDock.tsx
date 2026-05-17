"use client";

import { useEditorStore, type DockPanel } from "@/stores/editorStore";

const DOCK_ITEMS: { id: DockPanel; label: string }[] = [
  { id: "cuts", label: "\uCEF7" },
  { id: "tools", label: "\uB3C4\uAD6C" },
  { id: "layers", label: "\uB808\uC774\uC5B4" },
  { id: "properties", label: "\uC18D\uC131" },
];

export function EditorDock() {
  const dockOpen = useEditorStore((s) => s.dockOpen);
  const toggleDock = useEditorStore((s) => s.toggleDock);

  return (
    <div className="flex flex-col gap-1 py-2 px-1 bg-zinc-950 border-r border-zinc-800 shrink-0">
      {DOCK_ITEMS.map((item) => {
        const open = dockOpen[item.id];
        return (
          <button
            key={item.id}
            type="button"
            title={`${item.label} ${open ? "\uB2EB\uAE30" : "\uC5F4\uAE30"}`}
            onClick={() => toggleDock(item.id)}
            className={`writing-mode-vertical text-[10px] px-1.5 py-2 rounded-md transition-colors ${
              open
                ? "bg-violet-600 text-white"
                : "bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
            style={{ writingMode: "vertical-rl" }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
