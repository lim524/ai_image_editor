import { v4 as uuidv4 } from "uuid";
import { db } from "./database";
import type {
  Asset,
  AssetCategory,
  Episode,
  Layer,
  LayoutSettings,
  Panel,
  PanelVersion,
  Project,
  ProjectFormat,
} from "./types";
import { DEFAULT_LAYOUT, SCHEMA_VERSION } from "./types";
import { createThumbnail, getImageDimensions } from "../utils/thumbnail";
import {
  refreshProjectCover,
  scheduleProjectCoverRefresh,
} from "./project-cover";
import type { ProjectWithCover } from "./types";

type SaveStatus = "saved" | "saving" | "error" | "dirty";

let saveQueue: Promise<void> = Promise.resolve();
let saveStatusListeners: ((status: SaveStatus) => void)[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSaveFn: (() => Promise<void>) | null = null;

export function onSaveStatusChange(listener: (status: SaveStatus) => void) {
  saveStatusListeners.push(listener);
  return () => {
    saveStatusListeners = saveStatusListeners.filter((l) => l !== listener);
  };
}

function notifyStatus(status: SaveStatus) {
  saveStatusListeners.forEach((l) => l(status));
}

function enqueueSave(fn: () => Promise<void>): Promise<void> {
  saveQueue = saveQueue.then(fn).catch((err) => {
    console.error("Save failed:", err);
    notifyStatus("error");
  });
  return saveQueue;
}

async function runSave(fn: () => Promise<void>) {
  await fn();
  await db.autosave_meta.put({
    id: "global",
    lastSavedAt: Date.now(),
    dirty: false,
    schemaVersion: SCHEMA_VERSION,
  });
  notifyStatus("saved");
}

export function scheduleAutosave(fn: () => Promise<void>, delayMs = 2000) {
  notifyStatus("dirty");
  pendingSaveFn = fn;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    const toRun = pendingSaveFn;
    pendingSaveFn = null;
    if (!toRun) return;
    notifyStatus("saving");
    enqueueSave(() => runSave(toRun));
  }, delayMs);
}

/** 디바운스 대기 중인 저장을 즉시 실행 (탭 닫기·컷 전환 전) */
export async function flushPendingSave(): Promise<void> {
  if (debounceTimer && pendingSaveFn) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
    const toRun = pendingSaveFn;
    pendingSaveFn = null;
    notifyStatus("saving");
    await enqueueSave(() => runSave(toRun));
  }
  await saveQueue;
}

export async function saveLayersNow(
  panelId: string,
  layers: Layer[]
): Promise<void> {
  await flushPendingSave();
  await saveLayers(panelId, layers);
}

// --- Projects ---

export async function listProjects(): Promise<Project[]> {
  return db.projects.orderBy("updatedAt").reverse().toArray();
}

export async function listProjectsWithCovers(): Promise<ProjectWithCover[]> {
  const projects = await listProjects();
  return projects.map((p) => ({
    ...p,
    coverUrl: p.coverThumbnail
      ? URL.createObjectURL(p.coverThumbnail)
      : null,
  }));
}

export async function ensureProjectCovers(
  projects: Project[]
): Promise<void> {
  for (const p of projects) {
    if (!p.coverThumbnail) {
      refreshProjectCover(p.id).catch(console.error);
    }
  }
}

export async function getProjectIdForPanel(
  panelId: string
): Promise<string | null> {
  const panel = await db.panels.get(panelId);
  if (!panel) return null;
  const episode = await db.episodes.get(panel.episodeId);
  return episode?.projectId ?? null;
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id);
}

export type CreateProjectResult = { project: Project; episode: Episode };

