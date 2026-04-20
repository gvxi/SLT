"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { taskKeys } from "@/lib/queryKeys";
import type { Task } from "@/types";

type TaskFilters = { status?: string; priority?: string; assignee_id?: string };

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null)) as Record<string, string>
      );
      const res = await apiFetch(`tasks${params.size ? `?${params}` : ""}`);
      return res.json() as Promise<Task[]>;
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
    mutationFn: async (body: Partial<Task>) => {
      const res = await apiFetch("tasks", { method: "POST", body: JSON.stringify(body) });
      return res.json() as Promise<Task>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Task> & { id: string }) => {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() }),
  });
}
