"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserFont } from "@/lib/db/types";
import {
  addUserFontFromFile,
  deleteUserFont,
  downloadUserFont,
  listUserFonts,
} from "@/lib/fonts/user-fonts";

export function FontManager() {
  const [fonts, setFonts] = useState<UserFont[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setFonts(await listUserFonts());
  }, []);

  useEffect(() => {
    void load();
    const onUpdate = () => void load();
    window.addEventListener("fonts:updated", onUpdate);
    return () => window.removeEventListener("fonts:updated", onUpdate);
  }, [load]);

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      await addUserFontFromFile(file);
      await load();
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-white">{"\uC0AC\uC6A9\uC790 \uAE00\uAD8C"}</h2>
        <p className="text-xs text-neutral-500 mt-1">
          TTF, OTF, WOFF \uD30C\uC77C\uC744 \uC5C5\uB85C\uB4DC\uD558\uBA74 \uD3B8\uC9D1\uAE30 \uAE00\uAD8C \uBAA9\uB85D\uC5D0 \uCD94\uAC00\uB429\uB2C8\uB2E4.
        </p>
      </div>

      <label className="flex items-center justify-center w-full py-8 border border-dashed border-neutral-700 rounded-xl cursor-pointer hover:border-neutral-500 hover:bg-neutral-900/50 transition-colors">
        <span className="text-sm text-neutral-400">
          {uploading ? "\uC5C5\uB85C\uB4DC \uC911\u2026" : "+ \uAE00\uAD8C \uD30C\uC77C \uC5C5\uB85C\uB4DC"}
        </span>
        <input
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
      </label>

      {fonts.length === 0 ? (
        <p className="text-xs text-neutral-600 text-center py-4">
          {"\uC5C5\uB85C\uB4DC\uB41C \uAE00\uAD8C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}
        </p>
      ) : (
        <ul className="space-y-2">
          {fonts.map((font) => (
            <li
              key={font.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-900/50"
            >
              <span
                className="text-lg text-white truncate flex-1"
                style={{ fontFamily: `'${font.family}', sans-serif` }}
              >
                {font.name}
              </span>
              <span className="text-[10px] text-neutral-600 shrink-0">Aa \uAC00\uB098\uB2E4</span>
              <button
                type="button"
                onClick={() => downloadUserFont(font)}
                className="ui-btn-secondary text-xs px-2 py-1"
              >
                {"\uB2E4\uC6B4"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`"${font.name}" \uAE00\uAD8C\uC744 \uC0AD\uC81C\uD560\uAE4C\uC694?`)) {
                    void deleteUserFont(font.id).then(load);
                  }
                }}
                className="text-xs px-2 py-1 text-neutral-500 hover:text-red-400"
              >
                {"\uC0AD\uC81C"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