export async function createProject(
  title: string,
  format: ProjectFormat,
  options?: { withDefaultPanel?: boolean }
): Promise<CreateProjectResult> {
  const now = Date.now();
  const project: Project = {
    id: uuidv4(),
    title,
    format,
    createdAt: now,
    updatedAt: now,
  };
  const episode: Episode = {
    id: uuidv4(),
    projectId: project.id,
    order: 0,
    title: "1화",
    layoutSettings: { ...DEFAULT_LAYOUT },
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction(
    "rw",
    [db.projects, db.episodes, db.panels, db.autosave_meta],
    async () => {
      await db.projects.add(project);
      await db.episodes.add(episode);
      if (options?.withDefaultPanel) {
        const defaultPanel: Panel = {
          id: uuidv4(),
          episodeId: episode.id,
          order: 0,
          title: "컷 1",
          width: format === "webtoon" ? 690 : 800,
          height: 400,
          backgroundColor: "#ffffff",
        };
        await db.panels.add(defaultPanel);
      }
    }
  );
  return { project, episode };
}

export async function updateProject(
  id: string,
  updates: Partial<Pick<Project, "title" | "format">>
): Promise<void> {
  await db.projects.update(id, { ...updates, updatedAt: Date.now() });
}

export async function deleteProject(id: string): Promise<void> {
  const episodes = await db.episodes.where("projectId").equals(id).toArray();
  const episodeIds = episodes.map((e) => e.id);
  const panels = await db.panels
    .where("episodeId")
    .anyOf(episodeIds)
    .toArray();
  const panelIds = panels.map((p) => p.id);

  await db.transaction(
    "rw",
    [
      db.projects,
      db.episodes,
      db.panels,
      db.layers,
      db.assets,
      db.panelVersions,
    ],
    async () => {
      await db.projects.delete(id);
      await db.episodes.where("projectId").equals(id).delete();
      if (episodeIds.length) {
        await db.panels.where("episodeId").anyOf(episodeIds).delete();
      }
      if (panelIds.length) {
        await db.layers.where("panelId").anyOf(panelIds).delete();
        await db.panelVersions.where("panelId").anyOf(panelIds).delete();
      }
      await db.assets.where("projectId").equals(id).delete();
    }
  );
}

// --- Episodes ---

export async function listEpisodes(projectId: string): Promise<Episode[]> {
  return db.episodes.where("projectId").equals(projectId).sortBy("order");
}

export async function getEpisode(id: string): Promise<Episode | undefined> {
  return db.episodes.get(id);
}

export async function createEpisode(
  projectId: string,
  title: string
): Promise<Episode> {
  const existing = await listEpisodes(projectId);
  const now = Date.now();
  const episode: Episode = {
    id: uuidv4(),
    projectId,
    order: existing.length,
    title,
    layoutSettings: { ...DEFAULT_LAYOUT },
    createdAt: now,
    updatedAt: now,
  };
  await db.episodes.add(episode);
  return episode;
}

export async function updateEpisodeLayout(
  id: string,
  layoutSettings: LayoutSettings
): Promise<void> {
  await db.episodes.update(id, { layoutSettings, updatedAt: Date.now() });
}

export async function touchEpisodeUpdated(episodeId: string): Promise<void> {
  await db.episodes.update(episodeId, { updatedAt: Date.now() });
}

// --- Panels ---

export async function listPanels(episodeId: string): Promise<Panel[]> {
  return db.panels.where("episodeId").equals(episodeId).sortBy("order");
}

export async function getPanel(id: string): Promise<Panel | undefined> {
  return db.panels.get(id);
}

export async function createPanel(
  episodeId: string,
  opts?: Partial<Pick<Panel, "width" | "height" | "backgroundColor" | "title">> & {
    insertAfterPanelId?: string | null;
  }
): Promise<Panel> {
  const existing = await listPanels(episodeId);

  let insertIndex = existing.length;
  if (opts?.insertAfterPanelId) {
    const afterIdx = existing.findIndex((p) => p.id === opts.insertAfterPanelId);
    if (afterIdx >= 0) insertIndex = afterIdx + 1;
  }

  const panel: Panel = {
    id: uuidv4(),
    episodeId,
    order: insertIndex,
    title: opts?.title ?? `컷 ${insertIndex + 1}`,
    width: opts?.width ?? 690,
    height: opts?.height ?? 400,
    backgroundColor: opts?.backgroundColor ?? "#ffffff",
  };

  const ordered = [...existing];
  ordered.splice(insertIndex, 0, panel);

  await db.transaction("rw", db.panels, async () => {
    await db.panels.add(panel);
    for (let i = 0; i < ordered.length; i++) {
      await db.panels.update(ordered[i].id, { order: i });
    }
  });

  return { ...panel, order: insertIndex };
}

export async function updatePanelTitle(
  id: string,
  title: string
): Promise<void> {
  await db.panels.update(id, { title: title.trim() || undefined });
}

export async function updatePanel(
  id: string,
  updates: Partial<Panel>
): Promise<void> {
  await db.panels.update(id, updates);
}

export async function reorderPanels(
  episodeId: string,
  orderedIds: string[]
): Promise<void> {
  await enqueueSave(async () => {
    await db.transaction("rw", db.panels, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db.panels.update(orderedIds[i], { order: i });
      }
    });
  });
}

