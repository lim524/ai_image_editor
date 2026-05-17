/** NovelAI / SD 계열에서 자주 쓰는 출력 너비(px) */
const KNOWN_GENERATION_WIDTHS = [
  512, 640, 704, 768, 832, 1024, 1216, 1472, 1536, 1856, 2560,
];

function isKnownGenerationWidth(width: number): boolean {
  return KNOWN_GENERATION_WIDTHS.some((w) => Math.abs(width - w) <= 4);
}

/**
 * 클립보드 붙여넣기 시 브라우저가 2x·DPR 해상도로 주는 경우가 많음.
 * NovelAI 표시 해상도(예: 832)에 맞게 논리 픽셀 크기로 보정.
 */
export function normalizeLogicalPixelDimensions(
  width: number,
  height: number,
  fromClipboard = false
): { width: number; height: number } {
  if (!fromClipboard || width <= 0 || height <= 0) {
    return { width: Math.round(width), height: Math.round(height) };
  }

  const divisors = new Set<number>([2]);
  const dpr =
    typeof window !== "undefined" ? Math.round(window.devicePixelRatio || 1) : 1;
  if (dpr >= 2) divisors.add(dpr);

  for (const d of divisors) {
    if (width % d !== 0 || height % d !== 0) continue;
    const w2 = width / d;
    const h2 = height / d;
    if (isKnownGenerationWidth(w2)) {
      return { width: Math.round(w2), height: Math.round(h2) };
    }
  }

  return { width: Math.round(width), height: Math.round(height) };
}
