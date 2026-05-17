"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore, type DockPanel } from "@/stores/editorStore";

const PANELS: { id: DockPanel; label: string }[] = [
  { id: "cuts", label: "\uCEF7" },
  { id: "tools", label: "\uB3C4\uAD6C" },
  { id: "layers", label: "\uB808\uC774\uC5B4" },
  { id: "properties", label: "\uC18D\uC131" },
];

export function EditorPanelToggles() {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dockOpen = useEditorStore((s) => s.dockOpen);
  const toggleDock = useEditorStore((s) => s.toggleDock);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const activeCount = PANELS.filter((p) => dockOpen[p.id]).length;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
          menuOpen
            ? "bg-white text-black border-white"
            : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-600"
        }`}
      >
        <span>{"\uD328\uB110"}</span>
        {activeCount > 0 && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              menuOpen ? "bg-black/15 text-black" : "bg-neutral-800 text-neutral-400"
            }`}
          >
            {activeCount}
          </span>
        )}
        <Chevron open={menuOpen} />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-1.5 z-50 min-w-[148px] py-1 rounded-lg border border-neutral-700 bg-neutral-950 shadow-xl"
        >
          <p className="px-3 py-1.5 text-[10px] text-neutral-500 uppercase tracking-wider border-b border-neutral-800 mb-1">
            {"\uD45C\uC2DC \uD56D\uBAA9"}
          </p>
          {PANELS.map((p) => {
            const on = dockOpen[p.id];
            return (
              <button
                key={p.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() => toggleDock(p.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-left transition-colors ${
                  on
                    ? "bg-white/10 text-white"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                }`}
              >
                <span>{p.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    on
                      ? "bg-white text-black font-medium"
                      : "bg-neutral-800 text-neutral-500"
                  }`}
                >
                  {on ? "ON" : "OFF"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
