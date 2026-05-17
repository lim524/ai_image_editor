"use client";

import type { RefObject } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { FONT_PRESETS } from "@/lib/fonts/presets";
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
import { LayerPanel } from "./LayerPanel";

interface PropertiesPanelProps {
  editorRef: RefObject<CanvasEditorHandle | null>;
}

function persist() {
  window.dispatchEvent(new CustomEvent("editor:persist"));
}

export function PropertiesPanel({ editorRef }: PropertiesPanelProps) {
  const selectedObjectType = useEditorStore((s) => s.selectedObjectType);
  const selectedObject = useEditorStore((s) => s.selectedObject);
  const textStyle = useEditorStore((s) => s.textStyle);
  const bubbleStyle = useEditorStore((s) => s.bubbleStyle);
  const brightness = useEditorStore((s) => s.brightness);
  const contrast = useEditorStore((s) => s.contrast);
  const saturation = useEditorStore((s) => s.saturation);
  const setAdjustments = useEditorStore((s) => s.setAdjustments);
  const propertiesTick = useEditorStore((s) => s.propertiesTick);

  const canvas = editorRef.current?.getCanvas();

  const patchText = (patch: Parameters<typeof applyTextStyle>[1]) => {
    if (!canvas || !selectedObject) return;
    applyTextStyle(selectedObject, patch, canvas);
    useEditorStore
      .getState()
      .setSelection(
        selectedObjectType,
        selectedObject,
        readTextStyle(selectedObject),
        bubbleStyle
      );
    persist();
  };

  const patchBubble = (patch: Parameters<typeof applyBubbleStyle>[1]) => {
    if (!canvas || !selectedObject) return;
    applyBubbleStyle(selectedObject, patch, canvas);
    useEditorStore
      .getState()
      .setSelection(
        selectedObjectType,
        selectedObject,
        textStyle,
        readBubbleStyle(selectedObject)
      );
    persist();
  };

  const patchImageAdjust = (b: number, c: number, s: number) => {
    setAdjustments(b, c, s);
    if (canvas) applyCanvasFilters(canvas, b, c, s);
    persist();
  };

  return (
    <aside className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col shrink-0 overflow-hidden">
      <div className="p-3 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-200">속성</h2>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          {selectedObjectType === "none"
            ? "객체를 선택하세요"
            : selectedObjectType === "text"
              ? "대사 텍스트"
              : selectedObjectType === "sfx"
                ? "효과음"
                : selectedObjectType === "bubble"
                  ? "말풍선"
                  : selectedObjectType === "image"
                    ? "이미지"
                    : "객체"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4" key={propertiesTick}>
        {(selectedObjectType === "text" || selectedObjectType === "sfx") &&
          textStyle && (
            <section className="space-y-3">
              <Field label="글꼴">
                <select
                  value={
                    FONT_PRESETS.find((f) => f.family === textStyle.fontFamily)
                      ?.id ?? "noto"
                  }
                  onChange={(e) => {
                    const preset = FONT_PRESETS.find((f) => f.id === e.target.value);
                    if (preset) patchText({ fontFamily: preset.family });
                  }}
                  className="prop-input"
                >
                  {FONT_PRESETS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`크기 ${textStyle.fontSize}`}>
                <input
                  type="range"
                  min={8}
                  max={120}
                  value={textStyle.fontSize}
                  onChange={(e) => patchText({ fontSize: +e.target.value })}
                  className="w-full"
                />
              </Field>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    patchText({
                      fontWeight: textStyle.fontWeight === "bold" ? "normal" : "bold",
                    })
                  }
                  className={`flex-1 py-1.5 text-xs rounded border ${
                    textStyle.fontWeight === "bold"
                      ? "border-violet-500 bg-violet-950"
                      : "border-zinc-700"
                  }`}
                >
                  굵게
                </button>
                <button
                  type="button"
                  onClick={() =>
                    patchText({
                      fontStyle: textStyle.fontStyle === "italic" ? "normal" : "italic",
                    })
                  }
                  className={`flex-1 py-1.5 text-xs rounded border ${
                    textStyle.fontStyle === "italic"
                      ? "border-violet-500 bg-violet-950"
                      : "border-zinc-700"
                  }`}
                >
                  기울임
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => patchText({ underline: !textStyle.underline })}
                  className={`flex-1 py-1.5 text-xs rounded border ${
                    textStyle.underline ? "border-violet-500 bg-violet-950" : "border-zinc-700"
                  }`}
                >
                  밑줄
                </button>
                <button
                  type="button"
                  onClick={() => patchText({ linethrough: !textStyle.linethrough })}
                  className={`flex-1 py-1.5 text-xs rounded border ${
                    textStyle.linethrough ? "border-violet-500 bg-violet-950" : "border-zinc-700"
                  }`}
                >
                  취소선
                </button>
              </div>
              <Field label="글자색">
                <input
                  type="color"
                  value={textStyle.fill.startsWith("#") ? textStyle.fill : "#000000"}
                  onChange={(e) => patchText({ fill: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </Field>
              <Field label="외곽선색">
                <input
                  type="color"
                  value={textStyle.stroke || "#000000"}
                  onChange={(e) => patchText({ stroke: e.target.value })}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </Field>
              <Field label={`외곽선 ${textStyle.strokeWidth}`}>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={textStyle.strokeWidth}
                  onChange={(e) => patchText({ strokeWidth: +e.target.value })}
                  className="w-full"
                />
              </Field>
              <Field label="정렬">
                <select
                  value={textStyle.textAlign}
                  onChange={(e) =>
                    patchText({ textAlign: e.target.value as "left" | "center" | "right" })
                  }
                  className="prop-input"
                >
                  <option value="left">왼쪽</option>
                  <option value="center">가운데</option>
                  <option value="right">오른쪽</option>
                </select>
              </Field>
              <Field label={`줄간격 ${textStyle.lineHeight.toFixed(1)}`}>
                <input
                  type="range"
                  min={0.8}
                  max={3}
                  step={0.1}
                  value={textStyle.lineHeight}
                  onChange={(e) => patchText({ lineHeight: +e.target.value })}
                  className="w-full"
                />
              </Field>
              <Field label={`자간 ${textStyle.charSpacing}`}>
                <input
                  type="range"
                  min={-50}
                  max={300}
                  value={textStyle.charSpacing}
                  onChange={(e) => patchText({ charSpacing: +e.target.value })}
                  className="w-full"
                />
              </Field>
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={textStyle.vertical}
                  onChange={(e) => patchText({ vertical: e.target.checked })}
                />
                세로 쓰기
              </label>
              <Field label={`불투명도 ${Math.round(textStyle.opacity * 100)}%`}>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={textStyle.opacity}
                  onChange={(e) => patchText({ opacity: +e.target.value })}
                  className="w-full"
                />
              </Field>
              <Field label="그림자">
                <input
                  type="color"
                  value={textStyle.shadowColor}
                  onChange={(e) => patchText({ shadowColor: e.target.value })}
                  className="w-full h-6 rounded mb-1"
                />
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={textStyle.shadowBlur}
                  onChange={(e) => patchText({ shadowBlur: +e.target.value })}
                  className="w-full"
                />
              </Field>
            </section>
          )}

        {selectedObjectType === "bubble" && bubbleStyle && (
          <section className="space-y-3">
            <Field label="채우기">
              <input
                type="color"
                value={bubbleStyle.fill}
                onChange={(e) => patchBubble({ fill: e.target.value })}
                className="w-full h-8 rounded"
              />
            </Field>
            <Field label="테두리">
              <input
                type="color"
                value={bubbleStyle.stroke}
                onChange={(e) => patchBubble({ stroke: e.target.value })}
                className="w-full h-8 rounded"
              />
            </Field>
            <Field label={`테두리 두께 ${bubbleStyle.strokeWidth}`}>
              <input
                type="range"
                min={0}
                max={8}
                value={bubbleStyle.strokeWidth}
                onChange={(e) => patchBubble({ strokeWidth: +e.target.value })}
                className="w-full"
              />
            </Field>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={bubbleStyle.dashed}
                onChange={(e) => patchBubble({ dashed: e.target.checked })}
              />
              점선 (속삭임)
            </label>
            <Field label={`불투명도 ${Math.round(bubbleStyle.opacity * 100)}%`}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={bubbleStyle.opacity}
                onChange={(e) => patchBubble({ opacity: +e.target.value })}
                className="w-full"
              />
            </Field>
          </section>
        )}

        {selectedObjectType === "image" && selectedObject && (
          <section className="space-y-3">
            <Field label={`불투명도 ${Math.round((selectedObject.opacity ?? 1) * 100)}%`}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={selectedObject.opacity ?? 1}
                onChange={(e) => {
                  if (!canvas) return;
                  applyImageOpacity(selectedObject, +e.target.value, canvas);
                  persist();
                }}
                className="w-full"
              />
            </Field>
            <button
              type="button"
              onClick={() => {
                if (!canvas) return;
                applyImageFlipX(selectedObject, !selectedObject.flipX, canvas);
                persist();
              }}
              className="w-full py-1.5 text-xs rounded border border-zinc-700 hover:border-violet-500"
            >
              좌우 반전
            </button>
            <Field label={`밝기 ${brightness}`}>
              <input
                type="range"
                min={-100}
                max={100}
                value={brightness}
                onChange={(e) =>
                  patchImageAdjust(+e.target.value, contrast, saturation)
                }
                className="w-full"
              />
            </Field>
            <Field label={`대비 ${contrast}`}>
              <input
                type="range"
                min={-100}
                max={100}
                value={contrast}
                onChange={(e) =>
                  patchImageAdjust(brightness, +e.target.value, saturation)
                }
                className="w-full"
              />
            </Field>
            <Field label={`채도 ${saturation}`}>
              <input
                type="range"
                min={-100}
                max={100}
                value={saturation}
                onChange={(e) =>
                  patchImageAdjust(brightness, contrast, +e.target.value)
                }
                className="w-full"
              />
            </Field>
          </section>
        )}

        {selectedObjectType === "none" && (
          <p className="text-xs text-zinc-500 text-center py-4">
            캔버스에서 텍스트, 말풍선, 이미지를 선택하면 속성을 편집할 수 있습니다.
          </p>
        )}
      </div>

      <LayerPanel editorRef={editorRef} />
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
