"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { invoiceKeys } from "@/lib/queryKeys";
import type { Invoice } from "@/types";

type InvoiceFilters = { status?: string; client_id?: string };

export function useInvoices(filters: InvoiceFilters = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null)) as Record<string, string>
      );
      const res = await apiFetch(`invoices${params.size ? `?${params}` : ""}`);
      return res.json() as Promise<Invoice[]>;
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: async () => {
      const res = await apiFetch(`invoices/${id}`);
      return res.json() as Promise<Invoice>;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<Invoice> & { items?: unknown[] }) => {
      const res = await apiFetch("invoices", { method: "POST", body: JSON.stringify(body) });
      return res.json() as Promise<Invoice>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.lists() }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<Invoice> & { id: string; items?: unknown[] }) => {
      const res = await apiFetch(`invoices/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      return res.json() as Promise<Invoice>;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: invoiceKeys.lists() });
      qc.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`invoices/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.lists() }),
  });
}
