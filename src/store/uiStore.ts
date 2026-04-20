import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  language: "en" | "ar";
  themeMode: "light" | "dark";
  sidebarOpen: boolean;
  setLanguage: (lang: "en" | "ar") => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: "en",
      themeMode: "light",
      sidebarOpen: true,
      setLanguage: (lang) => set({ language: lang }),
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === "light" ? "dark" : "light",
        })),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: "slt-ui-store",
      partialize: (state) => ({
        language: state.language,
        themeMode: state.themeMode,
      }),
    }
  )
);
