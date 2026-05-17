export interface FontPreset {
  id: string;
  label: string;
  family: string;
}

export const FONT_PRESETS: FontPreset[] = [
  {
    id: "noto",
    label: "Noto Sans KR",
    family: "var(--font-noto), 'Noto Sans KR', sans-serif",
  },
  {
    id: "nanum-gothic",
    label: "나눔고딕",
    family: "var(--font-nanum-gothic), 'Nanum Gothic', sans-serif",
  },
  {
    id: "nanum-myeongjo",
    label: "나눔명조",
    family: "var(--font-nanum-myeongjo), 'Nanum Myeongjo', serif",
  },
  {
    id: "gothic-a1",
    label: "고딕 A1",
    family: "var(--font-gothic-a1), 'Gothic A1', sans-serif",
  },
  {
    id: "jua",
    label: "주아 (둥근체)",
    family: "var(--font-jua), 'Jua', sans-serif",
  },
  {
    id: "poor-story",
    label: "Poor Story (손글씨)",
    family: "var(--font-poor-story), 'Poor Story', cursive",
  },
  {
    id: "gaegu",
    label: "개구 (손글씨)",
    family: "var(--font-gaegu), 'Gaegu', cursive",
  },
  {
    id: "do-hyeon",
    label: "도현 (제목체)",
    family: "var(--font-do-hyeon), 'Do Hyeon', sans-serif",
  },
  {
    id: "black-han-sans",
    label: "검은고딕",
    family: "var(--font-black-han-sans), 'Black Han Sans', sans-serif",
  },
  {
    id: "gowun-batang",
    label: "고운바탕",
    family: "var(--font-gowun-batang), 'Gowun Batang', serif",
  },
  {
    id: "malgun",
    label: "맑은 고딕",
    family: "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif",
  },
  {
    id: "batang",
    label: "바탕",
    family: "Batang, 'Times New Roman', serif",
  },
  {
    id: "gulim",
    label: "굴림",
    family: "Gulim, sans-serif",
  },
  {
    id: "impact",
    label: "Impact (SFX)",
    family: "Impact, 'Arial Black', sans-serif",
  },
  {
    id: "comic",
    label: "코믹 산스",
    family: "'Comic Sans MS', 'Segoe Print', cursive",
  },
  {
    id: "arial",
    label: "Arial",
    family: "Arial, Helvetica, sans-serif",
  },
];

export const DEFAULT_TEXT_FONT = FONT_PRESETS[0].family;
export const DEFAULT_SFX_FONT = FONT_PRESETS.find((f) => f.id === "impact")!.family;
