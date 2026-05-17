/** NovelAI / SD 계열에서 자주 쓰는 출력 너비(px) */
const KNOWN_GENERATION_WIDTHS = [
  512, 640, 704, 768, 832, 1024, 1216, 1472, 1536, 1856, 2560,
];

function isKnownGenerationWidth(width: number): boolean {
  return KNOWN_GENERATION_WIDTHS.some((w) => Math.abs(width - w) <= 4);
}

/**
 * 파일 드롭 등에서만 사용. 클립보드는 원본 픽셀을 그대로 씀(사이트별 2x 보정 오류 방지).
 * 정확히 2배·알려진 생성 너비일 때만 절반으로 줄임.
 */
export function normalizeLogicalPixelDimensions(
  width: number,
  height: number,
  fromClipboard = false
): { width: number; height: number } {
  if (fromClipboard || width <= 0 || height <= 0) {
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
