"use client";

import { useEffect, useState } from "react";
import type { Panel } from "@/lib/db/types";
import { updatePanel } from "@/lib/db/persistence";
import {
  clampPanelSize,
  PANEL_HEIGHT_MAX,
  PANEL_HEIGHT_MIN,
  PANEL_WIDTH_MAX,
  PANEL_WIDTH_MIN,
} from "@/lib/fabric/canvas-utils";

interface PanelSizeBarProps {
  panel: Panel;
  onUpdated: (panel: Panel) => void;
}

export function PanelSizeBar({ panel, onUpdated }: PanelSizeBarProps) {
  const [width, setWidth] = useState(panel.width);
  const [height, setHeight] = useState(panel.height);

  useEffect(() => {
    setWidth(panel.width);
    setHeight(panel.height);
  }, [panel.id, panel.width, panel.height]);

  const applySize = async () => {
    const { width: w, height: h } = clampPanelSize(width, height);
    setWidth(w);
    setHeight(h);
    await updatePanel(panel.id, { width: w, height: h });
    onUpdated({ ...panel, width: w, height: h });
  };

  return (
    <div className="flex items-center gap-3 shrink-0 border-l border-zinc-800 pl-3 ml-1">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
        {"\uCEF7 \uD06C\uAE30 (px)"}
      </span>
      <label className="flex items-center gap-1 text-xs text-zinc-400">
        W
        <input
          type="number"
          min={PANEL_WIDTH_MIN}
          max={PANEL_WIDTH_MAX}
          step={1}
          value={width}
          onChange={(e) => setWidth(+e.target.value)}
          onBlur={() => void applySize()}
          onKeyDown={(e) => e.key === "Enter" && void applySize()}
          className="w-20 prop-input-compact"
        />
        <span className="text-zinc-600">px</span>
      </label>
      <label className="flex items-center gap-1 text-xs text-zinc-400">
        H
        <input
          type="number"
          min={PANEL_HEIGHT_MIN}
          max={PANEL_HEIGHT_MAX}
          step={1}
          value={height}
          onChange={(e) => setHeight(+e.target.value)}
          onBlur={() => void applySize()}
          onKeyDown={(e) => e.key === "Enter" && void applySize()}
          className="w-20 prop-input-compact"
        />
        <span className="text-zinc-600">px</span>
      </label>
      <button
        type="button"
        onClick={() => void applySize()}
        className="text-[10px] px-2 py-1 rounded border border-zinc-700 hover:border-violet-500 text-zinc-400"
      >
        {"\uC801\uC6A9"}
      </button>
    </div>
  );
}
