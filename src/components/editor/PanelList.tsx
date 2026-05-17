"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Panel } from "@/lib/db/types";
import { getPanelDisplayName } from "@/lib/db/types";
import { db } from "@/lib/db/database";

interface PanelListProps {
  panels: Panel[];
  activePanelId: string | null;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

function SortablePanelItem({
  panel,
  index,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: {
  panel: Panel;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: panel.id });
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [editTitle, setEditTitle] = useState(
    panel.title ?? getPanelDisplayName(panel, index)
  );

  const displayName = getPanelDisplayName(panel, index);

  useEffect(() => {
    setEditTitle(panel.title ?? getPanelDisplayName(panel, index));
  }, [panel.title, panel.id, index]);

  useEffect(() => {
    let url: string | null = null;
    db.layers
      .where("panelId")
      .equals(panel.id)
      .first()
      .then(async (layer) => {
        if (!layer?.assetId) return;
        const asset = await db.assets.get(layer.assetId);
        if (asset?.thumbnail) {
          url = URL.createObjectURL(asset.thumbnail);
          setThumbUrl(url);
        }
      });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [panel.id]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const commitRename = () => {
    setRenaming(false);
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== displayName) {
      onRename(trimmed);
    } else {
      setEditTitle(displayName);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${
        isActive
          ? "border-violet-500 bg-violet-950/40"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
      }`}
      onClick={onSelect}
    >
      <button
        type="button"
        className="cursor-grab text-zinc-600 hover:text-zinc-400 px-1 shrink-0"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        ⋮⋮
      </button>
      <div className="w-12 h-12 rounded bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center text-xs text-zinc-600">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          index + 1
        )}
      </div>
      <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
        {renaming ? (
          <input
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setEditTitle(displayName);
                setRenaming(false);
              }
            }}
            className="w-full text-sm bg-zinc-800 border border-violet-500 rounded px-1.5 py-0.5 text-zinc-100"
          />
        ) : (
          <span
            className="text-sm text-zinc-300 block truncate"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setRenaming(true);
            }}
            title="더블클릭하여 이름 변경"
          >
            {displayName}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setRenaming(true);
        }}
        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 text-xs px-1 shrink-0"
        title="이름 변경"
      >
        ✎
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs px-1 shrink-0"
      >
        ✕
      </button>
    </div>
  );
}

export function PanelList({
  panels,
  activePanelId,
  onSelect,
  onReorder,
  onAdd,
  onDelete,
  onRename,
}: PanelListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = panels.findIndex((p) => p.id === active.id);
    const newIndex = panels.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(panels, oldIndex, newIndex);
    onReorder(reordered.map((p) => p.id));
  };

  const activeIndex = panels.findIndex((p) => p.id === activePanelId);

  return (
    <aside className="w-52 bg-zinc-950 border-r border-zinc-800 flex flex-col shrink-0">
      <div className="p-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-zinc-300">패널</h3>
          <button
            type="button"
            onClick={onAdd}
            className="text-xs px-2 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white"
            title={
              activePanelId
                ? "선택한 컷 아래에 추가"
                : "맨 아래에 추가"
            }
          >
            + 컷
          </button>
        </div>
        <p className="text-[10px] text-zinc-600">
          {activePanelId && activeIndex >= 0
            ? `「${getPanelDisplayName(panels[activeIndex], activeIndex)}」 아래에 추가`
            : "선택한 컷 아래에 새 컷이 추가됩니다"}
        </p>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={panels.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {panels.map((panel, index) => (
              <SortablePanelItem
                key={panel.id}
                panel={panel}
                index={index}
                isActive={panel.id === activePanelId}
                onSelect={() => onSelect(panel.id)}
                onDelete={() => onDelete(panel.id)}
                onRename={(title) => onRename(panel.id, title)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </aside>
  );
}
