"use client";

import { useEditorStore, type Tool } from "@/stores/editorStore";
import { ToolIcon } from "./ToolIcons";

const TOOLS: { id: Tool; label: string }[] = [
  { id: "image", label: "이미지" },
  { id: "bubble", label: "말풍선" },
  { id: "text", label: "대사" },
];

interface ToolsSidebarProps {
  onPickImage: () => void;
}

export function ToolsSidebar({ onPickImage }: ToolsSidebarProps) {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);

  return (
    <aside className="w-20 bg-neutral-950 border-r border-neutral-800 flex flex-col shrink-0 h-full py-3 gap-1">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          type="button"
          title={tool.label}
          onClick={() => {
            if (tool.id === "image") {
              onPickImage();
              setActiveTool("select");
            } else {
              setActiveTool(tool.id);
            }
          }}
          className={`mx-2 flex flex-col items-center gap-1.5 py-3 rounded-lg transition-colors ${
            tool.id !== "image" && activeTool === tool.id
              ? "bg-white text-black"
              : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
          }`}
        >
          <ToolIcon tool={tool.id} />
          <span className="text-[10px] font-medium">{tool.label}</span>
        </button>
      ))}
    </aside>
  );
}
