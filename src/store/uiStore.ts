import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  language: "en" | "ar";
  themeMode: "light" | "dark";
  sidebarOpen: boolean;
  startPage: string;
  setLanguage: (lang: "en" | "ar") => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setStartPage: (page: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: "en",
      themeMode: "light",
      sidebarOpen: true,
      startPage: "dashboard",
      setLanguage: (lang) => set({ language: lang }),
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === "light" ? "dark" : "light",
        })),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setStartPage: (page) => set({ startPage: page }),
    }),
    {
      name: "slt-ui-store",
      partialize: (state) => ({
        language: state.language,
        themeMode: state.themeMode,
        startPage: state.startPage,
      }),
    }
  )
);
