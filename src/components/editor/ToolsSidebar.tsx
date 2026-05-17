"use client";

import { useEditorStore, type Tool } from "@/stores/editorStore";
import { ToolIcon } from "./ToolIcons";

const TOOLS: { id: Tool; label: string; group: string }[] = [
  { id: "select", label: "\uC120\uD0DD", group: "\uAE30\uBCF8" },
  { id: "bubble-oval", label: "\uD0C0\uC6D0", group: "\uB9D0\uD48D\uC120" },
  { id: "bubble-round", label: "\uB458\uADFC", group: "\uB9D0\uD48D\uC120" },
  { id: "bubble-thought", label: "\uC0DD\uAC01", group: "\uB9D0\uD48D\uC120" },
  { id: "bubble-shout", label: "\uC678\uCE68", group: "\uB9D0\uD48D\uC120" },
  { id: "bubble-whisper", label: "\uC18D\uC0AD\uC784", group: "\uB9D0\uD48D\uC120" },
  { id: "text", label: "\uB300\uC0AC", group: "\uD14D\uC2A4\uD2B8" },
  { id: "sfx", label: "\uD6A8\uACFC\uC74C", group: "\uD14D\uC2A4\uD2B8" },
];

export function ToolsSidebar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const undoLabel = useEditorStore((s) => s.undoLabel);
  const redoLabel = useEditorStore((s) => s.redoLabel);

  const groups = [...new Set(TOOLS.map((t) => t.group))];

  return (
    <aside className="w-16 bg-neutral-950 border-r border-neutral-800 flex flex-col shrink-0 h-full">
      <div className="flex-1 overflow-y-auto py-2">
        {groups.map((group) => (
          <div key={group} className="mb-1">
            {TOOLS.filter((t) => t.group === group).map((tool) => (
              <button
                key={tool.id}
                type="button"
                title={tool.label}
                onClick={() => setActiveTool(tool.id)}
                className={`w-full flex flex-col items-center gap-1 py-2.5 transition-colors ${
                  activeTool === tool.id
                    ? "bg-white text-black"
                    : "text-neutral-500 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                <ToolIcon tool={tool.id} />
                <span className="text-[9px] leading-tight">{tool.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-800 p-1 space-y-1 shrink-0">
        <button
          type="button"
          disabled={!canUndo}
          title={undoLabel ? `\uC2E4\uD589 \uCDE8\uC18C: ${undoLabel}` : "\uC2E4\uD589 \uCDE8\uC18C"}
          onClick={() => window.dispatchEvent(new CustomEvent("editor:undo"))}
          className="w-full flex flex-col items-center gap-0.5 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 disabled:opacity-35"
        >
          <ToolIcon tool="undo" />
          <span className="text-[8px] truncate max-w-full px-0.5">
            {undoLabel ?? "\uCDE8\uC18C"}
          </span>
        </button>
        <button
          type="button"
          disabled={!canRedo}
          title={redoLabel ? `\uB2E4\uC2DC \uC2E4\uD589: ${redoLabel}` : "\uB2E4\uC2DC \uC2E4\uD589"}
          onClick={() => window.dispatchEvent(new CustomEvent("editor:redo"))}
          className="w-full flex flex-col items-center gap-0.5 py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 disabled:opacity-35"
        >
          <ToolIcon tool="redo" />
          <span className="text-[8px] truncate max-w-full px-0.5">
            {redoLabel ?? "\uB2E4\uC2DC"}
          </span>
        </button>
      </div>
    </aside>
  );
}
