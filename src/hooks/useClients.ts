"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { clientKeys } from "@/lib/queryKeys";
import type { Client } from "@/types";

export function useClients() {
  return useQuery({
    queryKey: clientKeys.list({}),
    queryFn: async () => {
      const res = await apiFetch("clients");
      return res.json() as Promise<Client[]>;
    },
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: async () => {
      const res = await apiFetch(`clients/${id}`);
      return res.json() as Promise<Client>;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Client>) => {
      const res = await apiFetch("clients", { method: "POST", body: JSON.stringify(body) });
      return res.json() as Promise<Client>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.lists() }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Client> & { id: string }) => {
      const res = await apiFetch(`clients/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      return res.json() as Promise<Client>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: clientKeys.lists() });
      qc.invalidateQueries({ queryKey: clientKeys.detail(data.id) });
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`clients/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.lists() }),
  });
}
