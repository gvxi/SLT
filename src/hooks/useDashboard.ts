import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface DashboardStats {
  openTasks: number;
  totalProducts: number;
  unpaidInvoices: number;
  pendingQuotations: number;
  totalRevenue: number;
  tasks: { backlog: number; in_progress: number; review: number; done: number };
  monthlyRevenue: { month: string; revenue: number }[];
  recentActivity: {
    id: string;
    type: "invoice" | "task";
    label: string;
    sub: string;
    date: string;
  }[];
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiFetch("dashboard");
      return res.json();
    },
    staleTime: 30_000,
  });
}
