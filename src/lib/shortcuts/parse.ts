export interface ParsedChord {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
}

export function parseShortcutKeys(raw: string): ParsedChord | null {
  const parts = raw
    .toLowerCase()
    .split("+")
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return null;

  const chord: ParsedChord = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: "",
  };

  for (const part of parts) {
    if (part === "ctrl" || part === "control") chord.ctrl = true;
    else if (part === "shift") chord.shift = true;
    else if (part === "alt" || part === "option") chord.alt = true;
    else if (part === "meta" || part === "cmd" || part === "command") chord.meta = true;
    else chord.key = part;
  }

  if (!chord.key) return null;
  if (chord.key === "space") chord.key = " ";
  if (chord.key.length === 1) chord.key = chord.key;
  return chord;
}

export function formatShortcutKeys(raw: string): string {
  return raw
    .split("+")
    .map((p) => {
      const t = p.trim();
      if (t === "ctrl") return "Ctrl";
      if (t === "shift") return "Shift";
      if (t === "alt") return "Alt";
      if (t === "meta" || t === "cmd") return "⌘";
      return t.length === 1 ? t.toUpperCase() : t;
    })
    .join(" + ");
}

export function eventToChord(e: KeyboardEvent): ParsedChord {
  let key = e.key.toLowerCase();
  if (key === " ") key = "space";
  if (key.length === 1) key = key.toLowerCase();
  return {
    ctrl: e.ctrlKey,
    shift: e.shiftKey,
    alt: e.altKey,
    meta: e.metaKey,
    key,
  };
}

export function chordsMatch(a: ParsedChord, b: ParsedChord): boolean {
  return (
    a.ctrl === b.ctrl &&
    a.shift === b.shift &&
    a.alt === b.alt &&
    a.meta === b.meta &&
    a.key === b.key
  );
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}
