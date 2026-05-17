"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Episode, Project } from "@/lib/db/types";
import {
  createEpisode,
  getProject,
  listEpisodes,
} from "@/lib/db/persistence";
import {
  imageFilesFromClipboard,
  imageFilesFromDataTransfer,
  importImageAsPanel,
  isEditableEventTarget,
} from "@/lib/editor/image-import";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openImagesInEpisode = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setImporting(true);
      try {
        const baseName =
          files[0].name.replace(/\.[^.]+$/, "") ||
          `${episodes.length + 1}화`;
        const ep = await createEpisode(projectId, baseName);
        let afterId: string | null = null;
        for (const file of files) {
          const panel = await importImageAsPanel(projectId, ep.id, file, {
            insertAfterPanelId: afterId,
          });
          afterId = panel.id;
        }
        window.location.href = `/project/${projectId}/episode/${ep.id}`;
      } finally {
        setImporting(false);
      }
    },
    [episodes.length, projectId]
  );

  const load = useCallback(async () => {
    const [proj, eps] = await Promise.all([
      getProject(projectId),
      listEpisodes(projectId),
    ]);
    setProject(proj ?? null);
    setEpisodes(eps);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isEditableEventTarget(e.target)) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = imageFilesFromClipboard(items);
      if (files.length === 0) return;
      e.preventDefault();
      void openImagesInEpisode(files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [openImagesInEpisode]);

  const handleAddEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim() || `${episodes.length + 1}화`;
    const ep = await createEpisode(projectId, title);
    setNewTitle("");
    window.location.href = `/project/${projectId}/episode/${ep.id}`;
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
        로딩 중…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
          ← 프로젝트 목록
        </Link>
        <h1 className="text-xl font-bold mt-2">{project.title}</h1>
        <p className="text-sm text-zinc-500">
          {project.format === "webtoon" ? "세로 웹툰" : "페이지 만화"}
        </p>
      </header>

      <main
        className="max-w-2xl mx-auto px-6 py-8 space-y-6"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          const files = imageFilesFromDataTransfer(e.dataTransfer);
          if (files.length) void openImagesInEpisode(files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length) void openImagesInEpisode(files);
          }}
        />
        <p className="text-sm text-zinc-500 border border-dashed border-zinc-700 rounded-lg px-4 py-3">
          이미지를 붙여넣거나 끌어다 놓으면 새 화로 바로 편집할 수 있습니다.{" "}
          <button
            type="button"
            className="underline text-zinc-300 hover:text-white"
            onClick={() => fileInputRef.current?.click()}
          >
            파일 선택
          </button>
        </p>
        {importing && (
          <p className="text-sm text-zinc-500">이미지 불러오는 중…</p>
        )}
        <form
          onSubmit={handleAddEpisode}
          className="flex gap-2"
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={`${episodes.length + 1}화 제목 (선택)`}
            className="flex-1 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-violet-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 font-medium"
          >
            + 화 추가
          </button>
        </form>

        <ul className="space-y-2">
          {episodes.map((ep) => (
            <li key={ep.id}>
              <Link
                href={`/project/${projectId}/episode/${ep.id}`}
                className="block p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-violet-600 transition-colors"
              >
                <span className="font-medium">{ep.title}</span>
                <span className="text-xs text-zinc-500 ml-2">
                  {new Date(ep.updatedAt).toLocaleDateString("ko-KR")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
