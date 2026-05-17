import { Shadow, type Canvas, type FabricObject, type FabricText, type Group } from "fabric";
import type { SelectedObjectType } from "@/stores/editorStore";
import { fitBubbleInnerText, fitTextBoxToContent } from "@/lib/fabric/text-layout";
import {
  getBubbleShapeChildren,
  getBubbleTextBounds,
  getBubbleTextTarget,
  isBubbleTextObject,
} from "@/lib/fabric/bubbles";

type FabricObj = FabricObject & {
  data?: { layerType?: string; bubbleType?: string; vertical?: boolean };
  assetId?: string;
};

export function getObjectType(obj: FabricObject | null): SelectedObjectType {
  if (!obj) return "none";
  if (isBubbleTextObject(obj)) {
    const parent = (obj as FabricObj & { group?: Group }).group;
    if (parent && (parent as FabricObj).data?.layerType === "bubble") {
      return "bubble";
    }
  }
  const data = (obj as FabricObj).data;
  if (data?.layerType === "sfx") return "sfx";
  if (data?.layerType === "text") return "text";
  if (data?.layerType === "bubble") return "bubble";
  if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") {
    return data?.layerType === "sfx" ? "sfx" : "text";
  }
  if (data?.layerType === "image" || obj.type === "image") return "image";
  if (obj.type === "group") {
    const d = (obj as FabricObj).data;
    if (d?.layerType === "bubble") return "bubble";
  }
  if (obj.type === "ellipse" || obj.type === "rect" || obj.type === "polygon") {
    if (data?.layerType === "bubble") return "bubble";
  }
  return "other";
}

