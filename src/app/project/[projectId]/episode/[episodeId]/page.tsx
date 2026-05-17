"use client";

import { useParams } from "next/navigation";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";

export default function EpisodeEditorPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const episodeId = params.episodeId as string;

  return <EditorWorkspace projectId={projectId} episodeId={episodeId} />;
}
