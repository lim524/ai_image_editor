import type { Canvas, FabricObject } from "fabric";
import type { Layer } from "@/lib/db/types";
import { getAsset } from "@/lib/db/persistence";
import { getImageDimensions } from "@/lib/utils/thumbnail";
import { normalizeLogicalPixelDimensions } from "@/lib/utils/image-dimensions";
import { initFabricCustomProps } from "./init";

const FABRIC_PROPS = ["assetId", "data", "selectable", "evented"] as const;

function isFabricImage(obj: FabricObject): boolean {
  return obj.type === "image" || obj.type === "Image";
}

/** 이미지 객체를 패널 픽셀 크기에 1:1로 맞춤 (저장된 width/scale 불일치 보정) */
export function applyImageNaturalFit(
  obj: FabricObject,
  panelWidth: number,
  panelHeight: number
): void {
  if (!isFabricImage(obj)) return;
  const img = obj as FabricObject & {
    getOriginalSize?: () => { width: number; height: number };
  };
  const orig = img.getOriginalSize?.() ?? {
    width: img.width ?? panelWidth,
    height: img.height ?? panelHeight,
  };
  const ow = orig.width || 1;
  const oh = orig.height || 1;
  img.set({
    left: 0,
    top: 0,
    scaleX: panelWidth / ow,
    scaleY: panelHeight / oh,
  });
  img.setCoords();
}

export function syncCanvasImagesToPanel(
  canvas: Canvas,
  panelWidth: number,
  panelHeight: number
): void {
  for (const obj of canvas.getObjects()) {
    if (isFabricImage(obj)) {
      applyImageNaturalFit(obj, panelWidth, panelHeight);
    }
  }
}

export async function layersToFabric(
  canvas: Canvas,
  layers: Layer[],
  panelSize?: { width: number; height: number; backgroundColor?: string }
): Promise<void> {
  await initFabricCustomProps();
  canvas.clear();
  const bg = panelSize?.backgroundColor;
  canvas.backgroundColor =
    !bg || bg === "transparent" ? "rgba(0,0,0,0)" : bg;

  const panelWidth = panelSize?.width ?? canvas.width ?? 690;
  const panelHeight = panelSize?.height ?? canvas.height ?? 400;

  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of sorted) {
    if (!layer.fabricJson) continue;
    try {
      const enriched = await enrichFabricJson(layer.fabricJson, layer.assetId);
      const objects = await loadObjectsFromJson(enriched, panelWidth, panelHeight);
      for (const obj of objects) {
        if (layer.assetId) {
          (obj as FabricObject & { assetId?: string }).assetId = layer.assetId;
        }
        if (isFabricImage(obj)) {
          applyImageNaturalFit(obj, panelWidth, panelHeight);
        }
        obj.set({ selectable: !layer.locked, evented: !layer.locked });
        canvas.add(obj);
      }
    } catch (e) {
      console.warn("Failed to load layer", layer.id, e);
    }
  }
  canvas.requestRenderAll();
}

async function enrichFabricJson(
  json: string,
  layerAssetId?: string
): Promise<string> {
  const parsed = JSON.parse(json);
  if (!parsed.objects) return json;

  for (const obj of parsed.objects) {
    const assetId = obj.assetId ?? layerAssetId;
    if (!assetId) {
      if (typeof obj.src === "string" && obj.src.startsWith("blob:")) {
        delete obj.src;
      }
      continue;
    }
    obj.assetId = assetId;
    if (typeof obj.src === "string" && obj.src.startsWith("blob:")) {
      delete obj.src;
    }
    const asset = await getAsset(assetId);
    if (asset) {
      obj.src = URL.createObjectURL(asset.blob);
    }
  }
  return JSON.stringify(parsed);
}

async function loadObjectsFromJson(
  json: string,
  panelWidth: number,
  panelHeight: number
): Promise<FabricObject[]> {
  await initFabricCustomProps();
  const { util, FabricImage } = await import("fabric");
  const parsed = JSON.parse(json);
  if (!parsed.objects?.length) return [];

  const normalized = parsed.objects.map((raw: Record<string, unknown>) => {
    if (raw.type === "image") return { ...raw, type: "Image" };
    return raw;
  });

  const result = await util.enlivenObjects<FabricObject>(normalized);

  const restored: FabricObject[] = [];
  for (let i = 0; i < normalized.length; i++) {
    const obj = result[i];
    const raw = normalized[i] as Record<string, unknown>;
    if (obj) {
      restored.push(obj);
      continue;
    }
    const isImage =
      raw.type === "image" ||
      raw.type === "Image" ||
      typeof raw.src === "string";
    if (isImage && typeof raw.src === "string" && raw.src) {
      try {
        const img = await FabricImage.fromURL(raw.src as string, {
          crossOrigin: "anonymous",
        });
        if (raw.assetId) {
          (img as FabricObject & { assetId?: string }).assetId =
            raw.assetId as string;
        }
        applyImageNaturalFit(img, panelWidth, panelHeight);
        restored.push(img);
      } catch (e) {
        console.warn("Image fallback load failed", e);
      }
    }
  }
  return restored;
}

