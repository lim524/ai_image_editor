import { v4 as uuidv4 } from "uuid";
import type { Layer, Panel } from "@/lib/db/types";
import { getPanelSizeForImage } from "@/lib/fabric/canvas-utils";
import {
  createAssetFromFile,
  createEpisode,
  createPanel,
  createProject,
  listEpisodes,
  savePanelLayersImmediate,
  touchEpisodeUpdated,
} from "@/lib/db/persistence";

export function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    target.isContentEditable
  );
}

export function imageFilesFromDataTransfer(dt: DataTransfer): File[] {
  return Array.from(dt.files).filter((f) => f.type.startsWith("image/"));
}

export function imageFilesFromClipboard(
  items: DataTransferItemList
): File[] {
  const files: File[] = [];
  for (const item of Array.from(items)) {
    if (!item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (file) files.push(file);
  }
  return files;
}

function buildImageLayer(
  panelId: string,
  assetId: string,
  panelWidth: number,
  panelHeight: number,
  imageWidth: number,
  imageHeight: number
): Layer {
  const ow = imageWidth || 1;
  const oh = imageHeight || 1;
  const obj = {
    type: "Image",
    version: "6.0.0",
    left: 0,
    top: 0,
    width: ow,
    height: oh,
    scaleX: panelWidth / ow,
    scaleY: panelHeight / oh,
    originX: "left",
    originY: "top",
    assetId,
    data: { layerType: "image", assetId },
  };
  return {
    id: uuidv4(),
    panelId,
    type: "image",
    zIndex: 0,
    fabricJson: JSON.stringify({ version: "6.0.0", objects: [obj] }),
    assetId,
    locked: false,
  };
}

/** 이미지 파일로 컷을 만들고 레이어까지 저장 */
export async function importImageAsPanel(
  projectId: string,
  episodeId: string,
  file: File,
  options?: {
    insertAfterPanelId?: string | null;
    title?: string;
    fromClipboard?: boolean;
  }
): Promise<Panel> {
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const asset = await createAssetFromFile(
    projectId,
    file,
    "other",
    options?.title ?? baseName
  );
  const panelSize = await getPanelSizeForImage(file, {
    fromClipboard: options?.fromClipboard,
  });
  const { width, height, bitmapWidth, bitmapHeight } = panelSize;
  const panel = await createPanel(episodeId, {
    width,
    height,
    title: options?.title ?? (baseName || undefined),
    insertAfterPanelId: options?.insertAfterPanelId ?? null,
  });
  const layer = buildImageLayer(
    panel.id,
    asset.id,
    width,
    height,
    bitmapWidth,
    bitmapHeight
  );
  await savePanelLayersImmediate(panel.id, [layer]);
  await touchEpisodeUpdated(episodeId);
  return panel;
}

/** 홈에서 이미지(들)로 새 프로젝트 + 1화 + 컷 생성 */
export async function createProjectFromImages(
  files: File[],
  fromClipboard = false
): Promise<{
  projectId: string;
  episodeId: string;
}> {
  if (files.length === 0) throw new Error("no image files");
  const first = files[0];
  const baseName = first.name.replace(/\.[^.]+$/, "") || "제목 없음";
  const { project, episode } = await createProject(baseName, "webtoon", {
    withDefaultPanel: false,
  });
  let afterId: string | null = null;
  for (const file of files) {
    const panel = await importImageAsPanel(project.id, episode.id, file, {
      insertAfterPanelId: afterId,
      fromClipboard,
    });
    afterId = panel.id;
  }
  return { projectId: project.id, episodeId: episode.id };
}

/** 기존 프로젝트의 첫 화 ID (없으면 생성) */
export async function getOrCreateDefaultEpisode(
  projectId: string
): Promise<string> {
  const episodes = await listEpisodes(projectId);
  if (episodes.length > 0) return episodes[0].id;
  const ep = await createEpisode(projectId, "1화");
  return ep.id;
}
