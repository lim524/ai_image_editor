import JSZip from "jszip";
import type { Episode, Panel, Project } from "../db/types";
import { listLayers } from "../db/persistence";
import { getAsset } from "../db/persistence";

export async function exportPanelPng(
  renderCanvas: HTMLCanvasElement
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    renderCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Export failed"))),
      "image/png"
    );
  });
}

export async function exportWebtoonStrip(
  panels: Panel[],
  renderPanel: (panel: Panel) => Promise<HTMLCanvasElement>,
  gap: number
): Promise<Blob> {
  const canvases: HTMLCanvasElement[] = [];
  for (const panel of panels) {
    canvases.push(await renderPanel(panel));
  }

  const width = Math.max(...canvases.map((c) => c.width));
  const totalHeight =
    canvases.reduce((sum, c) => sum + c.height, 0) +
    gap * Math.max(0, canvases.length - 1);

  const strip = document.createElement("canvas");
  strip.width = width;
  strip.height = totalHeight;
  const ctx = strip.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, totalHeight);

  let y = 0;
  for (const canvas of canvases) {
    const x = Math.floor((width - canvas.width) / 2);
    ctx.drawImage(canvas, x, y);
    y += canvas.height + gap;
  }

  return exportPanelPng(strip);
}

export async function exportPanelsZip(
  panels: Panel[],
  renderPanel: (panel: Panel, index: number) => Promise<HTMLCanvasElement>
): Promise<Blob> {
  const zip = new JSZip();
  for (let i = 0; i < panels.length; i++) {
    const canvas = await renderPanel(panels[i], i);
    const blob = await exportPanelPng(canvas);
    zip.file(`panel_${String(i + 1).padStart(3, "0")}.png`, blob);
  }
  return zip.generateAsync({ type: "blob" });
}

export async function loadFabricJsonWithAssets(
  fabricJson: string
): Promise<string> {
  const parsed = JSON.parse(fabricJson);
  if (!parsed.objects) return fabricJson;

  for (const obj of parsed.objects) {
    if (obj.assetId) {
      const asset = await getAsset(obj.assetId);
      if (asset) {
        obj.src = URL.createObjectURL(asset.blob);
      }
    }
  }
  return JSON.stringify(parsed);
}
