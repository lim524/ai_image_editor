"use client";

import { useEffect, useState } from "react";
import {
  formatBytes,
  getStorageInfo,
  requestPersistentStorage,
  type StorageInfo,
} from "@/lib/utils/storage";

export function StorageGauge() {
  const [info, setInfo] = useState<StorageInfo | null>(null);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    getStorageInfo().then(setInfo);
    const interval = setInterval(() => getStorageInfo().then(setInfo), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!info || info.quota === 0) return null;

  const isWarning = info.percent > 80;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-zinc-500">브라우저 허용 용량</span>
        {!info.persisted && (
          <span className="relative flex items-center gap-1">
            <button
              type="button"
              onClick={() => requestPersistentStorage()}
              className="text-[10px] text-violet-400 hover:text-violet-300 underline"
            >
              영구 저장 요청
            </button>
            <button
              type="button"
              onClick={() => setShowTip(!showTip)}
              className="text-zinc-500 hover:text-zinc-300 w-4 h-4 rounded-full border border-zinc-600 text-[10px]"
              aria-label="영구 저장 설명"
            >
              ?
            </button>
            {showTip && (
              <div className="absolute right-0 top-full mt-1 z-50 w-56 p-2 text-[10px] leading-relaxed text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg">
                브라우저가 디스크 부족 시 임시 데이터를 지울 때, 이 사이트
                작업물이 덜 지워지도록 요청합니다. 사이트 데이터를 직접
                삭제하면 복구할 수 없습니다.
              </div>
            )}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isWarning ? "bg-amber-500" : "bg-violet-500"
            }`}
            style={{ width: `${Math.min(info.percent, 100)}%` }}
          />
        </div>
        <span className="shrink-0 tabular-nums">
          {formatBytes(info.usage)} / {formatBytes(info.quota)}
        </span>
      </div>
    </div>
  );
}
