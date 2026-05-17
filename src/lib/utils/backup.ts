import JSZip from "jszip";
import { db } from "../db/database";
import type {
  Asset,
  Episode,
  Layer,
  Panel,
  PanelVersion,
  Project,
} from "../db/types";
import { SCHEMA_VERSION } from "../db/types";

interface BackupManifest {
  schemaVersion: number;
  exportedAt: number;
  projects: Project[];
  episodes: Episode[];
  panels: Panel[];
  layers: Layer[];
  assets: Array<Omit<Asset, "blob" | "thumbnail"> & { blobFile: string; thumbFile: string }>;
  panelVersions: Array<
    Omit<PanelVersion, "thumbnail"> & { thumbFile: string }
  >;
}

export async function exportProjectBackup(projectId: string): Promise<Blob> {
  const project = await db.projects.get(projectId);
  if (!project) throw new Error("Project not found");

  const episodes = await db.episodes.where("projectId").equals(projectId).toArray();
  const episodeIds = episodes.map((e) => e.id);
  const panels = episodeIds.length
    ? await db.panels.where("episodeId").anyOf(episodeIds).toArray()
    : [];
  const panelIds = panels.map((p) => p.id);
  const layers = panelIds.length
    ? await db.layers.where("panelId").anyOf(panelIds).toArray()
    : [];
  const assets = await db.assets.where("projectId").equals(projectId).toArray();
  const panelVersions = panelIds.length
    ? await db.panelVersions.where("panelId").anyOf(panelIds).toArray()
    : [];

  const zip = new JSZip();
  const assetsFolder = zip.folder("assets")!;
  const thumbsFolder = zip.folder("thumbs")!;

  const manifestAssets: BackupManifest["assets"] = [];
  for (const asset of assets) {
    const blobFile = `assets/${asset.id}`;
    const thumbFile = `thumbs/${asset.id}`;
    assetsFolder.file(asset.id, asset.blob);
    thumbsFolder.file(asset.id, asset.thumbnail);
    const { blob: _b, thumbnail: _t, ...meta } = asset;
    manifestAssets.push({ ...meta, blobFile, thumbFile });
  }

  const manifestVersions: BackupManifest["panelVersions"] = [];
  for (const ver of panelVersions) {
    const thumbFile = `version_thumbs/${ver.id}`;
    thumbsFolder.file(`version_${ver.id}`, ver.thumbnail);
    const { thumbnail: _t, ...meta } = ver;
    manifestVersions.push({ ...meta, thumbFile });
  }

  const manifest: BackupManifest = {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: Date.now(),
    projects: [project],
    episodes,
    panels,
    layers,
    assets: manifestAssets,
    panelVersions: manifestVersions,
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  return zip.generateAsync({ type: "blob" });
}

export async function importProjectBackup(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const manifestFile = zip.file("manifest.json");
  if (!manifestFile) throw new Error("Invalid backup: missing manifest.json");

  const manifest: BackupManifest = JSON.parse(await manifestFile.async("string"));
  if (!manifest.projects?.length) throw new Error("Invalid backup: no projects");

  const project = manifest.projects[0];

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
      await db.projects.put(project);

      for (const ep of manifest.episodes) {
        await db.episodes.put(ep);
      }
      for (const panel of manifest.panels) {
        await db.panels.put(panel);
      }
      for (const layer of manifest.layers) {
        await db.layers.put(layer);
      }

      for (const assetMeta of manifest.assets) {
        const blobEntry = zip.file(assetMeta.blobFile.replace("assets/", "assets/"));
        const thumbEntry = zip.file(assetMeta.thumbFile);
        const blobPath = `assets/${assetMeta.id}`;
        const thumbPath = `thumbs/${assetMeta.id}`;
        const blobFile = zip.file(blobPath) ?? zip.file(assetMeta.blobFile);
        const thumbFile = zip.file(thumbPath) ?? zip.file(assetMeta.thumbFile);

        if (!blobFile || !thumbFile) continue;

        const blob = await blobFile.async("blob");
        const thumbnail = await thumbFile.async("blob");
        const { blobFile: _bf, thumbFile: _tf, ...rest } = assetMeta;
        await db.assets.put({ ...rest, blob, thumbnail });
      }

      for (const verMeta of manifest.panelVersions ?? []) {
        const thumbFile =
          zip.file(`thumbs/version_${verMeta.id}`) ??
          zip.file(verMeta.thumbFile);
        if (!thumbFile) continue;
        const thumbnail = await thumbFile.async("blob");
        const { thumbFile: _tf, ...rest } = verMeta;
        await db.panelVersions.put({ ...rest, thumbnail });
      }
    }
  );

  return project.id;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
