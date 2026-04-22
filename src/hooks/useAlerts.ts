import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Alert {
  id: string;
  type: string;
  severity: "info" | "warning" | "error";
  title: string;
  body: string;
  entity_type: string;
  entity_id: string;
  link: string | null;
  is_read: boolean;
  dismissed_at: string | null;
  created_at: string;
}

export interface AlertsResponse {
  data: Alert[];
  total: number;
}

export function useAlerts(includeRead = true) {
  return useQuery({
    queryKey: ["alerts", includeRead],
    queryFn: async () => {
      const res = await apiFetch(
        `alerts${includeRead ? "?include_read=1" : ""}`
      );
      return res.json() as Promise<AlertsResponse>;
    },
    refetchInterval: 60_000, // refresh every minute
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  const { data } = useAlerts(false);
  return (data as AlertsResponse | undefined)?.data.length ?? 0;
}

export function useDismissAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`alerts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useMarkAlertRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

export function useDismissAllAlerts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch("alerts", {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
