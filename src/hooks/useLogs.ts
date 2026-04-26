import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface ActivityLog {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: "created" | "updated" | "deleted";
  summary: string;
  created_at: string;
  profile?: { id: string; full_name: string; avatar_url: string | null } | null;
}

export interface LogsResponse {
  data: ActivityLog[];
  total: number;
  page: number;
  page_size: number;
}

export function useLogs(params?: { limit?: number; entity_type?: string; page?: number }) {
  return useQuery({
    queryKey: ["logs", params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.limit) p.set("limit", String(params.limit));
      if (params?.page) p.set("page", String(params.page));
      if (params?.entity_type) p.set("entity_type", params.entity_type);
      const qs = p.size ? `?${p}` : "";
      const res = await apiFetch(`logs${qs}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
        throw new Error(body.error ?? `Failed to fetch logs (${res.status})`);
      }
      return res.json() as Promise<LogsResponse>;
    },
    retry: 1,
    staleTime: 30_000,
  });
}
