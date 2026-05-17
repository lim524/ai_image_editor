import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db/database";
import type { UserFont } from "@/lib/db/types";
import type { FontPreset } from "./presets";
import { FONT_PRESETS } from "./presets";

const registered = new Set<string>();

function cssFamily(id: string): string {
  return `AIE_User_${id.replace(/-/g, "")}`;
}

export function registerFontFace(font: UserFont): void {
  if (registered.has(font.id)) return;
  const url = URL.createObjectURL(font.blob);
  const face = new FontFace(font.family, `url(${url})`);
  face
    .load()
    .then((loaded) => {
      document.fonts.add(loaded);
      registered.add(font.id);
    })
    .catch(console.error);
}

export async function hydrateUserFonts(): Promise<void> {
  const fonts = await db.user_fonts.toArray();
  fonts.forEach(registerFontFace);
}

export async function listUserFonts(): Promise<UserFont[]> {
  return db.user_fonts.orderBy("createdAt").reverse().toArray();
}

export async function addUserFontFromFile(file: File): Promise<UserFont> {
  const id = uuidv4();
  const family = cssFamily(id);
  const font: UserFont = {
    id,
    name: file.name.replace(/\.[^.]+$/, ""),
    family,
    mimeType: file.type || "font/ttf",
    blob: file,
    createdAt: Date.now(),
  };
  await db.user_fonts.add(font);
  registerFontFace(font);
  window.dispatchEvent(new CustomEvent("fonts:updated"));
  return font;
}

export async function deleteUserFont(id: string): Promise<void> {
  await db.user_fonts.delete(id);
  registered.delete(id);
  window.dispatchEvent(new CustomEvent("fonts:updated"));
}

export function downloadUserFont(font: UserFont): void {
  const url = URL.createObjectURL(font.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${font.name}.ttf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function getAllFontPresets(): Promise<FontPreset[]> {
  const custom = await listUserFonts();
  const customPresets: FontPreset[] = custom.map((f) => ({
    id: `user-${f.id}`,
    label: f.name,
    family: `'${f.family}', sans-serif`,
  }));
  return [...FONT_PRESETS, ...customPresets];
}
