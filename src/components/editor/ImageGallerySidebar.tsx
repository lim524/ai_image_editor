"use client";

import { useEffect, useState } from "react";
import type { Panel } from "@/lib/db/types";
import { db } from "@/lib/db/database";

interface ImageGallerySidebarProps {
  panels: Panel[];
  activePanelId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

function GalleryItem({
  panel,
  index,
  isActive,
  onSelect,
  onDelete,
}: {
  panel: Panel;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    void db.layers
      .where("panelId")
      .equals(panel.id)
      .first()
      .then(async (layer) => {
        if (!layer?.assetId) return;
        const asset = await db.assets.get(layer.assetId);
        if (asset?.thumbnail) {
          url = URL.createObjectURL(asset.thumbnail);
          setThumbUrl(url);
        } else if (asset?.blob) {
          url = URL.createObjectURL(asset.blob);
          setThumbUrl(url);
        }
      });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [panel.id]);

  return (
    <div
      className={`group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${
        isActive
          ? "border-violet-500 ring-1 ring-violet-500/50"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
      onClick={onSelect}
    >
      <div className="aspect-[3/4] bg-zinc-900 flex items-center justify-center">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt=""
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-xs text-zinc-600">이미지 {index + 1}</span>
        )}
      </div>
      <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-zinc-300">
        {index + 1}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-1 right-1 w-6 h-6 rounded bg-black/70 text-zinc-400 hover:text-red-400 opacity-0 group-hover:opacity-100 text-xs"
        title="삭제"
      >
        ×
      </button>
    </div>
  );
}

export function ImageGallerySidebar({
  panels,
  activePanelId,
  onSelect,
  onAdd,
  onDelete,
}: ImageGallerySidebarProps) {
  return (
    <aside className="w-44 bg-neutral-950 border-l border-neutral-800 flex flex-col shrink-0">
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-300">이미지</h3>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs px-2 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white shrink-0"
          title="이미지 추가"
        >
          + 추가
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-1 gap-2 content-start">
        {panels.map((panel, index) => (
          <GalleryItem
            key={panel.id}
            panel={panel}
            index={index}
            isActive={panel.id === activePanelId}
            onSelect={() => onSelect(panel.id)}
            onDelete={() => onDelete(panel.id)}
          />
        ))}
        {panels.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-6 px-2">
            이미지를 추가하거나 붙여넣으세요
          </p>
        )}
      </div>
    </aside>
  );
}
