"use client";

import type { Tool } from "@/stores/editorStore";

const iconClass = "w-6 h-6";

export function ToolIcon({ tool }: { tool: Tool }) {
  switch (tool) {
    case "image":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
          <path d="M3 16l5-5 4 4 3-3 6 6" />
        </svg>
      );
    case "bubble":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="11" rx="9" ry="7" />
          <path d="M8 17l-2 5 4-3" />
        </svg>
      );
    case "text":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 4v3M18 4v3M6 20h12M12 7v13" />
          <path d="M8 7h8" />
        </svg>
      );
    default:
      return null;
  }
}
