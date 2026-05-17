"use client";

import { useCallback, useEffect, useState } from "react";
import type { Asset, AssetCategory } from "@/lib/db/types";
import {
  createAssetFromFile,
  deleteAsset,
  listAssets,
} from "@/lib/db/persistence";

interface AssetLibraryProps {
  projectId: string;
  onInsert: (asset: Asset) => void;
  onClose: () => void;
}

const CATEGORIES: { id: AssetCategory | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "character", label: "캐릭터" },
  { id: "background", label: "배경" },
  { id: "prop", label: "소품" },
  { id: "other", label: "기타" },
];

export function AssetLibrary({
  projectId,
  onInsert,
  onClose,
}: AssetLibraryProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState<AssetCategory | "all">("all");
  const [uploadCategory, setUploadCategory] = useState<AssetCategory>("other");

  const load = useCallback(async () => {
    const list = await listAssets(projectId);
    setAssets(list);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      await createAssetFromFile(projectId, file, uploadCategory);
    }
    await load();
  };

  const filtered =
    filter === "all" ? assets : assets.filter((a) => a.category === filter);

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 flex flex-col">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="font-semibold text-zinc-100">에셋 라이브러리</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-200"
        >
          ✕
        </button>
      </div>

      <div className="p-3 border-b border-zinc-800 space-y-2">
        <select
          value={uploadCategory}
          onChange={(e) => setUploadCategory(e.target.value as AssetCategory)}
          className="w-full text-sm bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-zinc-200"
        >
          {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="block w-full text-center text-sm py-2 rounded-lg border border-dashed border-zinc-600 text-zinc-400 hover:border-violet-500 hover:text-violet-400 cursor-pointer">
          이미지 업로드
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </label>
      </div>

      <div className="flex gap-1 p-2 border-b border-zinc-800 overflow-x-auto">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
              filter === c.id
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2">
        {filtered.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onInsert={() => onInsert(asset)}
            onDelete={async () => {
              await deleteAsset(asset.id);
              await load();
            }}
          />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-zinc-500 text-sm py-8">
            에셋이 없습니다
          </p>
        )}
      </div>
    </div>
  );
}

function AssetCard({
  asset,
  onInsert,
  onDelete,
}: {
  asset: Asset;
  onInsert: () => void;
  onDelete: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(asset.thumbnail);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [asset.thumbnail]);

  return (
    <div className="group relative rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={asset.name} className="w-full aspect-square object-cover" />
      )}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
        <button
          type="button"
          onClick={onInsert}
          className="text-xs px-2 py-1 bg-violet-600 rounded text-white"
        >
          삽입
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-xs px-2 py-1 bg-red-900/80 rounded text-red-200"
        >
          삭제
        </button>
      </div>
      <p className="text-[10px] text-zinc-500 px-1 py-0.5 truncate">{asset.name}</p>
    </div>
  );
}
