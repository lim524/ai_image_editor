"use client";

import { useCallback, useEffect, useState } from "react";
import type { PanelVersion } from "@/lib/db/types";
import { listPanelVersions } from "@/lib/db/persistence";

interface VersionHistoryProps {
  panelId: string;
  onRestore: (version: PanelVersion) => void;
  onClose: () => void;
}

export function VersionHistory({
  panelId,
  onRestore,
  onClose,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<PanelVersion[]>([]);

  const load = useCallback(async () => {
    setVersions(await listPanelVersions(panelId));
  }, [panelId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="fixed inset-y-0 right-0 w-72 bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 flex flex-col">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="font-semibold text-zinc-100">버전 히스토리</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-200"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {versions.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">
            저장된 버전이 없습니다. 스냅샷을 만들어 보세요.
          </p>
        ) : (
          versions.map((v) => (
            <VersionItem key={v.id} version={v} onRestore={() => onRestore(v)} />
          ))
        )}
      </div>
    </div>
  );
}

function VersionItem({
  version,
  onRestore,
}: {
  version: PanelVersion;
  onRestore: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(version.thumbnail);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [version.thumbnail]);

  return (
    <button
      type="button"
      onClick={onRestore}
      className="w-full flex gap-3 p-2 rounded-lg border border-zinc-800 hover:border-violet-600 text-left transition-colors"
    >
      <div className="w-14 h-14 rounded bg-zinc-800 overflow-hidden shrink-0">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div>
        <p className="text-sm text-zinc-200">{version.name}</p>
        <p className="text-xs text-zinc-500">
          {new Date(version.createdAt).toLocaleString("ko-KR")}
        </p>
      </div>
    </button>
  );
}
