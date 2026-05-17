"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasEditorHandle } from "./CanvasEditor";
import { ToolsSidebar } from "./ToolsSidebar";
import { ContextPropertiesBar } from "./ContextPropertiesBar";
import { SaveStatus } from "@/components/ui/SaveStatus";
import type { Episode, Layer, Panel, Project } from "@/lib/db/types";
import {
  flushPendingSave,
  getEpisode,
  getProject,
  listLayers,
  listPanels,
  savePanelLayersImmediate,
  touchEpisodeUpdated,
  updatePanel,
  updateProject,
} from "@/lib/db/persistence";
import { clampPanelSize } from "@/lib/fabric/canvas-utils";
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
  episodeId: string;
}

export function EditorWorkspace({ projectId, episodeId }: EditorWorkspaceProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [layersEpoch, setLayersEpoch] = useState(0);
  const [importing, setImporting] = useState(false);
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
    selectedObjectType === "sfx";

  const activePanel = panels.find((p) => p.id === panelId) ?? panels[0];

  const loadData = useCallback(async () => {
    setLayers([]);
    setPanel(null);

    const [proj, ep, panelList] = await Promise.all([
      getProject(projectId),
      getEpisode(episodeId),
      listPanels(episodeId),
    ]);
    if (!proj || !ep) return;

    const targetPanel = panelList[0] ?? null;
    const layerList = targetPanel ? await listLayers(targetPanel.id) : [];

    setProject(proj);
    setEpisode(ep);
    setPanels(panelList);
    setPanelsStore(panelList);
    setProjectStore(projectId, proj.format);
    setEpisodeStore(episodeId);
    setLayers(layerList);
    setPanel(targetPanel?.id ?? null);
    setLayersEpoch((e) => e + 1);
  }, [projectId, episodeId, setProjectStore, setEpisodeStore, setPanel, setPanelsStore]);

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
      const layerList = await listLayers(panelIdToOpen);
      setLayers(layerList);
      setPanel(panelIdToOpen);
      setLayersEpoch((e) => e + 1);
    },
    [setPanel]
  );

  const ingestImageFiles = useCallback(
    async (files: File[], fromClipboard = false) => {
      if (!project || !episode || files.length === 0) return;
      setImporting(true);
      try {
        const { createAssetFromFile } = await import("@/lib/db/persistence");
        const canPasteOnCanvas =
          !!activePanel &&
          !!editorRef.current &&
          panels.some((p) => p.id === activePanel.id);

        for (const file of files) {
          if (fromClipboard && canPasteOnCanvas) {
            const asset = await createAssetFromFile(project.id, file);
            await editorRef.current!.replaceWithImage(asset.id, asset.blob, {
              fromClipboard: true,
            });
            const layerList = await listLayers(activePanel!.id);
            setLayers(layerList);
            setLayersEpoch((e) => e + 1);
          } else if (
            !fromClipboard &&
            canPasteOnCanvas &&
            layers.length === 0
          ) {
            const asset = await createAssetFromFile(project.id, file);
            await editorRef.current!.addImage(asset.id, asset.blob, {
              fromClipboard: false,
            });
            const layerList = await listLayers(activePanel!.id);
            setLayers(layerList);
            setLayersEpoch((e) => e + 1);
          } else {
            const panel = await importImageAsPanel(projectId, episodeId, file, {
              fromClipboard,
            });
            const list = await listPanels(episodeId);
            setPanels(list);
            setPanelsStore(list);
            await openPanelWithLayers(panel.id);
          }
        }
        await touchEpisodeUpdated(episodeId);
        await updateProject(projectId, {});
      } finally {
        setImporting(false);
      }
    },
    [
      project,
      episode,
      episodeId,
      projectId,
      activePanel,
      panels,
      layers.length,
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

  if (!project || !episode) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        로딩 중…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-neutral-100">
      <header className="h-11 border-b border-neutral-800 flex items-center px-4 gap-3 shrink-0">
        <Link
          href={`/project/${projectId}`}
          className="text-zinc-400 hover:text-zinc-200 text-sm"
        >
          ← {project.title}
        </Link>
        <span className="text-zinc-600">/</span>
        <h1 className="text-sm font-medium truncate">{episode.title}</h1>
        <div className="flex-1" />
        <SaveStatus />
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
          className="flex-1 min-w-0 min-h-0 flex flex-col"
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
      </div>
    </div>
  );
}
