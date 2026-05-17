import { getDefaultBindings } from "./defaults";
import type { ShortcutActionId, ShortcutBinding } from "./types";

const STORAGE_KEY = "ai_webtoon_shortcuts_v2";

export function loadShortcutBindings(): ShortcutBinding[] {
  if (typeof window === "undefined") return getDefaultBindings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultBindings();
    const parsed = JSON.parse(raw) as ShortcutBinding[];
    if (!Array.isArray(parsed)) return getDefaultBindings();
    return mergeWithDefaults(parsed);
  } catch {
    return getDefaultBindings();
  }
}

function mergeWithDefaults(custom: ShortcutBinding[]): ShortcutBinding[] {
  const defaults = getDefaultBindings();
  const map = new Map<ShortcutActionId, string>();
  for (const d of defaults) map.set(d.actionId, d.keys);
  for (const c of custom) {
    if (c.actionId && typeof c.keys === "string") map.set(c.actionId, c.keys);
  }
  return defaults.map((d) => ({
    actionId: d.actionId,
    keys: map.get(d.actionId) ?? d.keys,
  }));
}

export function saveShortcutBindings(bindings: ShortcutBinding[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
}

export function resetShortcutBindings(): ShortcutBinding[] {
  const defaults = getDefaultBindings();
  saveShortcutBindings(defaults);
  return defaults;
}
