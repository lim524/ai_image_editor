"use client";

import type { RefObject } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useEffect, useState } from "react";
import type { FontPreset } from "@/lib/fonts/presets";
import { FONT_PRESETS } from "@/lib/fonts/presets";
import { getAllFontPresets } from "@/lib/fonts/user-fonts";
import {
  applyBubbleStyle,
  applyImageFlipX,
  applyImageOpacity,
  applyTextStyle,
  readBubbleStyle,
  readTextStyle,
} from "@/lib/fabric/properties";
import { applyCanvasFilters } from "@/lib/fabric/canvas-utils";
import type { CanvasEditorHandle } from "./CanvasEditor";

interface ContextPropertiesBarProps {
  editorRef: RefObject<CanvasEditorHandle | null>;
}

export function ContextPropertiesBar({ editorRef }: ContextPropertiesBarProps) {
  const selectedObjectType = useEditorStore((s) => s.selectedObjectType);
  const selectedObject = useEditorStore((s) => s.selectedObject);
  const textStyle = useEditorStore((s) => s.textStyle);
  const bubbleStyle = useEditorStore((s) => s.bubbleStyle);
  const brightness = useEditorStore((s) => s.brightness);
  const contrast = useEditorStore((s) => s.contrast);
  const saturation = useEditorStore((s) => s.saturation);
  const setAdjustments = useEditorStore((s) => s.setAdjustments);
  const propertiesTick = useEditorStore((s) => s.propertiesTick);
  const [fontPresets, setFontPresets] = useState<FontPreset[]>(FONT_PRESETS);

  useEffect(() => {
    void getAllFontPresets().then(setFontPresets);
    const onFonts = () => void getAllFontPresets().then(setFontPresets);
    window.addEventListener("fonts:updated", onFonts);
    return () => window.removeEventListener("fonts:updated", onFonts);
  }, []);

  const canvas = editorRef.current?.getCanvas();
  const record = editorRef.current?.recordAction;

  const patchText = (label: string, patch: Parameters<typeof applyTextStyle>[1]) => {
    if (!canvas || !selectedObject || !record) return;
    record(label, () => {
      applyTextStyle(selectedObject, patch, canvas);
      useEditorStore.getState().setSelection(
        selectedObjectType,
        selectedObject,
        readTextStyle(selectedObject),
        bubbleStyle
      );
    });
  };

  const patchBubble = (label: string, patch: Parameters<typeof applyBubbleStyle>[1]) => {
    if (!canvas || !selectedObject || !record) return;
    record(label, () => {
      applyBubbleStyle(selectedObject, patch, canvas);
      useEditorStore.getState().setSelection(
        selectedObjectType,
        selectedObject,
        textStyle,
        readBubbleStyle(selectedObject)
      );
    });
  };

  const patchImageAdjust = (label: string, b: number, c: number, s: number) => {
    if (!record) return;
    record(label, () => {
      setAdjustments(b, c, s);
      if (canvas) applyCanvasFilters(canvas, b, c, s);
    });
  };

  if (selectedObjectType === "none") {
    return (
      <div className="flex-1 flex items-center px-3 min-w-0">
        <span className="text-xs text-zinc-500 truncate">
          {"\uAC1D\uCCB4\uB97C \uC120\uD0DD\uD558\uBA74 \uAE00\uAD8C\uB7EC \uB4F1\uC744 \uD3B8\uC9D1\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4"}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex items-center gap-3 px-3 overflow-x-auto min-w-0"
      key={propertiesTick}
    >
      <span className="text-[10px] uppercase tracking-wider text-zinc-500 shrink-0 pr-1">
        {selectedObjectType === "text"
          ? "대사"
          : selectedObjectType === "sfx"
            ? "효과음"
            : selectedObjectType === "bubble"
              ? "말풍선"
              : "이미지"}
      </span>

      {(selectedObjectType === "text" || selectedObjectType === "sfx") && textStyle && (
        <>
          <label className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-zinc-500">글꼴</span>
            <select
              value={
                fontPresets.find((f) => textStyle.fontFamily.includes(f.family.split(",")[0].replace(/'/g, "")))
                  ?.id ??
                fontPresets.find((f) => f.family === textStyle.fontFamily)?.id ??
                "noto"
              }
              onChange={(e) => {
                const preset = fontPresets.find((f) => f.id === e.target.value);
                if (preset) patchText("\uAE00\uAD8C \uBCC0\uACBD", { fontFamily: preset.family });
              }}
              className="prop-input-compact"
            >
              {fontPresets.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 shrink-0 min-w-[120px]">
            <span className="text-[10px] text-zinc-500">크기 {textStyle.fontSize}</span>
            <input
              type="range"
              min={8}
              max={120}
              value={textStyle.fontSize}
              onChange={(e) => patchText("글자 크기", { fontSize: +e.target.value })}
              className="w-20"
            />
          </label>
          <ToggleBtn
            active={textStyle.fontWeight === "bold"}
            onClick={() =>
              patchText("굵게", {
                fontWeight: textStyle.fontWeight === "bold" ? "normal" : "bold",
              })
            }
          >
            B
          </ToggleBtn>
          <ToggleBtn
            active={textStyle.fontStyle === "italic"}
            onClick={() =>
              patchText("기울임", {
                fontStyle: textStyle.fontStyle === "italic" ? "normal" : "italic",
              })
            }
          >
            I
          </ToggleBtn>
          <label className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-zinc-500">색</span>
            <input
              type="color"
              value={textStyle.fill.startsWith("#") ? textStyle.fill : "#000000"}
              onChange={(e) => patchText("글자색", { fill: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border border-zinc-700"
            />
          </label>
          <select
            value={textStyle.textAlign}
            onChange={(e) =>
              patchText("정렬", {
                textAlign: e.target.value as "left" | "center" | "right",
              })
            }
            className="prop-input-compact"
          >
            <option value="left">왼쪽</option>
            <option value="center">가운데</option>
            <option value="right">오른쪽</option>
          </select>
        </>
      )}

      {selectedObjectType === "bubble" && bubbleStyle && (
        <>
          <label className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-zinc-500">채움</span>
            <input
              type="color"
              value={bubbleStyle.fill}
              onChange={(e) => patchBubble("말풍선 채움", { fill: e.target.value })}
              className="w-7 h-7 rounded border border-zinc-700"
            />
          </label>
          <label className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-zinc-500">테두리</span>
            <input
              type="color"
              value={bubbleStyle.stroke}
              onChange={(e) => patchBubble("말풍선 테두리", { stroke: e.target.value })}
              className="w-7 h-7 rounded border border-zinc-700"
            />
          </label>
          <label className="flex items-center gap-1.5 shrink-0 min-w-[100px]">
            <span className="text-[10px] text-zinc-500">두께</span>
            <input
              type="range"
              min={0}
              max={8}
              value={bubbleStyle.strokeWidth}
              onChange={(e) =>
                patchBubble("테두리 두께", { strokeWidth: +e.target.value })
              }
              className="w-16"
            />
          </label>
        </>
      )}

      {selectedObjectType === "image" && selectedObject && (
        <>
          <label className="flex items-center gap-1.5 shrink-0 min-w-[100px]">
            <span className="text-[10px] text-zinc-500">불투명</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={selectedObject.opacity ?? 1}
              onChange={(e) => {
                if (!canvas || !record) return;
                const v = +e.target.value;
                record("불투명도", () =>
                  applyImageOpacity(selectedObject, v, canvas)
                );
              }}
              className="w-16"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              if (!canvas || !record) return;
              record("좌우 반전", () =>
                applyImageFlipX(selectedObject, !selectedObject.flipX, canvas)
              );
            }}
            className="text-xs px-2 py-1 rounded border border-zinc-700 hover:border-violet-500 shrink-0"
          >
            반전
          </button>
          <label className="flex items-center gap-1 shrink-0 min-w-[90px]">
            <span className="text-[10px] text-zinc-500">밝기</span>
            <input
              type="range"
              min={-100}
              max={100}
              value={brightness}
              onChange={(e) =>
                patchImageAdjust("밝기", +e.target.value, contrast, saturation)
              }
              className="w-14"
            />
          </label>
          <label className="flex items-center gap-1 shrink-0 min-w-[90px]">
            <span className="text-[10px] text-zinc-500">대비</span>
            <input
              type="range"
              min={-100}
              max={100}
              value={contrast}
              onChange={(e) =>
                patchImageAdjust("대비", brightness, +e.target.value, saturation)
              }
              className="w-14"
            />
          </label>
          <label className="flex items-center gap-1 shrink-0 min-w-[90px]">
            <span className="text-[10px] text-zinc-500">채도</span>
            <input
              type="range"
              min={-100}
              max={100}
              value={saturation}
              onChange={(e) =>
                patchImageAdjust("채도", brightness, contrast, +e.target.value)
              }
              className="w-14"
            />
          </label>
        </>
      )}
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-7 h-7 text-xs font-bold rounded border shrink-0 ${
        active ? "border-violet-500 bg-violet-950 text-violet-200" : "border-zinc-700 text-zinc-400"
      }`}
    >
      {children}
    </button>
  );
}
