import type { FabricObject, Group } from "fabric";
import { DEFAULT_SFX_FONT, DEFAULT_TEXT_FONT } from "@/lib/fonts/presets";
import { fitTextBoxToContent } from "@/lib/fabric/text-layout";

type FabricModule = typeof import("fabric");

export type BubbleType =
  | "oval"
  | "round"
  | "thought"
  | "shout"
  | "whisper";

type TaggedObject = FabricObject & {
  data?: Record<string, unknown>;
};

function tag(obj: FabricObject, data: Record<string, unknown>): FabricObject {
  (obj as TaggedObject).data = data;
  return obj;
}

export function isBubbleTextObject(obj: FabricObject): boolean {
  const data = (obj as TaggedObject).data;
  if (data?.role === "bubbleText") return true;
  const isTextType =
    obj.type === "i-text" || obj.type === "text" || obj.type === "IText";
  return isTextType && data?.role !== "bubbleShape";
}

export function getBubbleTextTarget(obj: FabricObject): FabricObject | null {
  if (obj.type !== "group") return null;
  const g = obj as Group;
  return (
    g.getObjects().find((child) => isBubbleTextObject(child)) ?? null
  );
}

export function getBubbleShapeChildren(obj: FabricObject): FabricObject[] {
  if (obj.type !== "group") return [obj];
  return (obj as Group).getObjects().filter((child) => !isBubbleTextObject(child));
}

function createInnerBubbleText(
  fabric: FabricModule,
  content: string,
  maxWidth: number,
  fontSize = 16
): FabricObject {
  const text = new fabric.IText(content, {
    left: 0,
    top: 0,
    originX: "center",
    originY: "center",
    textAlign: "center",
    fontFamily: DEFAULT_TEXT_FONT,
    fontSize,
    fill: "#000000",
    width: maxWidth,
    splitByGrapheme: true,
  });
  tag(text, { role: "bubbleText" });
  fitTextBoxToContent(text, 12, 8);
  return text;
}

function createBubbleGroup(
  fabric: FabricModule,
  type: BubbleType,
  left: number,
  top: number,
  shapes: FabricObject[],
  textWidth: number,
  fontSize = 16
): FabricObject {
  const text = createInnerBubbleText(fabric, "", textWidth, fontSize);
  const group = new fabric.Group([...shapes, text], {
    left,
    top,
    originX: "center",
    originY: "center",
    subTargetCheck: true,
  });
  return tag(group, { layerType: "bubble", bubbleType: type });
}

export async function createSpeechBubble(
  type: BubbleType,
  left = 100,
  top = 100
): Promise<FabricObject> {
  const fabric = await import("fabric");

  switch (type) {
    case "oval": {
      const rx = 80;
      const ry = 50;
      const shape = tag(
        new fabric.Ellipse({
          left: 0,
          top: 0,
          rx,
          ry,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        }),
        { role: "bubbleShape" }
      );
      return createBubbleGroup(fabric, type, left, top, [shape], Math.floor(rx * 1.85));
    }
    case "round": {
      const w = 160;
      const h = 90;
      const shape = tag(
        new fabric.Rect({
          left: 0,
          top: 0,
          width: w,
          height: h,
          rx: 20,
          ry: 20,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        }),
        { role: "bubbleShape" }
      );
      return createBubbleGroup(fabric, type, left, top, [shape], Math.floor(w * 0.85));
    }
    case "thought":
      return createThoughtBubble(fabric, left, top);
    case "shout":
      return createShoutBubble(fabric, left, top);
    case "whisper": {
      const rx = 70;
      const ry = 45;
      const shape = tag(
        new fabric.Ellipse({
          left: 0,
          top: 0,
          rx,
          ry,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 1.5,
          strokeDashArray: [6, 4],
          originX: "center",
          originY: "center",
        }),
        { role: "bubbleShape" }
      );
      return createBubbleGroup(fabric, type, left, top, [shape], Math.floor(rx * 1.85), 15);
    }
    default:
      return createSpeechBubble("oval", left, top);
  }
}

function createThoughtBubble(
  fabric: FabricModule,
  left: number,
  top: number
): FabricObject {
  const main = tag(
    new fabric.Ellipse({
      left: 0,
      top: -10,
      rx: 75,
      ry: 48,
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 2,
      originX: "center",
      originY: "center",
    }),
    { role: "bubbleShape" }
  );
  const dot1 = tag(
    new fabric.Circle({
      left: -30,
      top: 45,
      radius: 8,
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 2,
      originX: "center",
      originY: "center",
    }),
    { role: "bubbleShape" }
  );
  const dot2 = tag(
    new fabric.Circle({
      left: -45,
      top: 60,
      radius: 5,
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 2,
      originX: "center",
      originY: "center",
    }),
    { role: "bubbleShape" }
  );
  return createBubbleGroup(fabric, "thought", left, top, [main, dot1, dot2], 120);
}

function createShoutBubble(
  fabric: FabricModule,
  left: number,
  top: number
): FabricObject {
  const points = [
    { x: 0, y: -50 },
    { x: 45, y: -35 },
    { x: 70, y: 0 },
    { x: 50, y: 40 },
    { x: 0, y: 55 },
    { x: -50, y: 40 },
    { x: -70, y: 0 },
    { x: -45, y: -35 },
  ];
  const shape = tag(
    new fabric.Polygon(points, {
      left: 0,
      top: 0,
      fill: "#ffffff",
      stroke: "#000000",
      strokeWidth: 2.5,
      originX: "center",
      originY: "center",
    }),
    { role: "bubbleShape" }
  );
  return createBubbleGroup(fabric, "shout", left, top, [shape], 110, 17);
}

/** 말풍선 안 텍스트 바로 편집 모드 */
export function startBubbleTextEditing(
  canvas: import("fabric").Canvas,
  bubble: FabricObject
): void {
  const text = getBubbleTextTarget(bubble);
  if (!text) return;
  const editable = text as FabricObject & {
    enterEditing?: () => void;
    selectAll?: () => void;
  };
  canvas.setActiveObject(text);
  editable.enterEditing?.();
  requestAnimationFrame(() => editable.selectAll?.());
}

export async function createSfxText(
  text: string,
  left = 150,
  top = 150
): Promise<FabricObject> {
  const { IText } = await import("fabric");
  const content = text || "쾅!";
  const obj = tag(
    new IText(content, {
      left,
      top,
      fontFamily: DEFAULT_SFX_FONT,
      fontSize: 48,
      fontWeight: "bold",
      fill: "#000000",
      stroke: "#ffffff",
      strokeWidth: 2,
      originX: "center",
      originY: "center",
    }),
    { layerType: "sfx" }
  );
  fitTextBoxToContent(obj, 24, 16);
  return obj;
}

export async function createDialogText(
  text: string,
  left = 150,
  top = 150,
  vertical = false
): Promise<FabricObject> {
  const { IText } = await import("fabric");
  const content = text || "대사를 입력하세요";
  const obj = tag(
    new IText(content, {
      left,
      top,
      fontFamily: DEFAULT_TEXT_FONT,
      fontSize: 18,
      fill: "#000000",
      originX: "center",
      originY: "center",
      ...(vertical ? { charSpacing: 100, lineHeight: 1.2 } : {}),
    }),
    { layerType: "text", vertical }
  );
  fitTextBoxToContent(obj);
  return obj;
}
