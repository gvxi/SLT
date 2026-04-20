"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { quotationKeys } from "@/lib/queryKeys";
import type { Quotation } from "@/types";

type QuotationFilters = { status?: string; client_id?: string };

export function useQuotations(filters: QuotationFilters = {}) {
  return useQuery({
    queryKey: quotationKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null)) as Record<string, string>
      );
      const res = await apiFetch(`quotations${params.size ? `?${params}` : ""}`);
      return res.json() as Promise<Quotation[]>;
    },
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: quotationKeys.detail(id),
    queryFn: async () => {
      const res = await apiFetch(`quotations/${id}`);
      return res.json() as Promise<Quotation>;
    },
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Quotation> & { items?: unknown[] }) => {
      const res = await apiFetch("quotations", { method: "POST", body: JSON.stringify(body) });
      return res.json() as Promise<Quotation>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quotationKeys.lists() }),
  });
}

export function useUpdateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Quotation> & { id: string }) => {
      const res = await apiFetch(`quotations/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      return res.json() as Promise<Quotation>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: quotationKeys.lists() });
      qc.invalidateQueries({ queryKey: quotationKeys.detail(data.id) });
    },
  });
}

export function useDeleteQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`quotations/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quotationKeys.lists() }),
  });
}
