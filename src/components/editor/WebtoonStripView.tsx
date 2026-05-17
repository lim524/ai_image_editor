"use client";

import { useEffect, useState } from "react";
import type { Episode, Panel } from "@/lib/db/types";
import { db } from "@/lib/db/database";

interface WebtoonStripViewProps {
  episode: Episode;
  panels: Panel[];
  onSelectPanel: (id: string) => void;
}

export function WebtoonStripView({
  episode,
  panels,
  onSelectPanel,
}: WebtoonStripViewProps) {
  const stripWidth = episode.layoutSettings.stripWidth ?? 690;
  const gap = episode.layoutSettings.panelGap ?? 16;
  const [previews, setPreviews] = useState<
    Array<{ panelId: string; url: string; height: number }>
  >([]);

  useEffect(() => {
    const urls: string[] = [];

    async function load() {
      const results: Array<{ panelId: string; url: string; height: number }> =
        [];

      for (const panel of panels) {
        const layers = await db.layers.where("panelId").equals(panel.id).toArray();
        let url: string | null = null;
        let height = panel.height;

        for (const layer of layers) {
          if (layer.assetId) {
            const asset = await db.assets.get(layer.assetId);
            if (asset) {
              url = URL.createObjectURL(asset.blob);
              height = (stripWidth / asset.width) * asset.height;
              break;
            }
          }
        }

        if (url) {
          results.push({ panelId: panel.id, url, height });
          urls.push(url);
        } else {
          results.push({
            panelId: panel.id,
            url: "",
            height: panel.height,
          });
        }
      }

      setPreviews(results);
    }

    load();

    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [panels, stripWidth]);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6">
      <div
        className="mx-auto bg-white shadow-2xl"
        style={{ width: stripWidth }}
      >
        {previews.map((preview, i) => (
          <div key={preview.panelId}>
            {preview.url ? (
              <button
                type="button"
                onClick={() => onSelectPanel(preview.panelId)}
                className="w-full block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={`컷 ${i + 1}`}
                  className="w-full h-auto block hover:opacity-95 transition-opacity"
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSelectPanel(preview.panelId)}
                className="w-full flex items-center justify-center bg-zinc-100 text-zinc-400 border border-dashed border-zinc-300"
                style={{ height: preview.height }}
              >
                컷 {i + 1} — 클릭하여 편집
              </button>
            )}
            {i < previews.length - 1 && (
              <div style={{ height: gap }} className="bg-white" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
