import type { FabricObject } from "fabric";

const TEXT_PADDING_X = 20;
const TEXT_PADDING_Y = 12;
const MIN_TEXT_BOX_WIDTH = 64;
const MIN_TEXT_BOX_HEIGHT = 28;

type TextLike = FabricObject & {
  initDimensions?: () => void;
  getBoundingRect: () => { width: number; height: number };
  fontSize?: number;
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
  if (typeof t.initDimensions === "function") {
    t.initDimensions();
  }

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

/** 말풍선 안 텍스트: 너비 고정·줄바꿈, 높이만 조절(넘치면 글자 축소) */
export function fitBubbleInnerText(
  obj: FabricObject,
  bounds: BubbleTextBounds,
  padding = 6
): void {
  const t = obj as TextLike;
  const maxWidth = Math.max(32, bounds.maxWidth - padding * 2);
  const maxHeight = Math.max(24, bounds.maxHeight - padding * 2);

  t.set({
    width: maxWidth,
    splitByGrapheme: true,
    textAlign: "center",
    originX: "center",
    originY: "center",
    left: 0,
    top: 0,
  });

  let fontSize = Number(t.fontSize ?? 16);
  const minFont = 9;

  for (let i = 0; i < 12; i++) {
    t.set({ fontSize });
    t.initDimensions?.();
    const rect = t.getBoundingRect();
    const h = Math.ceil(rect.height);
    const w = Math.ceil(rect.width);
    if (h <= maxHeight && w <= maxWidth + 2) break;
    if (fontSize <= minFont) break;
    fontSize = Math.max(minFont, fontSize - 1);
  }

  t.initDimensions?.();
  const rect = t.getBoundingRect();
  const height = Math.min(
    maxHeight,
    Math.max(MIN_TEXT_BOX_HEIGHT, Math.ceil(rect.height) + 4)
  );
  t.set({ width: maxWidth, height });
  t.setCoords();
}
