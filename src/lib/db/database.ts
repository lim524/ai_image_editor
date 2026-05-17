import Dexie, { type Table } from "dexie";
import type {
  Asset,
  AutosaveMeta,
  Episode,
  Layer,
  Panel,
  PanelVersion,
  Project,
  UserFont,
} from "./types";

export class WebtoonDatabase extends Dexie {
  projects!: Table<Project, string>;
  episodes!: Table<Episode, string>;
  panels!: Table<Panel, string>;
  layers!: Table<Layer, string>;
  assets!: Table<Asset, string>;
  panelVersions!: Table<PanelVersion, string>;
  autosave_meta!: Table<AutosaveMeta, string>;
  user_fonts!: Table<UserFont, string>;

  constructor() {
    super("ai_webtoon_db");

    this.version(1).stores({
      projects: "id, updatedAt",
      episodes: "id, projectId, order",
      panels: "id, episodeId, order",
      layers: "id, panelId, zIndex",
      assets: "id, projectId, category, createdAt",
      panelVersions: "id, panelId, createdAt",
      autosave_meta: "id",
    });

    this.version(2).stores({
      projects: "id, updatedAt, coverUpdatedAt",
      episodes: "id, projectId, order",
      panels: "id, episodeId, order",
      layers: "id, panelId, zIndex",
      assets: "id, projectId, category, createdAt",
      panelVersions: "id, panelId, createdAt",
      autosave_meta: "id",
    });

    this.version(3).stores({
      projects: "id, updatedAt, coverUpdatedAt",
      episodes: "id, projectId, order",
      panels: "id, episodeId, order",
      layers: "id, panelId, zIndex",
      assets: "id, projectId, category, createdAt",
      panelVersions: "id, panelId, createdAt",
      autosave_meta: "id",
      user_fonts: "id, createdAt",
    });
  }
}

export const db = new WebtoonDatabase();
