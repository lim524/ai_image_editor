"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasEditorHandle } from "./CanvasEditor";
import { ToolsSidebar } from "./ToolsSidebar";
import { ContextPropertiesBar } from "./ContextPropertiesBar";
import { RightSidebar } from "./RightSidebar";
import { EditorPanelToggles } from "./EditorPanelToggles";
import { PanelSizeBar } from "./PanelSizeBar";
import { ShortcutsHelp } from "./ShortcutsHelp";
import { ShortcutSettings } from "./ShortcutSettings";
import { useEditorShortcuts } from "@/lib/shortcuts/useEditorShortcuts";
import { PanelList } from "./PanelList";
import { ExportMenu } from "./ExportMenu";
import { AssetLibrary } from "./AssetLibrary";
import { VersionHistory } from "./VersionHistory";
import { WebtoonStripView } from "./WebtoonStripView";
import { PageMangaView } from "./PageMangaView";
import { SaveStatus } from "@/components/ui/SaveStatus";
import { SaveButton } from "./SaveButton";
import { StorageGauge } from "@/components/ui/StorageGauge";
import type { Episode, Layer, Panel, Project } from "@/lib/db/types";
import {
  createPanel,
  deletePanel,
  getEpisode,
  getProject,
  flushPendingSave,
  listLayers,
  listPanels,
  reorderPanels,
  savePanelLayersImmediate,
  savePanelVersion,
  touchEpisodeUpdated,
  updateEpisodeLayout,
  updatePanel,
  updatePanelTitle,
  updateProject,
} from "@/lib/db/persistence";
import { clampPanelSize } from "@/lib/fabric/canvas-utils";
import { exportProjectBackup, downloadBlob, importProjectBackup } from "@/lib/utils/backup";
import { useEditorStore } from "@/stores/editorStore";
import { createThumbnail } from "@/lib/utils/thumbnail";
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
  const layoutMode = useEditorStore((s) => s.layoutMode);
  const showAssetLibrary = useEditorStore((s) => s.showAssetLibrary);
  const showVersionHistory = useEditorStore((s) => s.showVersionHistory);
  const setProjectStore = useEditorStore((s) => s.setProject);
  const setEpisodeStore = useEditorStore((s) => s.setEpisode);
  const setPanel = useEditorStore((s) => s.setPanel);
  const setPanelsStore = useEditorStore((s) => s.setPanels);
  const setLayoutMode = useEditorStore((s) => s.setLayoutMode);
  const setShowAssetLibrary = useEditorStore((s) => s.setShowAssetLibrary);
  const setShowVersionHistory = useEditorStore((s) => s.setShowVersionHistory);
  const dockOpen = useEditorStore((s) => s.dockOpen);

  const activePanel = panels.find((p) => p.id === panelId) ?? panels[0];

  const loadData = useCallback(async () => {
    setLayers([]);
    setPanel(null);

    const [proj, ep, panelListRaw] = await Promise.all([
      getProject(projectId),
      getEpisode(episodeId),
      listPanels(episodeId),
    ]);
    if (!proj || !ep) return;

    const panelList = panelListRaw;
    const storedPanelId = useEditorStore.getState().panelId;
    const targetPanel =
      panelList.find((p) => p.id === storedPanelId) ?? panelList[0] ?? null;

    const layerList = targetPanel
      ? await listLayers(targetPanel.id)
      : [];

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
    const onUndo = () => editorRef.current?.undo();
    const onRedo = () => editorRef.current?.redo();
    window.addEventListener("editor:undo", onUndo);
    window.addEventListener("editor:redo", onRedo);
    return () => {
      window.removeEventListener("editor:undo", onUndo);
      window.removeEventListener("editor:redo", onRedo);
    };
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

  const selectPanel = async (id: string) => {
    editorRef.current?.persist();
    await flushPendingSave();
    const layerList = await listLayers(id);
    const prevId = useEditorStore.getState().panelId;
    setLayers(layerList);
    setPanel(id);
    if (id !== prevId) setLayersEpoch((e) => e + 1);
    setLayoutMode("edit");
  };

  const handleAddPanel = async () => {
    if (!episode) return;
    const stripWidth = episode.layoutSettings.stripWidth ?? 690;
    const insertAfterId = activePanel?.id ?? panels[panels.length - 1]?.id ?? null;
    const panel = await createPanel(episodeId, {
      width: project?.format === "webtoon" ? stripWidth : 400,
      height: 400,
      insertAfterPanelId: insertAfterId,
    });
    const list = await listPanels(episodeId);
    setPanels(list);
    setPanelsStore(list);
    await selectPanel(panel.id);
  };

  const handleManualSave = useCallback(async () => {
    if (!activePanel || !editorRef.current) return;
    const layersToSave = editorRef.current.getLayersForSave();
    await savePanelLayersImmediate(activePanel.id, layersToSave);
    await Promise.all([
      touchEpisodeUpdated(episodeId),
      updateProject(projectId, {}),
    ]);
    setLayers(layersToSave);
  }, [activePanel, episodeId, projectId]);

  const {
    shortcutsForHelp,
    settingsOpen,
    setSettingsOpen,
  } = useEditorShortcuts({
    editorRef,
    onSave: handleManualSave,
    enabled: layoutMode === "edit" && !!project,
  });

  const handleRenamePanel = async (id: string, title: string) => {
    await updatePanelTitle(id, title);
    const nextTitle = title.trim() || undefined;
    setPanels((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, title: nextTitle } : p
      );
      setPanelsStore(next);
      return next;
    });
  };

  const handleDeletePanel = async (id: string) => {
    await deletePanel(id);
    const updated = panels.filter((p) => p.id !== id);
    setPanels(updated);
    setPanelsStore(updated);
    if (updated.length) await selectPanel(updated[0].id);
    else setPanel(null);
  };

  const handlePanelResize = useCallback(
    async (width: number, height: number) => {
      if (!activePanel) return;
      const { width: w, height: h } = clampPanelSize(width, height);
      await updatePanel(activePanel.id, { width: w, height: h });
      setPanels((prev) => {
        const next = prev.map((p) =>
          p.id === activePanel.id ? { ...p, width: w, height: h } : p
        );
        setPanelsStore(next);
        return next;
      });
    },
    [activePanel, setPanelsStore]
  );

  const handleReorder = async (orderedIds: string[]) => {
    await reorderPanels(episodeId, orderedIds);
    const reordered = orderedIds
      .map((id) => panels.find((p) => p.id === id)!)
      .filter(Boolean);
    setPanels(reordered);
    setPanelsStore(reordered);
  };

  const openPanelWithLayers = useCallback(
    async (panelId: string) => {
      const layerList = await listLayers(panelId);
      setLayers(layerList);
      setPanel(panelId);
      setLayersEpoch((e) => e + 1);
      setLayoutMode("edit");
    },
    [setPanel, setLayoutMode]
  );

  const ingestImageFiles = useCallback(
    async (files: File[]) => {
      if (!project || !episode || files.length === 0) return;
      setImporting(true);
      try {
        const { createAssetFromFile } = await import("@/lib/db/persistence");
        let afterId: string | null =
          activePanel?.id ?? panels[panels.length - 1]?.id ?? null;
        let fillCurrentCanvas =
          !!activePanel &&
          layers.length === 0 &&
          !!editorRef.current &&
          panels.some((p) => p.id === activePanel.id);

        for (const file of files) {
          if (fillCurrentCanvas && afterId === activePanel?.id) {
            const asset = await createAssetFromFile(project.id, file);
            await editorRef.current!.addImage(asset.id, asset.blob);
            fillCurrentCanvas = false;
          } else {
            const panel = await importImageAsPanel(projectId, episodeId, file, {
              insertAfterPanelId: afterId,
            });
            const list = await listPanels(episodeId);
            setPanels(list);
            setPanelsStore(list);
            afterId = panel.id;
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
      await ingestImageFiles(files);
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

  const handleSnapshot = async () => {
    if (!activePanel || !editorRef.current) return;
    const canvas = editorRef.current.exportToCanvas();
    if (!canvas) return;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("snapshot failed"))),
        "image/png"
      );
    });
    const { thumbnail } = await createThumbnail(blob);
    const fabricJson = JSON.stringify(
      editorRef.current.getCanvas()?.toJSON() ?? {}
    );
    const name = `스냅샷 ${new Date().toLocaleTimeString("ko-KR")}`;
    await savePanelVersion(activePanel.id, name, fabricJson, thumbnail);
    alert("스냅샷이 저장되었습니다.");
  };

  const handleBackup = async () => {
    const blob = await exportProjectBackup(projectId);
    downloadBlob(blob, `${project?.title ?? "project"}_backup.zip`);
  };

  const handleImportBackup = async (file: File) => {
    const newId = await importProjectBackup(file);
    window.location.href = `/project/${newId}`;
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
      <header className="h-12 border-b border-neutral-800 flex items-center px-4 gap-3 shrink-0">
        <Link href={`/project/${projectId}`} className="text-zinc-400 hover:text-zinc-200 text-sm">
          ← {project.title}
        </Link>
        <span className="text-zinc-600">/</span>
        <h1 className="text-sm font-medium">{episode.title}</h1>
        <div className="flex-1" />
        <SaveButton
          onSave={handleManualSave}
          disabled={!activePanel || layoutMode !== "edit"}
        />
        <SaveStatus />
        <StorageGauge />
        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5">
          {(["edit", "strip", "page"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setLayoutMode(mode)}
              className={`text-xs px-3 py-1 rounded-md transition-colors ${
                layoutMode === mode
                  ? "bg-white text-black"
                  : "text-neutral-500 hover:text-neutral-200"
              }`}
            >
              {mode === "edit" ? "편집" : mode === "strip" ? "웹툰 미리보기" : "페이지"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowAssetLibrary(true)}
          className="text-xs px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-600"
        >
          {"\uC5D0\uC14B"}
        </button>
        {layoutMode === "edit" && <EditorPanelToggles />}
        <button
          type="button"
          onClick={handleSnapshot}
          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700"
        >
          스냅샷
        </button>
        <button
          type="button"
          onClick={() => setShowVersionHistory(true)}
          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700"
        >
          히스토리
        </button>
        <button
          type="button"
          onClick={handleBackup}
          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700"
        >
          백업
        </button>
        <label className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 cursor-pointer">
          복원
          <input
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportBackup(f);
            }}
          />
        </label>
        <ExportMenu
          project={project}
          episode={episode}
          panels={panels}
          editorRef={editorRef}
        />
        <ShortcutsHelp
          shortcuts={shortcutsForHelp}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </header>

      {layoutMode === "edit" && dockOpen.properties && (
        <div className="h-11 border-b border-zinc-800 bg-zinc-900/80 flex items-center shrink-0">
          <ContextPropertiesBar editorRef={editorRef} />
          {activePanel && (
            <PanelSizeBar
              panel={activePanel}
              onUpdated={(p) => {
                setPanels((prev) => {
                  const next = prev.map((x) => (x.id === p.id ? p : x));
                  setPanelsStore(next);
                  return next;
                });
              }}
            />
          )}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {dockOpen.cuts && (
          <PanelList
            panels={panels}
            activePanelId={activePanel?.id ?? null}
            onSelect={selectPanel}
            onReorder={handleReorder}
            onAdd={handleAddPanel}
            onDelete={handleDeletePanel}
            onRename={handleRenamePanel}
          />
        )}

        {layoutMode === "edit" && (
          <>
            {dockOpen.tools && <ToolsSidebar />}
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
            {dockOpen.layers && <RightSidebar editorRef={editorRef} />}
          </>
        )}

        {layoutMode === "strip" && (
          <WebtoonStripView
            episode={episode}
            panels={panels}
            onSelectPanel={selectPanel}
          />
        )}

        {layoutMode === "page" && (
          <PageMangaView
            episode={episode}
            panels={panels}
            onSelectPanel={selectPanel}
            onTemplateChange={async (templateId) => {
              const layoutSettings = {
                ...episode.layoutSettings,
                templateId,
              };
              await updateEpisodeLayout(episodeId, layoutSettings);
              setEpisode({ ...episode, layoutSettings });
            }}
          />
        )}
      </div>

      <ShortcutSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {showAssetLibrary && (
        <AssetLibrary
          projectId={projectId}
          onInsert={(asset) => editorRef.current?.addImage(asset.id, asset.blob)}
          onClose={() => setShowAssetLibrary(false)}
        />
      )}

      {showVersionHistory && activePanel && (
        <VersionHistory
          panelId={activePanel.id}
          onRestore={async (version) => {
            const parsed = JSON.parse(version.fabricJson);
            if (parsed.objects) {
              await editorRef.current?.loadLayers(
                parsed.objects.map((_: unknown, i: number) => ({
                  id: crypto.randomUUID(),
                  panelId: activePanel.id,
                  type: "image" as const,
                  zIndex: i,
                  fabricJson: JSON.stringify({
                    version: "6.0.0",
                    objects: [parsed.objects[i]],
                  }),
                  locked: false,
                }))
              );
            }
            setShowVersionHistory(false);
          }}
          onClose={() => setShowVersionHistory(false)}
        />
      )}
    </div>
  );
}
