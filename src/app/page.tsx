"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarMenuButton } from "@/components/layout/SidebarMenuButton";
import { useUiStore } from "@/stores/uiStore";
import { ProjectGrid, type SortMode } from "@/components/home/ProjectGrid";
import {
  createProjectFromImages,
  imageFilesFromClipboard,
  imageFilesFromDataTransfer,
  isEditableEventTarget,
} from "@/lib/editor/image-import";
import type { ProjectWithCover } from "@/lib/db/types";
import {
  deleteProject,
  ensureProjectCovers,
  listProjectsWithCovers,
  updateProject,
} from "@/lib/db/persistence";
import { requestPersistentStorage } from "@/lib/utils/storage";

export default function HomePage() {
  const [projects, setProjects] = useState<ProjectWithCover[]>([]);
  const [sort] = useState<SortMode>("updated");
  const [search, setSearch] = useState("");
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebarOpen = useUiStore((s) => s.toggleSidebarOpen);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openImagesInEditor = useCallback(
    async (files: File[], fromClipboard = false) => {
      if (files.length === 0) return;
      setImporting(true);
      try {
        const { projectId } = await createProjectFromImages(
          files,
          fromClipboard
        );
        window.location.href = `/project/${projectId}`;
      } finally {
        setImporting(false);
      }
    },
    []
  );

  const load = useCallback(async () => {
    const prev = projects;
    prev.forEach((p) => {
      if (p.coverUrl) URL.revokeObjectURL(p.coverUrl);
    });
    const list = await listProjectsWithCovers();
    setProjects(list);
    ensureProjectCovers(list);
  }, []);

  useEffect(() => {
    void load();
    requestPersistentStorage();
    return () => {
      projects.forEach((p) => {
        if (p.coverUrl) URL.revokeObjectURL(p.coverUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isEditableEventTarget(e.target)) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files = imageFilesFromClipboard(items);
      if (files.length === 0) return;
      e.preventDefault();
      void openImagesInEditor(files, true);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [openImagesInEditor]);

  return (
    <AppShell
      showNavSidebar
      topBar={
        <header className="h-14 border-b border-neutral-800 px-6 flex items-center gap-4 shrink-0">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/AIE.png"
              alt="AIE"
              width={96}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <div className="flex-1" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={"\uD504\uB85C\uC81D\uD2B8 \uAC80\uC0C9\u2026"}
            className="ui-input w-56 max-w-full"
          />
          <SidebarMenuButton open={sidebarOpen} onClick={toggleSidebarOpen} />
        </header>
      }
    >
      <div
        className="flex-1 overflow-y-auto flex flex-col min-h-0"
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          const files = imageFilesFromDataTransfer(e.dataTransfer);
          if (files.length) void openImagesInEditor(files);
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
            if (files.length) void openImagesInEditor(files);
          }}
        />
        {importing ? (
          <p className="text-center text-sm text-neutral-500 py-8">
            이미지로 프로젝트 여는 중…
          </p>
        ) : (
          <ProjectGrid
            projects={projects}
            sort={sort}
            search={search}
            onPickImages={() => fileInputRef.current?.click()}
            onDelete={async (id) => {
              await deleteProject(id);
              await load();
            }}
            onRename={async (id, title) => {
              await updateProject(id, { title });
              await load();
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
