"use client";

import type { RefObject } from "react";
import { useEditorStore } from "@/stores/editorStore";
import { useEffect, useState } from "react";
import type { FontPreset } from "@/lib/fonts/presets";
import { FONT_PRESETS } from "@/lib/fonts/presets";
import { getAllFontPresets } from "@/lib/fonts/user-fonts";
import {
  applyBubbleInnerTextStyle,
  applyBubbleStyle,
  applyBubbleTextContent,
  applyImageOpacity,
  applyTextContent,
  applyTextStyle,
  readBubbleInnerTextStyle,
  readBubbleStyle,
  readBubbleTextContent,
  readTextContent,
  readTextStyle,
} from "@/lib/fabric/properties";
import type { CanvasEditorHandle } from "./CanvasEditor";
import { NumberField } from "@/components/ui/NumberField";

interface ContextPropertiesBarProps {
  editorRef: RefObject<CanvasEditorHandle | null>;
}

export function ContextPropertiesBar({ editorRef }: ContextPropertiesBarProps) {
  const selectedObjectType = useEditorStore((s) => s.selectedObjectType);
  const selectedObject = useEditorStore((s) => s.selectedObject);
  const textStyle = useEditorStore((s) => s.textStyle);
  const bubbleStyle = useEditorStore((s) => s.bubbleStyle);
  const propertiesTick = useEditorStore((s) => s.propertiesTick);
  const [fontPresets, setFontPresets] = useState<FontPreset[]>(FONT_PRESETS);
  const [textDraft, setTextDraft] = useState("");

  useEffect(() => {
    void getAllFontPresets().then(setFontPresets);
    const onFonts = () => void getAllFontPresets().then(setFontPresets);
    window.addEventListener("fonts:updated", onFonts);
    return () => window.removeEventListener("fonts:updated", onFonts);
  }, []);

  useEffect(() => {
    if (!selectedObject) return;
    if (selectedObjectType === "bubble") {
      setTextDraft(readBubbleTextContent(selectedObject));
    } else if (selectedObjectType === "text" || selectedObjectType === "sfx") {
      setTextDraft(readTextContent(selectedObject));
    }
  }, [selectedObject, selectedObjectType, propertiesTick]);

  const canvas = editorRef.current?.getCanvas();
  const record = editorRef.current?.recordAction;

  const isBubble = selectedObjectType === "bubble";

  const patchText = (label: string, patch: Parameters<typeof applyTextStyle>[1]) => {
    if (!canvas || !selectedObject || !record) return;
    record(label, () => {
      if (isBubble) {
        applyBubbleInnerTextStyle(selectedObject, patch, canvas);
      } else {
        applyTextStyle(selectedObject, patch, canvas);
      }
      useEditorStore.getState().setSelection(
        selectedObjectType,
        selectedObject,
        isBubble
          ? readBubbleInnerTextStyle(selectedObject)
          : readTextStyle(selectedObject),
        bubbleStyle
      );
    });
  };

  const commitTextContent = () => {
    if (!canvas || !selectedObject || !record) return;
    const current = isBubble
      ? readBubbleTextContent(selectedObject)
      : readTextContent(selectedObject);
    if (textDraft === current) return;
    record(isBubble ? "말풍선 대사 수정" : "대사 수정", () => {
      if (isBubble) {
        applyBubbleTextContent(selectedObject, textDraft, canvas);
      } else {
        applyTextContent(selectedObject, textDraft, canvas);
      }
      useEditorStore.getState().setSelection(
        selectedObjectType,
        selectedObject,
        isBubble
          ? readBubbleInnerTextStyle(selectedObject)
          : readTextStyle(selectedObject),
        bubbleStyle
      );
      useEditorStore.getState().bumpProperties();
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

  if (selectedObjectType === "none") {
    return (
      <div className="flex-1 flex items-center px-3 min-w-0 h-11">
        <span className="text-xs text-zinc-500 truncate">
          객체를 선택하면 글꼴·크기·대사 등을 편집할 수 있습니다
        </span>
      </div>
    );
  }

  const isTextLike =
    (selectedObjectType === "text" ||
      selectedObjectType === "sfx" ||
      selectedObjectType === "bubble") &&
    textStyle;

  if (selectedObjectType === "image" && selectedObject) {
    return (
      <div
        className="flex-1 flex items-center gap-3 px-3 min-w-0 h-11"
        key={propertiesTick}
      >
        <span className="text-[10px] text-zinc-500 shrink-0">이미지</span>
        <NumberField
          label="불투명"
          value={Math.round((selectedObject.opacity ?? 1) * 100)}
          min={0}
          max={100}
          suffix="%"
          onCommit={(v) => {
            if (!canvas || !record) return;
            record("불투명도", () =>
              applyImageOpacity(selectedObject, v / 100, canvas)
            );
          }}
        />
      </div>
    );
  }

  if (isTextLike) {
    return (
      <div className="flex-1 flex flex-col gap-2 px-3 py-2 min-w-0" key={propertiesTick}>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] text-zinc-500">
            {selectedObjectType === "sfx"
              ? "효과음 텍스트"
              : selectedObjectType === "bubble"
                ? "말풍선 대사"
                : "대사"}
          </span>
          <textarea
            value={textDraft}
            onChange={(e) => setTextDraft(e.target.value)}
            onBlur={commitTextContent}
            onKeyDown={(e) => {
              if (isBubble) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commitTextContent();
                (e.target as HTMLTextAreaElement).blur();
              }
            }}
            placeholder={
              selectedObjectType === "sfx"
                ? "쾅!"
                : selectedObjectType === "bubble"
                  ? "말풍선 안에 넣을 대사"
                  : "대사를 입력하세요"
            }
            rows={2}
            className="prop-input w-full text-sm resize-none min-h-[52px] leading-relaxed"
          />
        </label>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 shrink-0">
            {selectedObjectType === "sfx"
              ? "효과음"
              : selectedObjectType === "bubble"
                ? "말풍선"
                : "대사"}
          </span>
          <label className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-zinc-500">글꼴</span>
            <select
              value={
                fontPresets.find((f) =>
                  textStyle.fontFamily.includes(
                    f.family.split(",")[0].replace(/'/g, "")
                  )
                )?.id ??
                fontPresets.find((f) => f.family === textStyle.fontFamily)?.id ??
                "noto"
              }
              onChange={(e) => {
                const preset = fontPresets.find((f) => f.id === e.target.value);
                if (preset) patchText("글꼴 변경", { fontFamily: preset.family });
              }}
              className="prop-input-compact max-w-[120px]"
            >
              {fontPresets.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <NumberField
            label="크기"
            value={textStyle.fontSize}
            min={8}
            max={200}
            suffix="px"
            onCommit={(v) => patchText("글자 크기", { fontSize: v })}
          />
          <NumberField
            label="불투명"
            value={Math.round(textStyle.opacity * 100)}
            min={0}
            max={100}
            suffix="%"
            onCommit={(v) =>
              isBubble
                ? patchBubble("불투명도", { opacity: v / 100 })
                : patchText("불투명도", { opacity: v / 100 })
            }
          />
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
        </div>

        {isBubble && bubbleStyle && (
          <div className="flex items-center gap-3 flex-wrap border-t border-zinc-800 pt-2">
            <span className="text-[10px] text-zinc-500 shrink-0">모양</span>
            <label className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-zinc-500">채움</span>
              <input
                type="color"
                value={bubbleStyle.fill}
                onChange={(e) =>
                  patchBubble("말풍선 채움", { fill: e.target.value })
                }
                className="w-7 h-7 rounded border border-zinc-700"
              />
            </label>
            <label className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-zinc-500">테두리</span>
              <input
                type="color"
                value={bubbleStyle.stroke}
                onChange={(e) =>
                  patchBubble("말풍선 테두리", { stroke: e.target.value })
                }
                className="w-7 h-7 rounded border border-zinc-700"
              />
            </label>
            <NumberField
              label="두께"
              value={bubbleStyle.strokeWidth}
              min={0}
              max={20}
              step={0.5}
              suffix="px"
              onCommit={(v) => patchBubble("테두리 두께", { strokeWidth: v })}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
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
        active
          ? "border-violet-500 bg-violet-950 text-violet-200"
          : "border-zinc-700 text-zinc-400"
      }`}
    >
      {children}
    </button>
  );
}
