import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { transferKeys, storageKeys } from "@/lib/queryKeys";
import type { StorageTransfer } from "@/types";

export function useTransfers() {
  return useQuery<StorageTransfer[]>({
    queryKey: transferKeys.lists(),
    queryFn: async () => {
      const res = await apiFetch("transfers");
      return res.json() as Promise<StorageTransfer[]>;
    },
  });
}

export function useStorageTransfers(storageId: string | undefined) {
  return useQuery<StorageTransfer[]>({
    queryKey: [...transferKeys.lists(), { storageId }],
    queryFn: async () => {
      const res = await apiFetch(`transfers?storage_id=${storageId}`);
      return res.json() as Promise<StorageTransfer[]>;
    },
    enabled: !!storageId,
  });
}

export function useTransfer(id: string | undefined) {
  return useQuery<StorageTransfer>({
    queryKey: transferKeys.detail(id ?? ""),
    queryFn: async () => {
      const res = await apiFetch(`transfers/${id}`);
      return res.json() as Promise<StorageTransfer>;
    },
    enabled: !!id,
  });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      from_storage_id: string;
      to_storage_id: string;
      notes?: string | null;
      items: { product_id: string; qty: number; sort_order: number }[];
    }) => {
      const res = await apiFetch("transfers", { method: "POST", body: JSON.stringify(body) });
      return res.json() as Promise<StorageTransfer>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: transferKeys.lists() });
      qc.invalidateQueries({ queryKey: storageKeys.lists() });
      qc.invalidateQueries({ queryKey: storageKeys.all });
    },
  });
}
