import { Shadow, type Canvas, type FabricObject, type FabricText, type Group } from "fabric";
import type { SelectedObjectType } from "@/stores/editorStore";

type FabricObj = FabricObject & {
  data?: { layerType?: string; bubbleType?: string; vertical?: boolean };
  assetId?: string;
};

export function getObjectType(obj: FabricObject | null): SelectedObjectType {
  if (!obj) return "none";
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

export function readBubbleStyle(obj: FabricObject): BubbleStyleSnapshot {
  const o = obj as FabricObject & { strokeDashArray?: number[] };
  return {
    fill: typeof o.fill === "string" ? o.fill : "#ffffff",
    stroke: typeof o.stroke === "string" ? o.stroke : "#000000",
    strokeWidth: Number(o.strokeWidth ?? 2),
    opacity: Number(o.opacity ?? 1),
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
  if (obj.type === "group") {
    const g = obj as Group;
    g.getObjects().forEach((child) => applyToShape(child, patch));
  } else {
    applyToShape(obj, patch);
  }
  canvas.requestRenderAll();
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
