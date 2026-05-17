"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasEditorHandle } from "./CanvasEditor";
import { ToolsSidebar } from "./ToolsSidebar";
import { ContextPropertiesBar } from "./ContextPropertiesBar";
import { ImageGallerySidebar } from "./ImageGallerySidebar";
import { SaveStatus } from "@/components/ui/SaveStatus";
import type { Episode, Layer, Panel, Project } from "@/lib/db/types";
import {
  deletePanel,
  flushPendingSave,
  getProject,
  listLayers,
  listPanels,
  savePanelLayersImmediate,
  touchEpisodeUpdated,
  updatePanel,
  updateProject,
} from "@/lib/db/persistence";
import { getOrCreateDefaultEpisode } from "@/lib/editor/image-import";
import { clampPanelSize } from "@/lib/fabric/canvas-utils";
import { renderPanelToCanvas } from "@/lib/editor/export-panel";
import { exportPanelPng, exportPanelsZip } from "@/lib/utils/export";
import { downloadBlob } from "@/lib/utils/backup";
import { useEditorStore } from "@/stores/editorStore";
import { hydrateUserFonts } from "@/lib/fonts/user-fonts";
import {
  imageFilesFromClipboard,
  imageFilesFromDataTransfer,
  importImageAsPanel,
  isEditableEventTarget,
} from "@/lib/editor/image-import";
import { ImageImportZone } from "./ImageImportZone";

const CanvasEditor = dynamic(
  () => import("./CanvasEditor").then((m) => m.CanvasEditor),
  { ssr: false, loading: () => <div className="p-8 text-zinc-500">캔버스 로딩…</div> }
);

interface EditorWorkspaceProps {
  projectId: string;
}

