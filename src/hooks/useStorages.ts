import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { storageKeys } from "@/lib/queryKeys";
import type { Storage, ProductStorage } from "@/types";

export function useStorages() {
  return useQuery<Storage[]>({
    queryKey: storageKeys.lists(),
    queryFn: async () => {
      const res = await apiFetch("storages");
      return res.json() as Promise<Storage[]>;
    },
  });
}

export function useStorage(id: string | undefined) {
  return useQuery<Storage>({
    queryKey: storageKeys.detail(id ?? ""),
    queryFn: async () => {
      const res = await apiFetch(`storages/${id}`);
      return res.json() as Promise<Storage>;
    },
    enabled: !!id,
  });
}

export function useStorageProducts(id: string | undefined) {
  return useQuery<ProductStorage[]>({
    queryKey: storageKeys.products(id ?? ""),
    queryFn: async () => {
      const res = await apiFetch(`storages/${id}/products`);
      return res.json() as Promise<ProductStorage[]>;
    },
    enabled: !!id,
  });
}

export function useCreateStorage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Storage>) => {
      const res = await apiFetch("storages", { method: "POST", body: JSON.stringify(body) });
      return res.json() as Promise<Storage>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: storageKeys.lists() }),
  });
}

export function useUpdateStorage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Storage>) => {
      const res = await apiFetch(`storages/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      return res.json() as Promise<Storage>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: storageKeys.lists() });
      qc.invalidateQueries({ queryKey: storageKeys.detail(id) });
    },
  });
}

export function useDeleteStorage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`storages/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: storageKeys.lists() }),
  });
}
