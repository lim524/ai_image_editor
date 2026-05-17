"use client";

import type { ProjectWithCover } from "@/lib/db/types";
import { ProjectCard } from "./ProjectCard";

export type SortMode = "updated" | "name";

interface ProjectGridProps {
  projects: ProjectWithCover[];
  sort: SortMode;
  search: string;
  onPickImages?: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function filterAndSortProjects(
  projects: ProjectWithCover[],
  sort: SortMode,
  search: string
): ProjectWithCover[] {
  const q = search.trim().toLowerCase();
  let list = q
    ? projects.filter((p) => p.title.toLowerCase().includes(q))
    : [...projects];

  if (sort === "name") {
    list.sort((a, b) => a.title.localeCompare(b.title, "ko"));
  } else {
    list.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  return list;
}

export function ProjectGrid({
  projects,
  sort,
  search,
  onPickImages,
  onDelete,
  onRename,
}: ProjectGridProps) {
  const filtered = filterAndSortProjects(projects, sort, search);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-3xl mb-4 opacity-50">
          📁
        </div>
        <p className="text-zinc-400 font-medium">
          {search ? "검색 결과가 없습니다" : "아직 프로젝트가 없습니다"}
        </p>
        <p className="text-sm text-neutral-600 mt-1 max-w-sm">
          이미지를 붙여넣거나(Ctrl+V) 화면에 끌어다 놓으면 바로 편집할 수 있습니다.
        </p>
        {onPickImages && (
          <button
            type="button"
            onClick={onPickImages}
            className="ui-btn-primary mt-6 text-sm px-5 py-2.5"
          >
            이미지 파일 선택
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 p-8">
      {filtered.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          onDelete={onDelete}
          onRename={onRename}
        />
      ))}
    </div>
  );
}
