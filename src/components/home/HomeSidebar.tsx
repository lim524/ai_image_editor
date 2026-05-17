"use client";

import { useState } from "react";
import { StorageWarning } from "@/components/ui/StorageWarning";
import { StorageGauge } from "@/components/ui/StorageGauge";
import type { ProjectFormat } from "@/lib/db/types";
import type { SortMode } from "./ProjectGrid";

interface HomeSidebarProps {
  sort: SortMode;
  search: string;
  onSortChange: (s: SortMode) => void;
  onSearchChange: (q: string) => void;
  onCreate: (title: string, format: ProjectFormat) => Promise<void>;
  onImport: (file: File) => Promise<void>;
  creating: boolean;
}

export function HomeSidebar({
  sort,
  search,
  onSortChange,
  onSearchChange,
  onCreate,
  onImport,
  creating,
}: HomeSidebarProps) {
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<ProjectFormat>("webtoon");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onCreate(title.trim(), format);
    setTitle("");
  };

  return (
    <aside className="w-80 shrink-0 border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-y-auto">
      <div className="p-5 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4">새 프로젝트</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="프로젝트 제목"
            className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500"
          />
          <div className="flex gap-3 text-sm">
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-400">
              <input
                type="radio"
                name="format"
                checked={format === "webtoon"}
                onChange={() => setFormat("webtoon")}
                className="accent-violet-500"
              />
              웹툰
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-400">
              <input
                type="radio"
                name="format"
                checked={format === "page"}
                onChange={() => setFormat("page")}
                className="accent-violet-500"
              />
              페이지
            </label>
          </div>
          <button
            type="submit"
            disabled={creating || !title.trim()}
            className="w-full py-2 text-sm rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 font-medium"
          >
            {creating ? "만드는 중…" : "프로젝트 만들기"}
          </button>
        </form>
      </div>

      <div className="p-5 border-b border-zinc-800 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">정리</h2>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="제목 검색…"
          className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:border-violet-500"
        />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortMode)}
          className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-900 border border-zinc-700 focus:outline-none focus:border-violet-500"
        >
          <option value="updated">최근 수정순</option>
          <option value="name">이름순</option>
        </select>
      </div>

      <div className="p-5 border-b border-zinc-800 space-y-2">
        <h2 className="text-sm font-semibold text-zinc-200">저장소</h2>
        <StorageGauge />
        <label className="flex w-full justify-center text-sm py-2 rounded-lg border border-dashed border-zinc-700 text-violet-400 hover:border-violet-500 cursor-pointer">
          백업 ZIP 가져오기
          <input
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
            }}
          />
        </label>
      </div>

      <div className="p-5 mt-auto">
        <StorageWarning />
      </div>
    </aside>
  );
}
