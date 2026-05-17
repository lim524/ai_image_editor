"use client";

import { useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { CreateProjectModal } from "@/components/home/CreateProjectModal";
import { hydrateUserFonts } from "@/lib/fonts/user-fonts";
import { useUiStore } from "@/stores/uiStore";

interface AppShellProps {
  children: React.ReactNode;
  topBar?: React.ReactNode;
  /** 홈 화면에서만 true — 햄버거·네비 드로어 표시 */
  showNavSidebar?: boolean;
}

const SIDEBAR_WIDTH = 220;

export function AppShell({
  children,
  topBar,
  showNavSidebar = false,
}: AppShellProps) {
  const showCreateModal = useUiStore((s) => s.showCreateModal);
  const setShowCreateModal = useUiStore((s) => s.setShowCreateModal);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);

  useEffect(() => {
    void hydrateUserFonts();
    if (!showNavSidebar) return;
    const open = localStorage.getItem("sidebar_open");
    if (open === "0") setSidebarOpen(false);
  }, [setSidebarOpen, showNavSidebar]);

  return (
    <div className="h-screen flex bg-black text-neutral-100 relative overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {topBar}
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">{children}</main>
      </div>

      {showNavSidebar && sidebarOpen && (
        <button
          type="button"
          aria-label={"\uC0AC\uC774\uB4DC\uBC14 \uB2EB\uAE30"}
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {showNavSidebar && (
        <aside
          className="fixed top-0 right-0 h-full z-50 bg-black border-l border-neutral-800 shadow-2xl transition-transform duration-300 ease-out"
          style={{
            width: SIDEBAR_WIDTH,
            transform: sidebarOpen ? "translateX(0)" : `translateX(${SIDEBAR_WIDTH}px)`,
          }}
        >
          <AppSidebar />
        </aside>
      )}

      {showNavSidebar && (
        <CreateProjectModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
