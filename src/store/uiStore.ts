import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  language: "en" | "ar";
  themeMode: "light" | "dark";
  scale: 1 | 1.125 | 1.25;
  sidebarOpen: boolean;
  startPage: string;
  setLanguage: (lang: "en" | "ar") => void;
  toggleTheme: () => void;
  setScale: (scale: 1 | 1.125 | 1.25) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setStartPage: (page: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: "en",
      themeMode: "light",
      scale: 1 as 1 | 1.125 | 1.25,
      sidebarOpen: true,
      startPage: "dashboard",
      setLanguage: (lang) => set({ language: lang }),
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === "light" ? "dark" : "light",
        })),
      setScale: (scale) => set({ scale }),
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
        scale: state.scale,
        startPage: state.startPage,
      }),
    }
  )
);
