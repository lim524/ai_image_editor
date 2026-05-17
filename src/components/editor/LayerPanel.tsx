"use client";

import type { RefObject } from "react";
import type { FabricObject } from "fabric";
import {
  getObjectType,
  readBubbleStyle,
  readTextStyle,
} from "@/lib/fabric/properties";
import { useEditorStore } from "@/stores/editorStore";
import type { CanvasEditorHandle } from "./CanvasEditor";

interface LayerPanelProps {
  editorRef: RefObject<CanvasEditorHandle | null>;
  className?: string;
}

export function LayerPanel({ editorRef, className = "" }: LayerPanelProps) {
  const propertiesTick = useEditorStore((s) => s.propertiesTick);

  const canvas = editorRef.current?.getCanvas();
  const record = editorRef.current?.recordAction;
  const objects = canvas ? [...canvas.getObjects()].reverse() : [];

  const selectObject = (obj: FabricObject) => {
    if (!canvas) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    const type = getObjectType(obj);
    useEditorStore.getState().setSelection(
      type,
      obj,
      type === "text" || type === "sfx" ? readTextStyle(obj) : null,
      type === "bubble" ? readBubbleStyle(obj) : null
    );
  };

  const withRecord = (label: string, fn: () => void) => {
    if (record) record(label, fn);
    else {
      fn();
      window.dispatchEvent(new CustomEvent("editor:persist"));
    }
    useEditorStore.getState().bumpProperties();
  };

  const moveLayer = (obj: FabricObject, dir: "up" | "down") => {
    if (!canvas) return;
    withRecord(dir === "up" ? "레이어 위로" : "레이어 아래로", () => {
      if (dir === "up") canvas.bringObjectForward(obj);
      else canvas.sendObjectBackwards(obj);
      canvas.requestRenderAll();
    });
  };

  const toggleVisible = (obj: FabricObject) => {
    withRecord(obj.visible === false ? "레이어 표시" : "레이어 숨김", () => {
      obj.set("visible", !obj.visible);
      canvas?.requestRenderAll();
    });
  };

  const toggleLock = (obj: FabricObject) => {
    withRecord(obj.selectable ? "레이어 잠금" : "레이어 잠금 해제", () => {
      const next = !obj.selectable;
      obj.set({ selectable: next, evented: next });
      canvas?.requestRenderAll();
    });
  };

  const removeObject = (obj: FabricObject) => {
    if (!canvas) return;
    withRecord("레이어 삭제", () => {
      canvas.remove(obj);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      useEditorStore.getState().setSelection("none", null, null, null);
    });
  };

  const labelFor = (obj: FabricObject, index: number) => {
    const data = (obj as FabricObject & { data?: { layerType?: string } }).data;
    const t = data?.layerType ?? obj.type;
    if (t === "image") return `이미지 ${index + 1}`;
    if (t === "bubble") return `말풍선 ${index + 1}`;
    if (t === "sfx") return `효과음 ${index + 1}`;
    if (t === "text") return `대사 ${index + 1}`;
    return `레이어 ${index + 1}`;
  };

  return (
    <div className={`overflow-y-auto p-2 ${className}`} key={propertiesTick}>
      {objects.length === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-6">레이어 없음</p>
      ) : (
        <ul className="space-y-1">
          {objects.map((obj, i) => (
            <li
              key={i}
              className="flex items-center gap-1 p-2 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 text-xs group"
            >
              <button
                type="button"
                onClick={() => selectObject(obj)}
                className="flex-1 text-left truncate text-zinc-300"
              >
                {labelFor(obj, objects.length - 1 - i)}
              </button>
              <button
                type="button"
                title={obj.visible === false ? "표시" : "숨기기"}
                onClick={() => toggleVisible(obj)}
                className="px-1 text-zinc-500 hover:text-zinc-200 opacity-70 group-hover:opacity-100"
              >
                {obj.visible === false ? "○" : "●"}
              </button>
              <button
                type="button"
                title={obj.selectable ? "잠금" : "잠금 해제"}
                onClick={() => toggleLock(obj)}
                className="px-1 text-zinc-500 hover:text-zinc-200 opacity-70 group-hover:opacity-100"
              >
                {obj.selectable ? "🔓" : "🔒"}
              </button>
              <button
                type="button"
                title="위로"
                onClick={() => moveLayer(obj, "up")}
                className="px-1 text-zinc-500 hover:text-zinc-200"
              >
                ↑
              </button>
              <button
                type="button"
                title="아래로"
                onClick={() => moveLayer(obj, "down")}
                className="px-1 text-zinc-500 hover:text-zinc-200"
              >
                ↓
              </button>
              <button
                type="button"
                title="삭제"
                onClick={() => removeObject(obj)}
                className="px-1 text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
