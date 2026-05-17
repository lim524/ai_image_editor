"use client";

import { useParams } from "next/navigation";
import { EditorWorkspace } from "@/components/editor/EditorWorkspace";

export default function ProjectEditorPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return <EditorWorkspace projectId={projectId} />;
}
