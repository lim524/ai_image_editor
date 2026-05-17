"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { Canvas, FabricObject } from "fabric";
import type { Layer, Panel } from "@/lib/db/types";
import { ActionHistoryStack } from "@/lib/editor/action-history";
import {
  addImageFromAsset,
  applyCanvasFilters,
  captureCanvasSnapshot,
  fabricToLayers,
  fitCanvasToViewport,
  getPanelSizeForImage,
  layersToFabric,
  restoreCanvasSnapshot,
} from "@/lib/fabric/canvas-utils";
import { fitBubbleInnerText, fitTextBoxToContent } from "@/lib/fabric/text-layout";
import {
  createDialogText,
  createSfxText,
  createSpeechBubble,
  getBubbleTextBounds,
  isBubbleTextObject,
  startBubbleTextEditing,
  type BubbleType,
} from "@/lib/fabric/bubbles";
import { saveLayersNow, scheduleLayerSave } from "@/lib/db/persistence";
import {
  getObjectType,
  readBubbleInnerTextStyle,
  readBubbleStyle,
  readTextStyle,
} from "@/lib/fabric/properties";
import { useEditorStore } from "@/stores/editorStore";

export interface CanvasEditorHandle {
  getCanvas: () => Canvas | null;
  exportToCanvas: () => HTMLCanvasElement | null;
  loadLayers: (layers: Layer[]) => Promise<void>;
  addImage: (
    assetId: string,
    blob: Blob,
    options?: { fromClipboard?: boolean }
  ) => Promise<void>;
  /** 붙여넣기: 기존 레이어 제거 후 이미지 크기에 맞춰 컷을 이미지와 동일하게 설정 */
  replaceWithImage: (
    assetId: string,
    blob: Blob,
    options?: { fromClipboard?: boolean }
  ) => Promise<void>;
  undo: () => void;
  redo: () => void;
  persist: () => void;
  getLayersForSave: () => Layer[];
  deleteSelected: () => void;
  /** 속성 패널 등 외부에서 동작 단위 실행 취소 기록 */
  recordAction: (label: string, mutate: () => void) => void;
}

interface CanvasEditorProps {
  panel: Panel;
  layers: Layer[];
  onLayersChange: (layers: Layer[]) => void;
  onPanelResize?: (
    width: number,
    height: number,
    extra?: { backgroundColor?: string }
  ) => Promise<void>;
}

const BUBBLE_TOOLS: Record<string, BubbleType> = {
  "bubble-oval": "oval",
  "bubble-round": "round",
  "bubble-thought": "thought",
  "bubble-shout": "shout",
  "bubble-whisper": "whisper",
};

const BUBBLE_LABELS: Record<string, string> = {
  "bubble-oval": "타원 말풍선 추가",
  "bubble-round": "둥근 말풍선 추가",
  "bubble-thought": "생각 말풍선 추가",
  "bubble-shout": "외침 말풍선 추가",
  "bubble-whisper": "속삭임 말풍선 추가",
};

function layersFingerprint(layers: Layer[]): string {
  return layers
    .map((l) => `${l.id}:${l.zIndex}:${l.fabricJson?.length ?? 0}:${l.assetId ?? ""}`)
    .join("|");
}

