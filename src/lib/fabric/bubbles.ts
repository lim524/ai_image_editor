import type { FabricObject, Group } from "fabric";
import { DEFAULT_SFX_FONT, DEFAULT_TEXT_FONT } from "@/lib/fonts/presets";
import {
  fitBubbleInnerText,
  fitTextBoxToContent,
  type BubbleTextBounds,
} from "@/lib/fabric/text-layout";

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

/** 말풍선 도형 기준 내부 텍스트 허용 영역 */
export function getBubbleTextBounds(obj: FabricObject): BubbleTextBounds {
  const shapes = getBubbleShapeChildren(obj);
  const main = shapes[0];
  if (!main) return { maxWidth: 120, maxHeight: 72 };

  if (main.type === "ellipse") {
    const e = main as FabricObject & { rx?: number; ry?: number };
    const rx = Number(e.rx ?? 50);
    const ry = Number(e.ry ?? 30);
    return { maxWidth: rx * 1.75, maxHeight: ry * 1.55 };
  }
  if (main.type === "rect") {
    const r = main as FabricObject & { width?: number; height?: number };
    return {
      maxWidth: Number(r.width ?? 120) * 0.82,
      maxHeight: Number(r.height ?? 80) * 0.72,
    };
  }
  if (main.type === "polygon") {
    return { maxWidth: 100, maxHeight: 64 };
  }
  return { maxWidth: 120, maxHeight: 72 };
}

function createInnerBubbleText(
  fabric: FabricModule,
  content: string,
  bounds: BubbleTextBounds,
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
    splitByGrapheme: true,
  });
  tag(text, { role: "bubbleText" });
  fitBubbleInnerText(text, bounds);
  return text;
}

async function createBubbleGroup(
  fabric: FabricModule,
  type: BubbleType,
  left: number,
  top: number,
  shapes: FabricObject[],
  textBounds: BubbleTextBounds,
  fontSize = 16
): Promise<FabricObject> {
  const text = createInnerBubbleText(fabric, "", textBounds, fontSize);
  const group = new fabric.Group([...shapes, text], {
    left,
    top,
    originX: "center",
    originY: "center",
    subTargetCheck: true,
  });
  tag(group, { layerType: "bubble", bubbleType: type });

  const mainShape = shapes[0];
  if (mainShape) {
    const clip = await mainShape.clone();
    clip.set({
      fill: "#ffffff",
      stroke: undefined,
      strokeWidth: 0,
      absolutePositioned: false,
    });
    group.clipPath = clip;
  }
  return group;
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
      return createBubbleGroup(fabric, type, left, top, [shape], {
        maxWidth: rx * 1.75,
        maxHeight: ry * 1.55,
      });
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
      return createBubbleGroup(fabric, type, left, top, [shape], {
        maxWidth: w * 0.82,
        maxHeight: h * 0.72,
      });
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
      return createBubbleGroup(fabric, type, left, top, [shape], {
        maxWidth: rx * 1.75,
        maxHeight: ry * 1.55,
      }, 15);
    }
    default:
      return createSpeechBubble("oval", left, top);
  }
}

function createThoughtBubble(
  fabric: FabricModule,
  left: number,
  top: number
): Promise<FabricObject> {
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
  return createBubbleGroup(fabric, "thought", left, top, [main, dot1, dot2], {
    maxWidth: 120,
    maxHeight: 72,
  });
}

function createShoutBubble(
  fabric: FabricModule,
  left: number,
  top: number
): Promise<FabricObject> {
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
  return createBubbleGroup(fabric, "shout", left, top, [shape], {
    maxWidth: 100,
    maxHeight: 64,
  }, 17);
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
