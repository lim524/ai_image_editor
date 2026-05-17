import { db } from "./database";
import type { ProjectFormat } from "./types";
import { createThumbnail } from "../utils/thumbnail";

let coverRefreshQueue: Promise<void> = Promise.resolve();
const coverDebounce = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleProjectCoverRefresh(
  projectId: string,
  delayMs = 5000
) {
  const existing = coverDebounce.get(projectId);
  if (existing) clearTimeout(existing);
  coverDebounce.set(
    projectId,
    setTimeout(() => {
      coverDebounce.delete(projectId);
      coverRefreshQueue = coverRefreshQueue
        .then(() => refreshProjectCover(projectId))
        .catch(console.error);
    }, delayMs)
  );
}

export async function refreshProjectCover(projectId: string): Promise<void> {
  const project = await db.projects.get(projectId);
  if (!project) return;

  const blob = await findCoverSourceBlob(projectId);
  if (!blob) return;

  const { thumbnail } = await createThumbnail(blob, 400);
  await db.projects.update(projectId, {
    coverThumbnail: thumbnail,
    coverUpdatedAt: Date.now(),
  });
}

async function findCoverSourceBlob(projectId: string): Promise<Blob | null> {
  const episodes = await db.episodes
    .where("projectId")
    .equals(projectId)
    .toArray();
  if (!episodes.length) {
    return latestAssetThumbnail(projectId);
  }

  episodes.sort((a, b) => b.updatedAt - a.updatedAt);
  const latestEpisode = episodes[0];

  const panels = await db.panels
    .where("episodeId")
    .equals(latestEpisode.id)
    .toArray();
  panels.sort((a, b) => a.order - b.order);

  for (const panel of panels) {
    const layers = await db.layers.where("panelId").equals(panel.id).toArray();
    layers.sort((a, b) => a.zIndex - b.zIndex);
    for (const layer of layers) {
      if (layer.type === "image" && layer.assetId) {
        const asset = await db.assets.get(layer.assetId);
        if (asset) return asset.thumbnail ?? asset.blob;
      }
    }
  }

  return latestAssetThumbnail(projectId);
}

async function latestAssetThumbnail(projectId: string): Promise<Blob | null> {
  const assets = await db.assets
    .where("projectId")
    .equals(projectId)
    .toArray();
  if (!assets.length) return null;
  assets.sort((a, b) => b.createdAt - a.createdAt);
  return assets[0].thumbnail ?? assets[0].blob;
}

export function getPlaceholderCoverUrl(format: ProjectFormat): string {
  const grad =
    format === "webtoon"
      ? "linear-gradient(135deg,#4c1d95 0%,#7c3aed 50%,#a78bfa 100%)"
      : "linear-gradient(135deg,#1e3a5f 0%,#3b82f6 50%,#93c5fd 100%)";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${format === "webtoon" ? "#4c1d95" : "#1e3a5f"}"/>
      <stop offset="100%" style="stop-color:${format === "webtoon" ? "#a78bfa" : "#93c5fd"}"/>
    </linearGradient></defs>
    <rect width="400" height="225" fill="url(#g)"/>
    <text x="200" y="120" text-anchor="middle" fill="white" font-size="48" opacity="0.5" font-family="sans-serif">${format === "webtoon" ? "W" : "M"}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg.replace(grad, ""))}`;
}
