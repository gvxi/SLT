"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { taskKeys } from "@/lib/queryKeys";
import type { Task, LineItemDraft } from "@/types";

export type TaskFilters = {
  status?: string;
  priority?: string;
  assignee_id?: string;
  search?: string;
  sort?: "asc" | "desc";
  month?: number;
  year?: number;
  page?: number;
};

export type TasksPage = { data: Task[]; total: number; page: number; page_size: number };
export type TaskMonthCount = { year: number; month: number; count: number };
export type TaskStats = { backlog: number; in_progress: number; review: number; done: number };

export function useTaskStats() {
  return useQuery({
    queryKey: [...taskKeys.all, "stats"],
    queryFn: async () => {
      const res = await apiFetch("tasks/stats");
      return res.json() as Promise<TaskStats>;
    },
  });
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const entries = Object.entries(filters).filter(([, v]) => v != null && v !== "");
      const params = new URLSearchParams(
        entries.map(([k, v]) => [k, String(v)])
      );
      const res = await apiFetch(`tasks${params.size ? `?${params}` : ""}`);
      return res.json() as Promise<TasksPage>;
    },
  });
}

export function useTaskMonthCounts() {
  return useQuery({
    queryKey: [...taskKeys.all, "months"],
    queryFn: async () => {
      const res = await apiFetch("tasks/months");
      return res.json() as Promise<TaskMonthCount[]>;
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const res = await apiFetch(`tasks/${id}`);
      return res.json() as Promise<Task>;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Task> & { items?: LineItemDraft[] }) => {
      const res = await apiFetch("tasks", { method: "POST", body: JSON.stringify(body) });
      return res.json() as Promise<Task>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.lists() });
      qc.invalidateQueries({ queryKey: [...taskKeys.all, "months"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Task> & { id: string; items?: LineItemDraft[] }) => {
      const res = await apiFetch(`tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      return res.json() as Promise<Task>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: taskKeys.lists() });
      qc.invalidateQueries({ queryKey: taskKeys.detail(data.id) });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`tasks/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.lists() });
      qc.invalidateQueries({ queryKey: [...taskKeys.all, "months"] });
    },
  });
}
