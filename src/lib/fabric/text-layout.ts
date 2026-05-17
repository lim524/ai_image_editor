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
