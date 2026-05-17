export interface FontPreset {
  id: string;
  label: string;
  family: string;
}

export const FONT_PRESETS: FontPreset[] = [
  { id: "noto", label: "Noto Sans KR", family: "var(--font-noto), 'Noto Sans KR', sans-serif" },
  { id: "malgun", label: "맑은 고딕", family: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" },
  { id: "batang", label: "바탕", family: "Batang, 'Times New Roman', serif" },
  { id: "gulim", label: "굴림", family: "Gulim, sans-serif" },
  { id: "impact", label: "Impact (SFX)", family: "Impact, 'Arial Black', sans-serif" },
  { id: "comic", label: "코믹", family: "'Comic Sans MS', 'Segoe Print', cursive" },
  { id: "arial", label: "Arial", family: "Arial, Helvetica, sans-serif" },
];

export const DEFAULT_TEXT_FONT = FONT_PRESETS[0].family;
export const DEFAULT_SFX_FONT = FONT_PRESETS[4].family;
