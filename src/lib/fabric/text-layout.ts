import type { FabricObject } from "fabric";

const TEXT_PADDING_X = 20;
const TEXT_PADDING_Y = 12;
const MIN_TEXT_BOX_WIDTH = 64;
const MIN_TEXT_BOX_HEIGHT = 28;

type TextLike = FabricObject & {
  initDimensions?: () => void;
  calcTextHeight?: () => number;
  getBoundingRect: () => { width: number; height: number };
  fontSize?: number;
  height?: number;
  text?: string;
  set: (props: Record<string, unknown>) => void;
  setCoords: () => void;
};

/** IText 선택·변형 박스가 글자 내용에 맞게 잡히도록 크기 보정 */
export function fitTextBoxToContent(
  obj: FabricObject,
  paddingX = TEXT_PADDING_X,
  paddingY = TEXT_PADDING_Y
): void {
  const t = obj as TextLike;
  t.initDimensions?.();

  const rect = t.getBoundingRect();
  const fontSize = Number(t.fontSize ?? 18);
  const width = Math.max(
    MIN_TEXT_BOX_WIDTH,
    Math.ceil(rect.width) + paddingX
  );
  const height = Math.max(
    MIN_TEXT_BOX_HEIGHT,
    Math.ceil(rect.height) + paddingY,
    Math.ceil(fontSize * 1.35) + paddingY
  );

  t.set({ width, height });
  t.setCoords();
}

export interface BubbleTextBounds {
  maxWidth: number;
  maxHeight: number;
}

function measureTextHeight(t: TextLike): number {
  t.initDimensions?.();
  const calc = t.calcTextHeight?.();
  if (typeof calc === "number" && calc > 0) return Math.ceil(calc);
  return Math.ceil(t.getBoundingRect().height);
}

/** 말풍선 Textbox: 고정 너비·가운데 정렬·줄바꿈·Enter 줄내림, 넘치면 글자 축소 */
export function fitBubbleInnerText(
  obj: FabricObject,
  bounds: BubbleTextBounds,
  padding = 8
): void {
  const t = obj as TextLike;
  const maxWidth = Math.max(40, bounds.maxWidth - padding * 2);
  const maxHeight = Math.max(28, bounds.maxHeight - padding * 2);

  let fontSize = Number(t.fontSize ?? 16);
  const minFont = 8;

  t.set({
    width: maxWidth,
    splitByGrapheme: true,
    textAlign: "center",
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
    lockScalingX: true,
    lockScalingY: true,
  });

  for (let i = 0; i < 16; i++) {
    t.set({ fontSize });
    const textHeight = measureTextHeight(t);
    if (textHeight <= maxHeight) {
      t.set({
        height: Math.max(MIN_TEXT_BOX_HEIGHT, Math.min(maxHeight, textHeight + 2)),
      });
      t.setCoords();
      return;
    }
    if (fontSize <= minFont) break;
    fontSize = Math.max(minFont, fontSize - 1);
  }

  t.set({
    fontSize: minFont,
    height: maxHeight,
  });
  t.setCoords();
}
