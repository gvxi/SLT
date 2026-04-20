"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { productKeys } from "@/lib/queryKeys";
import type { Product } from "@/types";

type ProductFilters = { status?: string };

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null)) as Record<string, string>
      );
      const res = await apiFetch(`products${params.size ? `?${params}` : ""}`);
      return res.json() as Promise<Product[]>;
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const res = await apiFetch(`products/${id}`);
      return res.json() as Promise<Product>;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Product>) => {
      const res = await apiFetch("products", { method: "POST", body: JSON.stringify(body) });
      return res.json() as Promise<Product>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.lists() }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Product> & { id: string }) => {
      const res = await apiFetch(`products/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      return res.json() as Promise<Product>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: productKeys.lists() });
      qc.invalidateQueries({ queryKey: productKeys.detail(data.id) });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`products/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.lists() }),
  });
}
