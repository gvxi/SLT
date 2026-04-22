import { create } from "zustand";

export type ToastSeverity = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  severity: ToastSeverity;
}

interface ToastState {
  toasts: ToastItem[];
  add: (message: string, severity?: ToastSeverity) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  add: (message, severity = "success") =>
    set((s) => ({
      toasts: [...s.toasts, { id: crypto.randomUUID(), message, severity }],
    })),
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Call from anywhere (hooks, event handlers) without needing the hook */
export const toast = (message: string, severity: ToastSeverity = "success") =>
  useToastStore.getState().add(message, severity);
