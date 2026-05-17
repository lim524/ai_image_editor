"use client";

import { useState } from "react";
import type { ProjectFormat } from "@/lib/db/types";
import { createProject } from "@/lib/db/persistence";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<ProjectFormat>("webtoon");
  const [creating, setCreating] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    try {
      const { project, episode } = await createProject(title.trim(), format);
      window.location.href = `/project/${project.id}/episode/${episode.id}`;
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70" onClick={onClose} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-neutral-950 border border-neutral-700 rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">{"\uC0C8 \uD504\uB85C\uC81D\uD2B8"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={"\uD504\uB85C\uC81D\uD2B8 \uC81C\uBAA9"}
            className="ui-input w-full"
            autoFocus
          />
          <div className="flex gap-4 text-sm text-neutral-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={format === "webtoon"}
                onChange={() => setFormat("webtoon")}
                className="accent-white"
              />
              {"\uC6F9\uD230"}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={format === "page"}
                onChange={() => setFormat("page")}
                className="accent-white"
              />
              {"\uD398\uC774\uC9C0"}
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="ui-btn-secondary flex-1">
              {"\uCDE8\uC18C"}
            </button>
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="ui-btn-primary flex-1"
            >
              {creating ? "\uB9CC\uB4DC\uB294 \uC911\u2026" : "\uB9CC\uB4E4\uAE30"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