export async function deletePanel(id: string): Promise<void> {
  await db.transaction("rw", [db.panels, db.layers, db.panelVersions], async () => {
    await db.layers.where("panelId").equals(id).delete();
    await db.panelVersions.where("panelId").equals(id).delete();
    await db.panels.delete(id);
  });
}

// --- Layers ---

export async function listLayers(panelId: string): Promise<Layer[]> {
  const layers = await db.layers.where("panelId").equals(panelId).toArray();
  return layers.sort((a, b) => a.zIndex - b.zIndex);
}

async function writeLayers(panelId: string, layers: Layer[]): Promise<void> {
  await db.transaction("rw", db.layers, async () => {
    const existing = await db.layers.where("panelId").equals(panelId).toArray();
    const newIds = new Set(layers.map((l) => l.id));
    const toDelete = existing.filter((l) => !newIds.has(l.id)).map((l) => l.id);
    if (toDelete.length) await db.layers.bulkDelete(toDelete);
    if (layers.length) await db.layers.bulkPut(layers);
  });
  const projectId = await getProjectIdForPanel(panelId);
  if (projectId) scheduleProjectCoverRefresh(projectId);
}

/** 수동 저장: 디바운스 없이 즉시 DB 반영 */
export async function savePanelLayersImmediate(
  panelId: string,
  layers: Layer[]
): Promise<void> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
    pendingSaveFn = null;
  }
  notifyStatus("saving");
  await enqueueSave(async () => {
    await writeLayers(panelId, layers);
    await db.autosave_meta.put({
      id: "global",
      lastSavedAt: Date.now(),
      dirty: false,
      schemaVersion: SCHEMA_VERSION,
    });
    notifyStatus("saved");
  });
  await saveQueue;
}

export async function saveLayers(panelId: string, layers: Layer[]): Promise<void> {
  await enqueueSave(() => writeLayers(panelId, layers));
}

export function scheduleLayerSave(panelId: string, layers: Layer[]) {
  // runSave 안에서 saveLayers()를 호출하면 enqueueSave가 중첩되어 데드락 → writeLayers 직접 호출
  scheduleAutosave(() => writeLayers(panelId, layers));
}

// --- Assets ---

export async function listAssets(projectId: string): Promise<Asset[]> {
  const assets = await db.assets
    .where("projectId")
    .equals(projectId)
    .toArray();
  return assets.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAsset(id: string): Promise<Asset | undefined> {
  return db.assets.get(id);
}

export async function createAssetFromFile(
  projectId: string,
  file: File,
  category: AssetCategory = "other",
  name?: string
): Promise<Asset> {
  const { width, height } = await getImageDimensions(file);
  const { thumbnail } = await createThumbnail(file);
  const asset: Asset = {
    id: uuidv4(),
    projectId,
    name: name ?? file.name,
    mimeType: file.type || "image/png",
    width,
    height,
    blob: file,
    thumbnail,
    tags: [],
    category,
    createdAt: Date.now(),
  };
  await db.assets.add(asset);
  scheduleProjectCoverRefresh(projectId);
  return asset;
}

export async function updateAsset(
  id: string,
  updates: Partial<Pick<Asset, "name" | "tags" | "category">>
): Promise<void> {
  await db.assets.update(id, updates);
}

export async function deleteAsset(id: string): Promise<void> {
  await db.assets.delete(id);
}

// --- Panel versions (history) ---

export async function listPanelVersions(panelId: string): Promise<PanelVersion[]> {
  const versions = await db.panelVersions
    .where("panelId")
    .equals(panelId)
    .toArray();
  return versions.sort((a, b) => b.createdAt - a.createdAt);
}

export async function savePanelVersion(
  panelId: string,
  name: string,
  fabricJson: string,
  thumbnail: Blob
): Promise<PanelVersion> {
  const version: PanelVersion = {
    id: uuidv4(),
    panelId,
    name,
    fabricJson,
    thumbnail,
    createdAt: Date.now(),
  };
  await db.panelVersions.add(version);
  const all = await listPanelVersions(panelId);
  if (all.length > 20) {
    const toDelete = all.slice(20);
    await db.panelVersions.bulkDelete(toDelete.map((v) => v.id));
  }
  return version;
}

export async function restorePanelVersion(versionId: string): Promise<PanelVersion | undefined> {
  return db.panelVersions.get(versionId);
}
