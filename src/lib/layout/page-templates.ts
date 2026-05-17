export interface PanelSlot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PageTemplate {
  id: string;
  name: string;
  slots: PanelSlot[];
}

/** Normalized 0-1 coordinates within page */
export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "1x1",
    name: "1칸",
    slots: [{ x: 0.05, y: 0.05, w: 0.9, h: 0.9 }],
  },
  {
    id: "2x1",
    name: "2칸 (가로)",
    slots: [
      { x: 0.05, y: 0.05, w: 0.42, h: 0.9 },
      { x: 0.53, y: 0.05, w: 0.42, h: 0.9 },
    ],
  },
  {
    id: "1x2",
    name: "2칸 (세로)",
    slots: [
      { x: 0.05, y: 0.05, w: 0.9, h: 0.42 },
      { x: 0.05, y: 0.53, w: 0.9, h: 0.42 },
    ],
  },
  {
    id: "2x2",
    name: "4칸",
    slots: [
      { x: 0.05, y: 0.05, w: 0.42, h: 0.42 },
      { x: 0.53, y: 0.05, w: 0.42, h: 0.42 },
      { x: 0.05, y: 0.53, w: 0.42, h: 0.42 },
      { x: 0.53, y: 0.53, w: 0.42, h: 0.42 },
    ],
  },
  {
    id: "3-row",
    name: "3칸 (가로)",
    slots: [
      { x: 0.03, y: 0.1, w: 0.28, h: 0.8 },
      { x: 0.36, y: 0.1, w: 0.28, h: 0.8 },
      { x: 0.69, y: 0.1, w: 0.28, h: 0.8 },
    ],
  },
  {
    id: "diagonal",
    name: "대각 컷",
    slots: [
      { x: 0.05, y: 0.05, w: 0.55, h: 0.45 },
      { x: 0.4, y: 0.5, w: 0.55, h: 0.45 },
    ],
  },
];

export function getTemplate(id: string): PageTemplate {
  return PAGE_TEMPLATES.find((t) => t.id === id) ?? PAGE_TEMPLATES[0];
}
