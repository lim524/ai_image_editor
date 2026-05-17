"use client";

import { useEditorStore, type Tool } from "@/stores/editorStore";

const TOOLS: { id: Tool; label: string; group: string }[] = [
  { id: "select", label: "선택", group: "기본" },
  { id: "bubble-oval", label: "타원 말풍선", group: "말풍선" },
  { id: "bubble-round", label: "둥근 말풍선", group: "말풍선" },
  { id: "bubble-thought", label: "생각", group: "말풍선" },
  { id: "bubble-shout", label: "외침", group: "말풍선" },
  { id: "bubble-whisper", label: "속삭임", group: "말풍선" },
  { id: "text", label: "대사", group: "텍스트" },
  { id: "sfx", label: "효과음", group: "텍스트" },
];

export function Toolbar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);

  const groups = [...new Set(TOOLS.map((t) => t.group))];

  return (
    <aside className="w-52 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-3 border-b border-zinc-800 flex gap-1">
        <button
          type="button"
          disabled={!canUndo}
          onClick={() => window.dispatchEvent(new CustomEvent("editor:undo"))}
          className="flex-1 px-2 py-1.5 text-xs rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
        >
          ↩ 실행취소
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={() => window.dispatchEvent(new CustomEvent("editor:redo"))}
          className="flex-1 px-2 py-1.5 text-xs rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
        >
          ↪ 다시실행
        </button>
      </div>

      {groups.map((group) => (
        <div key={group} className="p-3 border-b border-zinc-800">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
            {group}
          </p>
          <div className="flex flex-col gap-1">
            {TOOLS.filter((t) => t.group === group).map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                className={`px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                  activeTool === tool.id
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
