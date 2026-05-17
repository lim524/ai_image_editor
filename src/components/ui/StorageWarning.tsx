"use client";

import { useEffect, useState } from "react";
export function StorageWarning() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("storage_warning_dismissed");
    if (!dismissed) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="bg-amber-950/80 border border-amber-800/50 text-amber-200 text-sm px-4 py-3 rounded-lg flex items-start justify-between gap-4">
      <p>
        작업물은 <strong>브라우저 IndexedDB</strong>에만 저장됩니다. 시크릿
        모드나 사이트 데이터 삭제 시 유실될 수 있으니 정기적으로 백업하세요.
      </p>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem("storage_warning_dismissed", "1");
          setShow(false);
        }}
        className="text-amber-400 hover:text-amber-300 shrink-0"
      >
        닫기
      </button>
    </div>
  );
}
