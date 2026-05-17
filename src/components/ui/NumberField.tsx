"use client";

import { useEffect, useState } from "react";

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  className?: string;
  onCommit: (value: number) => void;
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  className = "",
  onCommit,
}: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const n = Number(draft);
    if (Number.isNaN(n)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, n));
    setDraft(String(clamped));
    if (clamped !== value) onCommit(clamped);
  };

  return (
    <label
      className={`flex items-center gap-1 shrink-0 text-xs text-zinc-400 ${className}`}
    >
      <span className="text-[10px] text-zinc-500 whitespace-nowrap">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="prop-input-compact w-14 tabular-nums"
      />
      {suffix && <span className="text-[10px] text-zinc-600">{suffix}</span>}
    </label>
  );
}
