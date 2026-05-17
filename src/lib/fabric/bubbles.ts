import type { FabricObject } from "fabric";
import { DEFAULT_SFX_FONT, DEFAULT_TEXT_FONT } from "@/lib/fonts/presets";

type FabricModule = typeof import("fabric");

export type BubbleType =
  | "oval"
  | "round"
  | "thought"
  | "shout"
  | "whisper";

function tag(obj: FabricObject, data: Record<string, unknown>): FabricObject {
  (obj as FabricObject & { data?: Record<string, unknown> }).data = data;
  return obj;
}

export async function createSpeechBubble(
  type: BubbleType,
  left = 100,
  top = 100
): Promise<FabricObject> {
  const fabric = await import("fabric");

  switch (type) {
    case "oval":
      return tag(
        new fabric.Ellipse({
          left,
          top,
          rx: 80,
          ry: 50,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        }),
        { layerType: "bubble", bubbleType: "oval" }
      );
    case "round":
      return tag(
        new fabric.Rect({
          left,
          top,
          width: 160,
          height: 90,
          rx: 20,
          ry: 20,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 2,
          originX: "center",
          originY: "center",
        }),
        { layerType: "bubble", bubbleType: "round" }
      );
    case "thought":
      return createThoughtBubble(fabric, left, top);
    case "shout":
      return createShoutBubble(fabric, left, top);
    case "whisper":
      return tag(
        new fabric.Ellipse({
          left,
          top,
          rx: 70,
          ry: 45,
          fill: "#ffffff",
          stroke: "#000000",
          strokeWidth: 1.5,
          strokeDashArray: [6, 4],
          originX: "center",
          originY: "center",
        }),
        { layerType: "bubble", bubbleType: "whisper" }
      );
    default:
      return createSpeechBubble("oval", left, top);
  }
}

function createThoughtBubble(
  fabric: FabricModule,
  left: number,
  top: number
): FabricObject {
  const main = new fabric.Ellipse({
    left,
    top: top - 10,
    rx: 75,
    ry: 48,
    fill: "#ffffff",
    stroke: "#000000",
    strokeWidth: 2,
    originX: "center",
    originY: "center",
  });
  const dot1 = new fabric.Circle({
    left: left - 30,
    top: top + 45,
    radius: 8,
    fill: "#ffffff",
    stroke: "#000000",
    strokeWidth: 2,
    originX: "center",
    originY: "center",
  });
  const dot2 = new fabric.Circle({
    left: left - 45,
    top: top + 60,
    radius: 5,
    fill: "#ffffff",
    stroke: "#000000",
    strokeWidth: 2,
    originX: "center",
    originY: "center",
  });
  return tag(
    new fabric.Group([main, dot1, dot2], {
      left,
      top,
      originX: "center",
      originY: "center",
    }),
    { layerType: "bubble", bubbleType: "thought" }
  );
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
  return tag(
    new fabric.Polygon(
      points.map((p) => ({ x: p.x + left, y: p.y + top })),
      {
        fill: "#ffffff",
        stroke: "#000000",
        strokeWidth: 2.5,
        originX: "center",
        originY: "center",
      }
    ),
    { layerType: "bubble", bubbleType: "shout" }
  );
}

export async function createSfxText(
  text: string,
  left = 150,
  top = 150
): Promise<FabricObject> {
  const { IText } = await import("fabric");
  return tag(
    new IText(text || "쾅!", {
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
}

export async function createDialogText(
  text: string,
  left = 150,
  top = 150,
  vertical = false
): Promise<FabricObject> {
  const { IText } = await import("fabric");
  return tag(
    new IText(text || "대사를 입력하세요", {
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
}
