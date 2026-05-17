import { create } from "zustand";

interface UiState {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  showCreateModal: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebarOpen: () => void;
  setShowCreateModal: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  sidebarOpen: true,
  showCreateModal: false,
  setSidebarCollapsed: (v) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_collapsed", v ? "1" : "0");
    }
    set({ sidebarCollapsed: v });
  },
  toggleSidebar: () =>
    set((s) => {
      const next = !s.sidebarCollapsed;
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebar_collapsed", next ? "1" : "0");
      }
      return { sidebarCollapsed: next };
    }),
  setSidebarOpen: (v) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_open", v ? "1" : "0");
    }
    set({ sidebarOpen: v });
  },
  toggleSidebarOpen: () =>
    set((s) => {
      const next = !s.sidebarOpen;
      if (typeof window !== "undefined") {
        localStorage.setItem("sidebar_open", next ? "1" : "0");
      }
      return { sidebarOpen: next };
    }),
  setShowCreateModal: (v) => set({ showCreateModal: v }),
}));