export function fabricToLayers(
  canvas: Canvas,
  panelId: string,
  existingLayers: Layer[]
): Layer[] {
  const objects = canvas.getObjects();
  return objects.map((obj, index) => {
    const data = (obj as FabricObject & { data?: Record<string, unknown> }).data;
    const layerType =
      (data?.layerType as Layer["type"]) ??
      (obj.type === "i-text" || obj.type === "text"
        ? data?.layerType === "sfx"
          ? "sfx"
          : "text"
        : "image");

    const objAssetId = (obj as FabricObject & { assetId?: string }).assetId;

    const serialized = obj.toObject([...FABRIC_PROPS]) as Record<string, unknown>;
    if (objAssetId) serialized.assetId = objAssetId;
    if (data) serialized.data = data;
    // assetId가 있으면 src(거대한 blob/data URL)는 DB에 넣지 않음 → 저장 속도·용량 개선
    if (objAssetId || layerType === "image") {
      delete serialized.src;
    }

    const json = JSON.stringify({
      version: "6.0.0",
      objects: [serialized],
    });

    const prevLayer = existingLayers[index];
    const stableId = prevLayer?.id ?? crypto.randomUUID();

    return {
      id: stableId,
      panelId,
      type: layerType,
      zIndex: index,
      fabricJson: json,
      assetId: objAssetId ?? prevLayer?.assetId,
      locked: !obj.selectable,
    };
  });
}

export const PANEL_WIDTH_MIN = 100;
export const PANEL_WIDTH_MAX = 4000;
export const PANEL_HEIGHT_MIN = 100;
export const PANEL_HEIGHT_MAX = 8000;

export function clampPanelSize(width: number, height: number): {
  width: number;
  height: number;
} {
  return {
    width: Math.max(PANEL_WIDTH_MIN, Math.min(PANEL_WIDTH_MAX, Math.round(width))),
    height: Math.max(PANEL_HEIGHT_MIN, Math.min(PANEL_HEIGHT_MAX, Math.round(height))),
  };
}

/** 파일 픽셀 크기. 클립보드는 NovelAI 표시 해상도에 맞게 보정 가능 */
export async function getImageNaturalSize(
  blob: Blob,
  options?: { fromClipboard?: boolean }
): Promise<{ width: number; height: number }> {
  const { width, height } = await getImageDimensions(blob);
  const normalized = normalizeLogicalPixelDimensions(
    width,
    height,
    options?.fromClipboard ?? false
  );
  return normalized;
}

/** 패널(컷) 크기 — 클립보드는 파일 픽셀 그대로, 로컬 파일은 필요 시 보정 */
export async function getPanelSizeForImage(
  blob: Blob,
  options?: { fromClipboard?: boolean }
): Promise<{ width: number; height: number; bitmapWidth: number; bitmapHeight: number }> {
  const bitmap = await getImageDimensions(blob);
  const logical = options?.fromClipboard
    ? { width: bitmap.width, height: bitmap.height }
    : normalizeLogicalPixelDimensions(bitmap.width, bitmap.height, false);
  const clamped = clampPanelSize(logical.width, logical.height);
  return {
    ...clamped,
    bitmapWidth: clamped.width,
    bitmapHeight: clamped.height,
  };
}

/**
 * 캔버스 표시 배율 — 기본 100%(1px=1px), 화면보다 클 때만 축소.
 * 이전에는 뷰포트에 맞추며 1배 초과 확대되어 NovelAI 대비 컷이 크게 보였음.
 */