export interface TextStyleSnapshot {
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  fontStyle: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  textAlign: string;
  lineHeight: number;
  charSpacing: number;
  underline: boolean;
  linethrough: boolean;
  opacity: number;
  vertical: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export function readTextContent(obj: FabricObject): string {
  const t = obj as FabricText;
  return String(t.text ?? "");
}

export function applyTextContent(
  obj: FabricObject,
  text: string,
  canvas: Canvas
) {
  const t = obj as FabricText;
  t.set("text", text);
  fitTextBoxToContent(obj);
  t.set("dirty", true);
  canvas.requestRenderAll();
}

export function readTextStyle(obj: FabricObject): TextStyleSnapshot {
  const t = obj as FabricText & FabricObj;
  const shadow = t.shadow as Shadow | null;
  return {
    fontFamily: String(t.fontFamily ?? ""),
    fontSize: Number(t.fontSize ?? 18),
    fontWeight: t.fontWeight ?? "normal",
    fontStyle: String(t.fontStyle ?? "normal"),
    fill: typeof t.fill === "string" ? t.fill : "#000000",
    stroke: typeof t.stroke === "string" ? t.stroke : "",
    strokeWidth: Number(t.strokeWidth ?? 0),
    textAlign: String(t.textAlign ?? "center"),
    lineHeight: Number(t.lineHeight ?? 1.16),
    charSpacing: Number(t.charSpacing ?? 0),
    underline: Boolean(t.underline),
    linethrough: Boolean(t.linethrough),
    opacity: Number(t.opacity ?? 1),
    vertical: Boolean(t.data?.vertical),
    shadowColor: shadow?.color ?? "#000000",
    shadowBlur: shadow?.blur ?? 0,
    shadowOffsetX: shadow?.offsetX ?? 0,
    shadowOffsetY: shadow?.offsetY ?? 0,
  };
}

export function applyTextStyle(
  obj: FabricObject,
  patch: Partial<TextStyleSnapshot>,
  canvas: Canvas
) {
  const t = obj as FabricText & FabricObj;
  if (patch.fontFamily !== undefined) t.set("fontFamily", patch.fontFamily);
  if (patch.fontSize !== undefined) t.set("fontSize", patch.fontSize);
  if (patch.fontWeight !== undefined) t.set("fontWeight", patch.fontWeight);
  if (patch.fontStyle !== undefined) t.set("fontStyle", patch.fontStyle);
  if (patch.fill !== undefined) t.set("fill", patch.fill);
  if (patch.stroke !== undefined) t.set("stroke", patch.stroke);
  if (patch.strokeWidth !== undefined) t.set("strokeWidth", patch.strokeWidth);
  if (patch.textAlign !== undefined) t.set("textAlign", patch.textAlign);
  if (patch.lineHeight !== undefined) t.set("lineHeight", patch.lineHeight);
  if (patch.charSpacing !== undefined) t.set("charSpacing", patch.charSpacing);
  if (patch.underline !== undefined) t.set("underline", patch.underline);
  if (patch.linethrough !== undefined) t.set("linethrough", patch.linethrough);
  if (patch.opacity !== undefined) t.set("opacity", patch.opacity);
  if (patch.vertical !== undefined) {
    t.data = { ...t.data, layerType: t.data?.layerType ?? "text", vertical: patch.vertical };
    if (patch.vertical) t.set("charSpacing", 120);
  }
  if (
    patch.shadowColor !== undefined ||
    patch.shadowBlur !== undefined ||
    patch.shadowOffsetX !== undefined ||
    patch.shadowOffsetY !== undefined
  ) {
    const cur = (t.shadow as Shadow) ?? {};
    t.set(
      "shadow",
      new Shadow({
        color: patch.shadowColor ?? cur.color ?? "rgba(0,0,0,0.5)",
        blur: patch.shadowBlur ?? cur.blur ?? 0,
        offsetX: patch.shadowOffsetX ?? cur.offsetX ?? 2,
        offsetY: patch.shadowOffsetY ?? cur.offsetY ?? 2,
      })
    );
  }
  if (
    patch.fontSize !== undefined ||
    patch.fontFamily !== undefined ||
    patch.charSpacing !== undefined ||
    patch.lineHeight !== undefined ||
    patch.fontWeight !== undefined
  ) {
    if (isBubbleTextObject(obj)) {
      const parent = (obj as FabricObject & { group?: FabricObject }).group;
      if (parent) fitBubbleInnerText(obj, getBubbleTextBounds(parent));
    } else {
      fitTextBoxToContent(obj);
    }
  }
  t.set("dirty", true);
  canvas.requestRenderAll();
}

export interface BubbleStyleSnapshot {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  dashed: boolean;
}

export function readBubbleTextContent(obj: FabricObject): string {
  const text = getBubbleTextTarget(obj);
  if (!text) return "";
  return readTextContent(text);
}

export function applyBubbleTextContent(
  obj: FabricObject,
  text: string,
  canvas: Canvas
) {
  const target = getBubbleTextTarget(obj);
  if (!target) return;
  const t = target as FabricText;
  t.set("text", text);
  fitBubbleInnerText(target, getBubbleTextBounds(obj));
  t.set("dirty", true);
  const g = obj.type === "group" ? (obj as Group) : null;
  g?.set("dirty", true);
  canvas.requestRenderAll();
}

export function readBubbleStyle(obj: FabricObject): BubbleStyleSnapshot {
  const shape = getBubbleShapeChildren(obj)[0] ?? obj;
  const o = shape as FabricObject & { strokeDashArray?: number[] };
  const groupOpacity =
    obj.type === "group" ? Number(obj.opacity ?? 1) : Number(o.opacity ?? 1);
  return {
    fill: typeof o.fill === "string" ? o.fill : "#ffffff",
    stroke: typeof o.stroke === "string" ? o.stroke : "#000000",
    strokeWidth: Number(o.strokeWidth ?? 2),
    opacity: groupOpacity,
    dashed: Boolean(o.strokeDashArray?.length),
  };
}

function applyToShape(
  obj: FabricObject,
  patch: Partial<BubbleStyleSnapshot>
) {
  if (patch.fill !== undefined) obj.set("fill", patch.fill);
  if (patch.stroke !== undefined) obj.set("stroke", patch.stroke);
  if (patch.strokeWidth !== undefined) obj.set("strokeWidth", patch.strokeWidth);
  if (patch.opacity !== undefined) obj.set("opacity", patch.opacity);
  if (patch.dashed !== undefined) {
    obj.set("strokeDashArray", patch.dashed ? [6, 4] : undefined);
  }
}

export function applyBubbleStyle(
  obj: FabricObject,
  patch: Partial<BubbleStyleSnapshot>,
  canvas: Canvas
) {
  if (patch.opacity !== undefined && obj.type === "group") {
    obj.set("opacity", patch.opacity);
    const text = getBubbleTextTarget(obj);
    if (text) text.set("opacity", 1);
  }
  const shapePatch = { ...patch };
  delete shapePatch.opacity;
  const shapes =
    obj.type === "group" ? getBubbleShapeChildren(obj) : [obj];
  shapes.forEach((child) => applyToShape(child, shapePatch));
  obj.set("dirty", true);
  canvas.requestRenderAll();
}

/** 말풍선 내부 텍스트 스타일 (없으면 null) */
export function readBubbleInnerTextStyle(
  obj: FabricObject
): TextStyleSnapshot | null {
  const text = getBubbleTextTarget(obj);
  if (!text) return null;
  return readTextStyle(text);
}

export function applyBubbleInnerTextStyle(
  obj: FabricObject,
  patch: Partial<TextStyleSnapshot>,
  canvas: Canvas
) {
  const text = getBubbleTextTarget(obj);
  if (!text) return;
  applyTextStyle(text, patch, canvas);
  const g = obj.type === "group" ? (obj as Group) : null;
  g?.set("dirty", true);
}

export function applyImageOpacity(
  obj: FabricObject,
  opacity: number,
  canvas: Canvas
) {
  obj.set("opacity", opacity);
  canvas.requestRenderAll();
}

export function applyImageFlipX(
  obj: FabricObject,
  flipX: boolean,
  canvas: Canvas
) {
  obj.set("flipX", flipX);
  canvas.requestRenderAll();
}
