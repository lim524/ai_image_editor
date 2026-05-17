"use client";

import { useState } from "react";
import type { Episode, Panel, Project } from "@/lib/db/types";
import { exportPanelsZip, exportWebtoonStrip } from "@/lib/utils/export";
import { downloadBlob } from "@/lib/utils/backup";
import { db } from "@/lib/db/database";
import type { CanvasEditorHandle } from "./CanvasEditor";

interface ExportMenuProps {
  project: Project;
  episode: Episode;
  panels: Panel[];
  editorRef: React.RefObject<CanvasEditorHandle | null>;
}

export function ExportMenu({
  project,
  episode,
  panels,
  editorRef,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const renderPanel = async (panel: Panel): Promise<HTMLCanvasElement> => {
    const layers = await db.layers.where("panelId").equals(panel.id).toArray();
    const { Canvas: FabricCanvas } = await import("fabric");
    const el = document.createElement("canvas");
    const canvas = new FabricCanvas(el, {
      width: panel.width,
      height: panel.height,
      backgroundColor: panel.backgroundColor,
    });

    const { layersToFabric } = await import("@/lib/fabric/canvas-utils");
    await layersToFabric(canvas, layers, {
      width: panel.width,
      height: panel.height,
    });
    const result = canvas.toCanvasElement();
    canvas.dispose();
    return result;
  };

  const handleExportStrip = async () => {
    setExporting(true);
    try {
      const gap = episode.layoutSettings.panelGap ?? 16;
      const blob = await exportWebtoonStrip(panels, renderPanel, gap);
      downloadBlob(blob, `${project.title}_${episode.title}_strip.png`);
    } finally {
      setExporting(false);
      setOpen(false);
    }
  };

  const handleExportZip = async () => {
    setExporting(true);
    try {
      const blob = await exportPanelsZip(panels, (p) => renderPanel(p));
      downloadBlob(blob, `${project.title}_${episode.title}_panels.zip`);
    } finally {
      setExporting(false);
      setOpen(false);
    }
  };

  const handleExportCurrent = () => {
    const el = editorRef.current?.exportToCanvas();
    if (!el) return;
    el.toBlob((blob) => {
      if (blob) downloadBlob(blob, `panel_export.png`);
    }, "image/png");
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="text-sm px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-50"
      >
        {exporting ? "보내는 중…" : "보내기"}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 min-w-[180px]">
            <button
              type="button"
              onClick={handleExportCurrent}
              className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              현재 컷 PNG
            </button>
            {project.format === "webtoon" && (
              <button
                type="button"
                onClick={handleExportStrip}
                className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
              >
                세로 롱 이미지
              </button>
            )}
            <button
              type="button"
              onClick={handleExportZip}
              className="w-full text-left px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              전체 컷 ZIP
            </button>
          </div>
        </>
      )}
    </div>
  );
}