export function fitCanvasToViewport(
  canvas: Canvas,
  panelWidth: number,
  panelHeight: number,
  containerWidth: number,
  containerHeight: number,
  padding = 32
): number {
  const availW = Math.max(1, containerWidth - padding);
  const availH = Math.max(1, containerHeight - padding);
  const zoom = Math.min(
    1,
    availW / panelWidth,
    availH / panelHeight
  );

  canvas.setDimensions({ width: panelWidth, height: panelHeight });
  canvas.setZoom(zoom);
  canvas.setDimensions(
    { width: `${panelWidth * zoom}px`, height: `${panelHeight * zoom}px` },
    { cssOnly: true }
  );
  canvas.calcOffset();
  canvas.requestRenderAll();
  return zoom;
}

export async function addImageFromAsset(
  canvas: Canvas,
  assetId: string,
  blob: Blob,
  options?: { naturalSize?: boolean }
): Promise<FabricObject> {
  await initFabricCustomProps();
  const { FabricImage } = await import("fabric");
  const url = URL.createObjectURL(blob);
  const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" });
  URL.revokeObjectURL(url);

  const cw = canvas.width ?? 690;
  const ch = canvas.height ?? 400;

  if (options?.naturalSize) {
    applyImageNaturalFit(img, cw, ch);
  } else {
    const orig = (
      img as FabricObject & {
        getOriginalSize?: () => { width: number; height: number };
      }
    ).getOriginalSize?.() ?? {
      width: img.width ?? cw,
      height: img.height ?? ch,
    };
    const ow = orig.width || cw;
    const oh = orig.height || ch;
    const maxW = cw * 0.9;
    const scale = Math.min(1, maxW / ow);
    img.set({
      left: (cw - ow * scale) / 2,
      top: (ch - oh * scale) / 2,
      scaleX: scale,
      scaleY: scale,
    });
  }
  (img as FabricObject & { assetId?: string }).assetId = assetId;
  (img as FabricObject & { data?: Record<string, unknown> }).data = {
    layerType: "image",
    assetId,
  };

  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.requestRenderAll();
  return img;
}

export async function applyCanvasFilters(
  canvas: Canvas,
  brightness: number,
  contrast: number,
  saturation: number
) {
  const { filters } = await import("fabric");
  const objects = canvas.getObjects().filter(
    (o) =>
      (o as FabricObject & { data?: { layerType?: string } }).data
        ?.layerType === "image"
  );

  for (const obj of objects) {
    const img = obj as FabricObject & {
      filters?: unknown[];
      applyFilters?: () => void;
    };
    const filterList = [];
    if (brightness !== 0)
      filterList.push(new filters.Brightness({ brightness: brightness / 100 }));
    if (contrast !== 0)
      filterList.push(new filters.Contrast({ contrast: contrast / 100 }));
    if (saturation !== 0)
      filterList.push(
        new filters.Saturation({ saturation: saturation / 100 })
      );
    img.filters = filterList;
    img.applyFilters?.();
  }
  canvas.requestRenderAll();
}

export const CANVAS_SNAPSHOT_PROPS = [...FABRIC_PROPS, "data"] as const;

export function captureCanvasSnapshot(canvas: Canvas): string {
  const objects = canvas.getObjects().map((obj) =>
    obj.toObject([...CANVAS_SNAPSHOT_PROPS])
  );
  return JSON.stringify({
    version: "6.0.0",
    objects,
  });
}

export async function restoreCanvasSnapshot(
  canvas: Canvas,
  snapshot: string,
  panelId: string,
  existingLayers: Layer[]
): Promise<Layer[]> {
  const parsed = JSON.parse(snapshot) as {
    version?: string;
    objects?: Record<string, unknown>[];
  };
  const objects = parsed.objects ?? [];
  const version = parsed.version ?? "6.0.0";

  const layers: Layer[] = objects.map((obj, i) => {
    const data = obj.data as Record<string, unknown> | undefined;
    let type: Layer["type"] = "image";
    if (
      data?.layerType === "text" ||
      obj.type === "i-text" ||
      obj.type === "text"
    ) {
      type = data?.layerType === "sfx" ? "sfx" : "text";
    } else if (data?.layerType === "bubble" || obj.type === "group") {
      type = "bubble";
    }

    return {
      id: existingLayers[i]?.id ?? crypto.randomUUID(),
      panelId,
      type,
      zIndex: i,
      fabricJson: JSON.stringify({ version, objects: [obj] }),
      assetId: (obj.assetId as string | undefined) ?? existingLayers[i]?.assetId,
      locked: obj.selectable === false,
    };
  });

  await layersToFabric(canvas, layers, {
    width: canvas.width ?? 690,
    height: canvas.height ?? 400,
  });
  return fabricToLayers(canvas, panelId, existingLayers);
}
