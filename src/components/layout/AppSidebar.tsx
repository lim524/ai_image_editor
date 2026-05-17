"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiStore } from "@/stores/uiStore";

const NAV = [
  { href: "/", label: "\uD648", icon: HomeIcon },
  { href: null, label: "\uC0DD\uC131", icon: CreateIcon, action: "create" as const },
  { href: "/settings", label: "\uC124\uC815", icon: SettingsIcon },
];

export function AppSidebar() {
  const pathname = usePathname();
  const setShowCreateModal = useUiStore((s) => s.setShowCreateModal);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  return (
    <div className="h-full flex flex-col pt-16">
      <div className="px-4 pb-4 border-b border-neutral-800 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2.5 min-w-0"
          onClick={() => setSidebarOpen(false)}
        >
          <Image
            src="/AIE.png"
            alt="AIE"
            width={32}
            height={32}
            className="shrink-0 object-contain"
            priority
          />
          <span className="text-base font-semibold text-white">AIE</span>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV.map((item) => {
          const active =
            item.href !== null &&
            (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.action === "create") {
            return (
              <button
                key="create"
                type="button"
                onClick={() => {
                  setShowCreateModal(true);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-white transition-colors"
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href!}
              href={item.href!}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                active
                  ? "bg-white text-black font-medium"
                  : "text-neutral-300 hover:bg-neutral-900 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" />
    </svg>
  );
}

function CreateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <path d="M8 8l1.5 1.5M14.5 14.5L16 16M16 8l-1.5 1.5M8 16l1.5-1.5" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