export function EditorWorkspace({ projectId }: EditorWorkspaceProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [layersEpoch, setLayersEpoch] = useState(0);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const editorRef = useRef<CanvasEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const panelId = useEditorStore((s) => s.panelId);
  const setProjectStore = useEditorStore((s) => s.setProject);
  const setEpisodeStore = useEditorStore((s) => s.setEpisode);
  const setPanel = useEditorStore((s) => s.setPanel);
  const setPanelsStore = useEditorStore((s) => s.setPanels);
  const selectedObjectType = useEditorStore((s) => s.selectedObjectType);
  const propertiesExpanded =
    selectedObjectType === "text" ||
    selectedObjectType === "bubble" ||
    selectedObjectType === "sfx" ||
    selectedObjectType === "image";

  const activePanel = panels.find((p) => p.id === panelId) ?? panels[0];
  const episodeId = episode?.id;

  const loadData = useCallback(async () => {
    setLayers([]);
    setPanel(null);

    const epId = await getOrCreateDefaultEpisode(projectId);
    const { getEpisode } = await import("@/lib/db/persistence");
    const [proj, ep, panelList] = await Promise.all([
      getProject(projectId),
      getEpisode(epId),
      listPanels(epId),
    ]);
    if (!proj || !ep) return;

    const storedPanelId = useEditorStore.getState().panelId;
    const targetPanel =
      panelList.find((p) => p.id === storedPanelId) ?? panelList[0] ?? null;
    const layerList = targetPanel ? await listLayers(targetPanel.id) : [];

    setProject(proj);
    setEpisode(ep);
    setPanels(panelList);
    setPanelsStore(panelList);
    setProjectStore(projectId, proj.format);
    setEpisodeStore(epId);
    setLayers(layerList);
    setPanel(targetPanel?.id ?? null);
    setLayersEpoch((e) => e + 1);
  }, [projectId, setProjectStore, setEpisodeStore, setPanel, setPanelsStore]);

  useEffect(() => {
    void hydrateUserFonts();
    void loadData();
    return () => {
      void flushPendingSave();
    };
  }, [loadData]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableEventTarget(e.target)) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        editorRef.current?.deleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        editorRef.current?.undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        editorRef.current?.redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const state = useEditorStore.getState().saveState;
      if (state === "dirty" || state === "saving") {
        e.preventDefault();
        void flushPendingSave();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const selectPanel = useCallback(
    async (id: string) => {
      editorRef.current?.persist();
      await flushPendingSave();
      const layerList = await listLayers(id);
      const prevId = useEditorStore.getState().panelId;
      setLayers(layerList);
      setPanel(id);
      if (id !== prevId) setLayersEpoch((e) => e + 1);
    },
    [setPanel]
  );

  const handlePanelResize = useCallback(
    async (
      width: number,
      height: number,
      extra?: { backgroundColor?: string }
    ) => {
      if (!activePanel) return;
      const { width: w, height: h } = clampPanelSize(width, height);
      const updates: Partial<Panel> = { width: w, height: h };
      if (extra?.backgroundColor !== undefined) {
        updates.backgroundColor = extra.backgroundColor;
      }
      await updatePanel(activePanel.id, updates);
      setPanels((prev) => {
        const next = prev.map((p) =>
          p.id === activePanel.id ? { ...p, ...updates } : p
        );
        setPanelsStore(next);
        return next;
      });
    },
    [activePanel, setPanelsStore]
  );

  const openPanelWithLayers = useCallback(
    async (panelIdToOpen: string) => {
      if (!episodeId) return;
      const layerList = await listLayers(panelIdToOpen);
      setLayers(layerList);
      setPanel(panelIdToOpen);
      setLayersEpoch((e) => e + 1);
    },
    [episodeId, setPanel]
  );

  const ingestImageFiles = useCallback(
    async (files: File[], fromClipboard = false) => {
      if (!project || !episodeId || files.length === 0) return;
      setImporting(true);
      try {
        let afterId: string | null =
          activePanel?.id ?? panels[panels.length - 1]?.id ?? null;

        for (const file of files) {
          const panel = await importImageAsPanel(projectId, episodeId, file, {
            insertAfterPanelId: afterId,
            fromClipboard,
          });
          afterId = panel.id;
          const list = await listPanels(episodeId);
          setPanels(list);
          setPanelsStore(list);
          await openPanelWithLayers(panel.id);
        }
        await touchEpisodeUpdated(episodeId);
        await updateProject(projectId, {});
      } finally {
        setImporting(false);
      }
    },
    [
      project,
      episodeId,
      projectId,
      activePanel,
      panels,
      openPanelWithLayers,
      setPanelsStore,
    ]
  );

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      if (isEditableEventTarget(e.target)) return;
      const items = e.clipboardData?.items;
      if (!items || !project) return;
      const files = imageFilesFromClipboard(items);
      if (files.length === 0) return;
      e.preventDefault();
      await ingestImageFiles(files, true);
    },
    [project, ingestImageFiles]
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!project) return;
    const files = imageFilesFromDataTransfer(e.dataTransfer);
    if (files.length === 0) return;
    await ingestImageFiles(files);
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      f.type.startsWith("image/")
    );
    e.target.value = "";
    if (files.length) await ingestImageFiles(files);
  };

  const handleDeletePanel = async (id: string) => {
    if (panels.length <= 1) {
      alert("마지막 이미지는 삭제할 수 없습니다.");
      return;
    }
    await deletePanel(id);
    const list = episodeId ? await listPanels(episodeId) : [];
    setPanels(list);
    setPanelsStore(list);
    if (activePanel?.id === id && list.length > 0) {
      await selectPanel(list[0].id);
    }
  };

  const handleExport = async () => {
    if (!project || panels.length === 0) return;
    editorRef.current?.persist();
    await flushPendingSave();
    setExporting(true);
    try {
      const safeName = project.title.replace(/[^\w\u3131-\uD79D-]+/g, "_") || "export";
      if (panels.length === 1) {
        const canvas = await renderPanelToCanvas(panels[0]);
        const blob = await exportPanelPng(canvas);
        downloadBlob(blob, `${safeName}.png`);
      } else {
        const blob = await exportPanelsZip(panels, (p) => renderPanelToCanvas(p));
        downloadBlob(blob, `${safeName}.zip`);
      }
    } finally {
      setExporting(false);
    }
  };

  if (!project || !episode) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        로딩 중…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100">
      <header className="h-11 border-b border-neutral-800 flex items-center px-4 gap-3 shrink-0">
        <Link href="/" className="text-zinc-400 hover:text-zinc-200 text-sm shrink-0">
          ← 목록
        </Link>
        <h1 className="text-sm font-medium truncate flex-1">{project.title}</h1>
        <SaveStatus />
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={exporting || panels.length === 0}
          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white disabled:opacity-40 shrink-0"
        >
          {exporting ? "보내는 중…" : panels.length <= 1 ? "PNG보내기" : "ZIP보내기"}
        </button>
      </header>

      <div
        className={`border-b border-zinc-800 bg-zinc-900/80 flex items-stretch shrink-0 ${
          propertiesExpanded ? "min-h-[148px]" : "h-11"
        }`}
      >
        <ContextPropertiesBar editorRef={editorRef} />
      </div>

      <div className="flex flex-1 min-h-0">
        <ToolsSidebar onPickImage={() => fileInputRef.current?.click()} />

        <main
          className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#1a1a1a]"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />
          {activePanel ? (
            <CanvasEditor
              ref={editorRef}
              key={`${activePanel.id}-${layersEpoch}`}
              panel={activePanel}
              layers={layers}
              onLayersChange={setLayers}
              onPanelResize={handlePanelResize}
            />
          ) : (
            <ImageImportZone
              onPickFiles={() => fileInputRef.current?.click()}
            />
          )}
          {importing && (
            <p className="text-center text-xs text-zinc-500 py-2 shrink-0">
              이미지 불러오는 중…
            </p>
          )}
        </main>

        <ImageGallerySidebar
          panels={panels}
          activePanelId={activePanel?.id ?? null}
          onSelect={(id) => void selectPanel(id)}
          onAdd={() => fileInputRef.current?.click()}
          onDelete={(id) => void handleDeletePanel(id)}
        />
      </div>
    </div>
  );
}
