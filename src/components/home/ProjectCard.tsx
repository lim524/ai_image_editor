"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProjectWithCover } from "@/lib/db/types";
import { getPlaceholderCoverUrl } from "@/lib/db/project-cover";

interface ProjectCardProps {
  project: ProjectWithCover;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function ProjectCard({ project, onDelete, onRename }: ProjectCardProps) {
  const [imgUrl, setImgUrl] = useState<string | null>(project.coverUrl);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(project.title);

  useEffect(() => {
    setImgUrl(project.coverUrl);
  }, [project.coverUrl]);

  const displayUrl = imgUrl ?? getPlaceholderCoverUrl(project.format);

  return (
    <article className="group relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 hover:border-neutral-500 transition-all">
      <Link href={`/project/${project.id}`} className="block">
        <div className="aspect-[4/3] bg-neutral-900 overflow-hidden relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
          <span className="absolute top-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/80 text-neutral-300 border border-neutral-700">
            {project.format === "webtoon" ? "\uC6F9\uD230" : "\uD398\uC774\uC9C0"}
          </span>
        </div>
        <div className="p-3">
          {renaming ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                setRenaming(false);
                if (title.trim() && title !== project.title) {
                  onRename(project.id, title.trim());
                } else {
                  setTitle(project.title);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") {
                  setTitle(project.title);
                  setRenaming(false);
                }
              }}
              onClick={(e) => e.preventDefault()}
              className="w-full text-sm font-medium bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-white"
            />
          ) : (
            <h3 className="text-sm font-medium text-white line-clamp-2 min-h-[2.5rem]">
              {project.title}
            </h3>
          )}
          <p className="text-xs text-neutral-500 mt-1">
            {new Date(project.updatedAt).toLocaleDateString("ko-KR")}
          </p>
        </div>
      </Link>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setRenaming(true);
          }}
          className="p-1.5 rounded-lg bg-black/70 text-neutral-300 hover:bg-black text-xs border border-neutral-700"
          title={"\uC774\uB984 \uBCC0\uACBD"}
        >
          {"\u270E"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            if (confirm(`"${project.title}" \uD504\uB85C\uC81D\uD2B8\uB97C \uC0AD\uC81C\uD560\uAE4C\uC694?`)) {
              onDelete(project.id);
            }
          }}
          className="p-1.5 rounded-lg bg-black/70 text-neutral-400 hover:text-red-400 text-xs border border-neutral-700"
          title={"\uC0AD\uC81C"}
        >
          {"\u2715"}
        </button>
      </div>
    </article>
  );
}
