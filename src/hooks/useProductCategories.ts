"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface ProductCategory {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

const catKeys = {
  all: ["productCategories"] as const,
  list: () => [...catKeys.all, "list"] as const,
};

export function useProductCategories() {
  return useQuery({
    queryKey: catKeys.list(),
    queryFn: async () => {
      const res = await apiFetch("products/categories");
      return res.json() as Promise<ProductCategory[]>;
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; sort_order?: number }) => {
      const res = await apiFetch("products/categories", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return res.json() as Promise<ProductCategory>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: catKeys.all }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; sort_order?: number }) => {
      const res = await apiFetch(`products/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return res.json() as Promise<ProductCategory>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: catKeys.all }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`products/categories/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: catKeys.all }),
  });
}
