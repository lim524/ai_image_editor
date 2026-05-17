"use client";

import { useEffect, useState } from "react";
import type { Episode, Panel } from "@/lib/db/types";
import { getTemplate } from "@/lib/layout/page-templates";
import { db } from "@/lib/db/database";

interface PageMangaViewProps {
  episode: Episode;
  panels: Panel[];
  onSelectPanel: (id: string) => void;
  onTemplateChange: (templateId: string) => void;
}

export function PageMangaView({
  episode,
  panels,
  onSelectPanel,
  onTemplateChange,
}: PageMangaViewProps) {
  const pageW = episode.layoutSettings.pageWidth ?? 800;
  const pageH = episode.layoutSettings.pageHeight ?? 1200;
  const templateId = episode.layoutSettings.templateId ?? "2x2";
  const template = getTemplate(templateId);
  const rtl = episode.layoutSettings.readingDirection === "rtl";

  const [thumbMap, setThumbMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const urls: string[] = [];

    async function load() {
      const map: Record<string, string> = {};
      for (const panel of panels) {
        const layers = await db.layers.where("panelId").equals(panel.id).toArray();
        for (const layer of layers) {
          if (layer.assetId) {
            const asset = await db.assets.get(layer.assetId);
            if (asset) {
              const url = URL.createObjectURL(asset.thumbnail);
              map[panel.id] = url;
              urls.push(url);
              break;
            }
          }
        }
      }
      setThumbMap(map);
    }

    load();
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [panels]);

  const slots = rtl ? [...template.slots].reverse() : template.slots;

  return (
    <div className="flex-1 overflow-auto bg-zinc-950 p-6">
      <div className="mb-4 flex gap-2 flex-wrap">
        {["1x1", "2x1", "1x2", "2x2", "3-row", "diagonal"].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onTemplateChange(id)}
            className={`text-xs px-3 py-1.5 rounded-lg ${
              templateId === id
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {getTemplate(id).name}
          </button>
        ))}
      </div>

      <div
        className="mx-auto bg-white shadow-2xl relative"
        style={{ width: pageW, height: pageH }}
      >
        {slots.map((slot, i) => {
          const panel = panels[i];
          if (!panel) return null;
          const x = slot.x * pageW;
          const y = slot.y * pageH;
          const w = slot.w * pageW;
          const h = slot.h * pageH;
          const thumb = thumbMap[panel.id];

          return (
            <button
              key={panel.id}
              type="button"
              onClick={() => onSelectPanel(panel.id)}
              className="absolute overflow-hidden border-2 border-black hover:border-violet-500 transition-colors"
              style={{ left: x, top: y, width: w, height: h }}
            >
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt={`칸 ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-zinc-400 text-sm bg-zinc-50">
                  칸 {i + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
