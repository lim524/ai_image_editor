"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { FontManager } from "@/components/settings/FontManager";
import { StorageGauge } from "@/components/ui/StorageGauge";
import { StorageWarning } from "@/components/ui/StorageWarning";
import { importProjectBackup } from "@/lib/utils/backup";

export default function SettingsPage() {
  return (
    <AppShell
      topBar={
        <header className="h-14 border-b border-neutral-800 px-6 flex items-center shrink-0">
          <h1 className="text-sm font-semibold text-white">{"\uC124\uC815"}</h1>
        </header>
      }
    >
      <div className="flex-1 overflow-y-auto p-6 max-w-2xl space-y-10">
        <FontManager />

        <section className="space-y-3 pt-6 border-t border-neutral-800">
          <h2 className="text-sm font-semibold text-white">{"\uC800\uC7A5\uC18C"}</h2>
          <StorageGauge />
          <StorageWarning />
          <label className="ui-btn-secondary inline-flex cursor-pointer">
            {"\uBC31\uC5C5 ZIP \uAC00\uC838\uC624\uAE30"}
            <input
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  void importProjectBackup(f).then((id) => {
                    window.location.href = `/project/${id}`;
                  });
                }
              }}
            />
          </label>
        </section>

        <p className="text-xs text-neutral-600">
          <Link href="/" className="underline hover:text-neutral-400">
            {"\uD648\uC73C\uC73C \uB3CC\uC544\uAC00\uAE30"}
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
