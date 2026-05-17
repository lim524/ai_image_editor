"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/** 예전 /episode/... 링크 → 프로젝트 편집기로 리다이렉트 */
export default function EpisodeRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  useEffect(() => {
    router.replace(`/project/${projectId}`);
  }, [projectId, router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
      편집기로 이동 중…
    </div>
  );
}
