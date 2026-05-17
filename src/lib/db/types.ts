export type ProjectFormat = "webtoon" | "page";
export type LayerType = "image" | "bubble" | "text" | "sfx";
export type AssetCategory = "character" | "background" | "prop" | "other";

export interface LayoutSettings {
  stripWidth?: number;
  panelGap?: number;
  pageWidth?: number;
  pageHeight?: number;
  readingDirection?: "ltr" | "rtl";
  templateId?: string;
}

export interface Project {
  id: string;
  title: string;
  format: ProjectFormat;
  createdAt: number;
  updatedAt: number;
  coverThumbnail?: Blob;
  coverUpdatedAt?: number;
}

export interface ProjectWithCover extends Project {
  coverUrl: string | null;
}

export interface Episode {
  id: string;
  projectId: string;
  order: number;
  title: string;
  layoutSettings: LayoutSettings;
  createdAt: number;
  updatedAt: number;
}

export interface Panel {
  id: string;
  episodeId: string;
  order: number;
  title?: string;
  width: number;
  height: number;
  backgroundColor: string;
  crop?: { x: number; y: number; width: number; height: number };
}

export function getPanelDisplayName(panel: Panel, index: number): string {
  return panel.title?.trim() || `컷 ${index + 1}`;
}

export interface Layer {
  id: string;
  panelId: string;
  type: LayerType;
  zIndex: number;
  fabricJson: string;
  assetId?: string;
  locked: boolean;
}

export interface Asset {
  id: string;
  projectId: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  blob: Blob;
  thumbnail: Blob;
  tags: string[];
  category: AssetCategory;
  createdAt: number;
}

export interface PanelVersion {
  id: string;
  panelId: string;
  name: string;
  fabricJson: string;
  thumbnail: Blob;
  createdAt: number;
}

export interface UserFont {
  id: string;
  name: string;
  family: string;
  mimeType: string;
  blob: Blob;
  createdAt: number;
}

export interface AutosaveMeta {
  id: string;
  lastSavedAt: number;
  dirty: boolean;
  schemaVersion: number;
}

export const SCHEMA_VERSION = 1;

export const DEFAULT_LAYOUT: LayoutSettings = {
  stripWidth: 690,
  panelGap: 16,
  pageWidth: 800,
  pageHeight: 1200,
  readingDirection: "ltr",
  templateId: "2x2",
};
