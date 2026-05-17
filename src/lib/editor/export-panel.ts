import type { Panel } from "@/lib/db/types";
import { listLayers } from "@/lib/db/persistence";
import { layersToFabric } from "@/lib/fabric/canvas-utils";

export async function renderPanelToCanvas(
  panel: Panel
): Promise<HTMLCanvasElement> {
  const layers = await listLayers(panel.id);
  const { Canvas: FabricCanvas } = await import("fabric");
  const el = document.createElement("canvas");
  const bg =
    !panel.backgroundColor || panel.backgroundColor === "transparent"
      ? "rgba(0,0,0,0)"
      : panel.backgroundColor;
  const canvas = new FabricCanvas(el, {
    width: panel.width,
    height: panel.height,
    backgroundColor: bg,
  });
  await layersToFabric(canvas, layers, {
    width: panel.width,
    height: panel.height,
    backgroundColor: panel.backgroundColor,
  });
  const result = canvas.toCanvasElement();
  canvas.dispose();
  return result;
}
