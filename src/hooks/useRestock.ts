import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { restockKeys, productKeys } from "@/lib/queryKeys";
import type { RestockReport } from "@/types";

export function useRestockReports() {
  return useQuery<RestockReport[]>({
    queryKey: restockKeys.lists(),
    queryFn: async () => {
      const res = await apiFetch("restock");
      return res.json() as Promise<RestockReport[]>;
    },
  });
}

export function useCreateRestockReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      notes?: string | null;
      items: { product_id: string; qty_before: number; qty_after: number; sort_order: number }[];
    }) => {
      const res = await apiFetch("restock", { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error((err as { error?: string }).error ?? "Unknown error");
      }
      return res.json() as Promise<RestockReport>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: restockKeys.lists() });
      qc.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