export const CanvasEditor = forwardRef<CanvasEditorHandle, CanvasEditorProps>(
  function CanvasEditor({ panel, layers, onLayersChange, onPanelResize }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const fabricRef = useRef<Canvas | null>(null);
    const historyRef = useRef(new ActionHistoryStack());
    const transformBeforeRef = useRef<string | null>(null);
    const layersRef = useRef(layers);
    const dirtyRef = useRef(false);
    const hasLoadedRef = useRef(false);
    const loadedFingerprintRef = useRef("");
    const skipLayersPropSyncRef = useRef(false);
    const isHistoryNavRef = useRef(false);
    const initialLayersLoadedRef = useRef(false);
    const [canvasReady, setCanvasReady] = useState(0);
    const activeTool = useEditorStore((s) => s.activeTool);
    const brightness = useEditorStore((s) => s.brightness);
    const contrast = useEditorStore((s) => s.contrast);
    const saturation = useEditorStore((s) => s.saturation);
    const setUndoState = useEditorStore((s) => s.setUndoState);

    layersRef.current = layers;

    const captureSnapshot = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return "";
      return captureCanvasSnapshot(canvas);
    }, []);

    const syncHistoryState = useCallback(() => {
      const h = historyRef.current;
      setUndoState(h.canUndo, h.canRedo, h.undoLabel, h.redoLabel);
    }, [setUndoState]);

    const recordHistory = useCallback(
      (label: string, before: string, after: string) => {
        historyRef.current.record(before, after, label);
        syncHistoryState();
      },
      [syncHistoryState]
    );

    const fitViewport = useCallback(() => {
      const canvas = fabricRef.current;
      const container = viewportRef.current;
      if (!canvas || !container || !hasLoadedRef.current) return;
      fitCanvasToViewport(
        canvas,
        panel.width,
        panel.height,
        container.clientWidth,
        container.clientHeight
      );
    }, [panel.width, panel.height]);

    const syncSelection = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObject() ?? null;
      if (!active) {
        useEditorStore.getState().setSelection("none", null, null, null);
        return;
      }
      let target = active;
      let type = getObjectType(active);
      if (isBubbleTextObject(active)) {
        const parent = (
          active as FabricObject & { group?: FabricObject }
        ).group;
        const parentData = (parent as { data?: { layerType?: string } })?.data;
        if (parent && parentData?.layerType === "bubble") {
          target = parent;
          type = "bubble";
        }
      }
      const textStyle =
        type === "text" || type === "sfx"
          ? readTextStyle(active)
          : type === "bubble"
            ? readBubbleInnerTextStyle(target)
            : null;
      const bubbleStyle = type === "bubble" ? readBubbleStyle(target) : null;
      useEditorStore
        .getState()
        .setSelection(type, target, textStyle, bubbleStyle);
    }, []);

    const persistLayers = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas || !hasLoadedRef.current || isHistoryNavRef.current) return;
      const newLayers = fabricToLayers(canvas, panel.id, layersRef.current);
      layersRef.current = newLayers;
      loadedFingerprintRef.current = layersFingerprint(newLayers);
      skipLayersPropSyncRef.current = true;
      onLayersChange(newLayers);
      scheduleLayerSave(panel.id, newLayers);
      syncSelection();
    }, [panel.id, onLayersChange, syncSelection]);

    const markDirty = useCallback(() => {
      dirtyRef.current = true;
    }, []);

    const restoreSnapshot = useCallback(
      async (snapshot: string) => {
        const canvas = fabricRef.current;
        if (!canvas || !snapshot) return;
        isHistoryNavRef.current = true;
        skipLayersPropSyncRef.current = true;
        const newLayers = await restoreCanvasSnapshot(
          canvas,
          snapshot,
          panel.id,
          layersRef.current
        );
        layersRef.current = newLayers;
        onLayersChange(newLayers);
        scheduleLayerSave(panel.id, newLayers);
        syncSelection();
        syncHistoryState();
        isHistoryNavRef.current = false;
      },
      [panel.id, onLayersChange, syncSelection, syncHistoryState]
    );

    const applyLayersToCanvas = useCallback(
      async (layerData: Layer[]) => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        await layersToFabric(canvas, layerData, {
          width: panel.width,
          height: panel.height,
          backgroundColor: panel.backgroundColor,
        });
        layersRef.current = layerData;
        hasLoadedRef.current = true;
        loadedFingerprintRef.current = layersFingerprint(layerData);
        dirtyRef.current = false;
        if (!isHistoryNavRef.current) {
          historyRef.current.seed(captureSnapshot(), "\uCEF7 \uBD88\uB7EC\uC624\uAE30");
          syncHistoryState();
        }
        requestAnimationFrame(() => fitViewport());
      },
      [captureSnapshot, syncHistoryState, fitViewport]
    );

    const recordAction = useCallback(
      (label: string, mutate: () => void) => {
        const before = captureSnapshot();
        mutate();
        const after = captureSnapshot();
        recordHistory(label, before, after);
        markDirty();
        persistLayers();
      },
      [captureSnapshot, recordHistory, markDirty, persistLayers]
    );

    // 캔버스 DOM·Fabric 인스턴스 생성
    useEffect(() => {
      let mounted = true;
      hasLoadedRef.current = false;
      dirtyRef.current = false;
      loadedFingerprintRef.current = "";
      initialLayersLoadedRef.current = false;
      transformBeforeRef.current = null;
      historyRef.current = new ActionHistoryStack();

      async function setup() {
        if (!canvasRef.current) return;
        const { Canvas: FabricCanvas } = await import("fabric");
        if (!mounted || !canvasRef.current) return;

        const canvas = new FabricCanvas(canvasRef.current, {
          width: panel.width,
          height: panel.height,
          backgroundColor: panel.backgroundColor,
          preserveObjectStacking: true,
          enableRetinaScaling: false,
        });
        fabricRef.current = canvas;

        canvas.on("mouse:down", (opt) => {
          if (opt.target) transformBeforeRef.current = captureSnapshot();
        });

        canvas.on("object:modified", () => {
          const before = transformBeforeRef.current;
          if (before) {
            const after = captureSnapshot();
            recordHistory("이동·변형", before, after);
            transformBeforeRef.current = null;
          }
          markDirty();
          persistLayers();
          syncSelection();
          useEditorStore.getState().bumpProperties();
        });

        canvas.on("object:added", () => markDirty());
        canvas.on("selection:created", syncSelection);
        canvas.on("selection:updated", syncSelection);
        canvas.on("selection:cleared", () => {
          useEditorStore.getState().setSelection("none", null, null, null);
        });

        canvas.on("text:editing:exited", (opt) => {
          const target = (opt as { target?: FabricObject }).target;
          if (!target) return;
          if (isBubbleTextObject(target)) {
            const parent = (
              target as FabricObject & { group?: FabricObject }
            ).group;
            if (parent) {
              fitBubbleInnerText(target, getBubbleTextBounds(parent));
              canvas.setActiveObject(parent);
            }
          } else {
            fitTextBoxToContent(target);
          }
          syncSelection();
          useEditorStore.getState().bumpProperties();
          markDirty();
          persistLayers();
        });

        canvas.on("mouse:dblclick", (opt) => {
          const hit = opt.target;
          if (!hit) return;
          let bubble: FabricObject = hit;
          if (isBubbleTextObject(hit)) {
            const parent = (hit as FabricObject & { group?: FabricObject })
              .group;
            if (parent) bubble = parent;
          }
          const data = (bubble as { data?: { layerType?: string } }).data;
          if (data?.layerType === "bubble") {
            startBubbleTextEditing(canvas, bubble);
          }
        });

        setCanvasReady((n) => n + 1);
      }

      void setup();

      return () => {
        mounted = false;
        setCanvasReady(0);
        const canvas = fabricRef.current;
        if (canvas && dirtyRef.current && hasLoadedRef.current) {
          const newLayers = fabricToLayers(canvas, panel.id, layersRef.current);
          void saveLayersNow(panel.id, newLayers);
        }
        canvas?.dispose();
        fabricRef.current = null;
        hasLoadedRef.current = false;
      };
    }, [panel.id, captureSnapshot, recordHistory, markDirty, persistLayers, syncSelection]);

    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas || !hasLoadedRef.current) return;
      canvas.setDimensions({ width: panel.width, height: panel.height });
      canvas.backgroundColor = panel.backgroundColor;
      fitViewport();
    }, [panel.width, panel.height, panel.backgroundColor, fitViewport]);

    useEffect(() => {
      const container = viewportRef.current;
      if (!container || !canvasReady) return;
      const ro = new ResizeObserver(() => fitViewport());
      ro.observe(container);
      fitViewport();
      return () => ro.disconnect();
    }, [canvasReady, fitViewport]);

    useEffect(() => {
      if (!canvasReady || initialLayersLoadedRef.current) return;
      initialLayersLoadedRef.current = true;
      let cancelled = false;
      void (async () => {
        await applyLayersToCanvas(layers);
        if (!cancelled) syncSelection();
      })();
      return () => {
        cancelled = true;
      };
    }, [canvasReady, applyLayersToCanvas, syncSelection, layers]);

    useEffect(() => {
      const canvas = fabricRef.current;
      if (canvas && hasLoadedRef.current) {
        applyCanvasFilters(canvas, brightness, contrast, saturation);
      }
    }, [brightness, contrast, saturation]);

    useEffect(() => {
      const canvas = fabricRef.current;
      if (!canvas || !hasLoadedRef.current) return;

      async function applyTool() {
        const tool = activeTool;
        const before = captureSnapshot();

        if (BUBBLE_TOOLS[tool]) {
          const bubble = await createSpeechBubble(
            BUBBLE_TOOLS[tool],
            (canvas!.width ?? 300) / 2,
            (canvas!.height ?? 200) / 2
          );
          canvas!.add(bubble);
          canvas!.setActiveObject(bubble);
          syncSelection();
          startBubbleTextEditing(canvas!, bubble);
          recordHistory(BUBBLE_LABELS[tool] ?? "말풍선 추가", before, captureSnapshot());
        } else if (tool === "text") {
          const text = await createDialogText(
            "",
            (canvas!.width ?? 300) / 2,
            (canvas!.height ?? 200) / 2
          );
          canvas!.add(text);
          canvas!.setActiveObject(text);
          const editable = text as {
            enterEditing?: () => void;
            selectAll?: () => void;
          };
          editable.enterEditing?.();
          requestAnimationFrame(() => editable.selectAll?.());
          recordHistory("대사 추가", before, captureSnapshot());
        } else if (tool === "sfx") {
          const sfx = await createSfxText(
            "",
            (canvas!.width ?? 300) / 2,
            (canvas!.height ?? 200) / 2
          );
          canvas!.add(sfx);
          canvas!.setActiveObject(sfx);
          const editable = sfx as {
            enterEditing?: () => void;
            selectAll?: () => void;
          };
          editable.enterEditing?.();
          requestAnimationFrame(() => editable.selectAll?.());
          recordHistory("효과음 추가", before, captureSnapshot());
        } else return;

        markDirty();
        syncSelection();
        persistLayers();
        useEditorStore.getState().setActiveTool("select");
      }

      if (
        activeTool.startsWith("bubble-") ||
        activeTool === "text" ||
        activeTool === "sfx"
      ) {
        void applyTool();
      }
    }, [
      activeTool,
      captureSnapshot,
      recordHistory,
      syncSelection,
      markDirty,
      persistLayers,
    ]);

    useImperativeHandle(ref, () => ({
      getCanvas: () => fabricRef.current,
      exportToCanvas: () => {
        const canvas = fabricRef.current;
        if (!canvas) return null;
        const zoom = canvas.getZoom();
        if (zoom === 1) return canvas.toCanvasElement();
        canvas.setZoom(1);
        canvas.setDimensions(
          { width: `${panel.width}px`, height: `${panel.height}px` },
          { cssOnly: true }
        );
        const el = canvas.toCanvasElement();
        fitViewport();
        return el;
      },
      loadLayers: async (newLayers: Layer[]) => {
        await applyLayersToCanvas(newLayers);
        onLayersChange(newLayers);
      },
      addImage: async (assetId, blob, options) => {
        const before = captureSnapshot();
        const canvas = fabricRef.current;
        if (!canvas) return;

        const isEmptyPanel = canvas.getObjects().length === 0;
        let naturalSize = false;

        if (isEmptyPanel) {
          const size = await getPanelSizeForImage(blob, {
            fromClipboard: options?.fromClipboard,
          });
          if (size.width > 0 && size.height > 0) {
            const bg = options?.fromClipboard ? "transparent" : panel.backgroundColor;
            await onPanelResize?.(size.width, size.height, {
              backgroundColor: bg,
            });
            canvas.setDimensions({ width: size.width, height: size.height });
            canvas.backgroundColor = bg;
            naturalSize = true;
          }
        }

        await addImageFromAsset(canvas, assetId, blob, { naturalSize });
        fitViewport();
        recordHistory("이미지 추가", before, captureSnapshot());
        markDirty();
        persistLayers();
      },
      replaceWithImage: async (assetId, blob, options) => {
        const before = captureSnapshot();
        const canvas = fabricRef.current;
        if (!canvas) return;

        const size = await getPanelSizeForImage(blob, {
          fromClipboard: options?.fromClipboard ?? true,
        });
        if (size.width <= 0 || size.height <= 0) return;

        const bg = "transparent";
        await onPanelResize?.(size.width, size.height, { backgroundColor: bg });
        canvas.setDimensions({ width: size.width, height: size.height });
        canvas.backgroundColor = bg;
        canvas.clear();

        await addImageFromAsset(canvas, assetId, blob, { naturalSize: true });
        fitViewport();
        recordHistory("이미지 붙여넣기", before, captureSnapshot());
        markDirty();
        persistLayers();
      },
      undo: () => {
        const entry = historyRef.current.undo();
        if (entry) void restoreSnapshot(entry.snapshot);
      },
      redo: () => {
        const entry = historyRef.current.redo();
        if (entry) void restoreSnapshot(entry.snapshot);
      },
      persist: () => {
        markDirty();
        persistLayers();
      },
      getLayersForSave: () => {
        const canvas = fabricRef.current;
        if (!canvas) return layersRef.current;
        return fabricToLayers(canvas, panel.id, layersRef.current);
      },
      deleteSelected: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObjects();
        if (!active.length) return;
        recordAction("삭제", () => {
          active.forEach((o) => canvas.remove(o));
          canvas.discardActiveObject();
        });
      },
      recordAction,
    }));

    useEffect(() => {
      const onPersist = () => persistLayers();
      window.addEventListener("editor:persist", onPersist);
      return () => window.removeEventListener("editor:persist", onPersist);
    }, [persistLayers]);

    useEffect(() => {
      const onLayerOrder = (e: Event) => {
        const dir = (e as CustomEvent<{ dir: string }>).detail?.dir;
        const canvas = fabricRef.current;
        const active = canvas?.getActiveObject();
        if (!canvas || !active) return;
        recordAction(
          dir === "front"
            ? "\uB9E8 \uC55E\uC73C\uB85C"
            : dir === "back"
              ? "\uB9E8 \uB4A4\uB85C"
              : dir === "up"
                ? "\uC55E\uC73C\uB85C"
                : "\uB4A4\uB85C",
          () => {
            if (dir === "front") canvas.bringObjectToFront(active);
            else if (dir === "back") canvas.sendObjectToBack(active);
            else if (dir === "up") canvas.bringObjectForward(active);
            else canvas.sendObjectBackwards(active);
            canvas.requestRenderAll();
          }
        );
      };
      const onDuplicate = async () => {
        const canvas = fabricRef.current;
        const active = canvas?.getActiveObject();
        if (!canvas || !active || !("clone" in active)) return;
        const cloned = await (
          active as FabricObject & { clone: () => Promise<FabricObject> }
        ).clone();
        cloned.set({ left: (active.left ?? 0) + 20, top: (active.top ?? 0) + 20 });
        recordAction("\uBCF5\uC81C", () => {
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.requestRenderAll();
        });
      };
      window.addEventListener("editor:layer-order", onLayerOrder);
      window.addEventListener("editor:duplicate", onDuplicate);
      return () => {
        window.removeEventListener("editor:layer-order", onLayerOrder);
        window.removeEventListener("editor:duplicate", onDuplicate);
      };
    }, [recordAction]);

    return (
      <div
        ref={viewportRef}
        className="w-full h-full min-h-0 flex items-center justify-center"
      >
        <div className="relative bg-zinc-900 rounded-lg overflow-hidden shadow-xl border border-zinc-800 inline-block leading-none">
          <canvas ref={canvasRef} />
        </div>
      </div>
    );
  }
);
