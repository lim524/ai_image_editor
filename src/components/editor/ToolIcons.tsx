"use client";

import type { Tool } from "@/stores/editorStore";

const iconClass = "w-5 h-5";

export function ToolIcon({ tool }: { tool: Tool | "undo" | "redo" }) {
  switch (tool) {
    case "select":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4l8 18 2.5-7.5L22 12 4 4z" />
        </svg>
      );
    case "bubble-oval":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="11" rx="9" ry="7" />
          <path d="M8 17l-2 5 4-3" />
        </svg>
      );
    case "bubble-round":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="12" rx="4" />
          <path d="M9 17l-1 5 3-3" />
        </svg>
      );
    case "bubble-thought":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="10" r="7" />
          <circle cx="7" cy="19" r="1.5" fill="currentColor" />
          <circle cx="4" cy="21" r="1" fill="currentColor" />
        </svg>
      );
    case "bubble-shout":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 5 2-7.5L2 10h7l3-7z" />
        </svg>
      );
    case "bubble-whisper":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2">
          <ellipse cx="12" cy="11" rx="8" ry="6" />
          <path d="M8 16l-2 4 3-2" />
        </svg>
      );
    case "text":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 4v3M18 4v3M6 20h12M12 7v13" />
          <path d="M8 7h8" />
        </svg>
      );
    case "sfx":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12h2l2-6 3 12 2-8 2 8 3-12 2 6h2" />
        </svg>
      );
    case "undo":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 7H4v5" />
          <path d="M4 12a8 8 0 108 8" />
        </svg>
      );
    case "redo":
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 7h5v5" />
          <path d="M20 12a8 8 0 11-8 8" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
}
