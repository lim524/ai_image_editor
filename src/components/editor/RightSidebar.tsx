"use client";

import type { RefObject } from "react";
import { LayerPanel } from "./LayerPanel";
import type { CanvasEditorHandle } from "./CanvasEditor";

interface RightSidebarProps {
  editorRef: RefObject<CanvasEditorHandle | null>;
}

export function RightSidebar({ editorRef }: RightSidebarProps) {
  return (
    <aside className="w-64 bg-neutral-950 border-l border-neutral-800 flex flex-col shrink-0 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-zinc-800 shrink-0">
        <h2 className="text-sm font-semibold text-zinc-200">레이어</h2>
        <p className="text-[10px] text-zinc-500 mt-0.5">순서·표시·잠금·삭제</p>
      </div>
      <LayerPanel editorRef={editorRef} className="flex-1 min-h-0" />
    </aside>
  );
}
