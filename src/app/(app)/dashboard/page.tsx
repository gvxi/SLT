"use client";

import { Grid, Typography, Box } from "@mui/material";
import {
  AssignmentOutlined as TaskIcon,
  Inventory2Outlined as ProductIcon,
  ReceiptOutlined as InvoiceIcon,
  RequestQuoteOutlined as QuotationIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useDashboardStats } from "@/hooks/useDashboard";
import KpiCard from "@/components/dashboard/KpiCard";
import TaskStatusChart from "@/components/dashboard/TaskStatusChart";
import RevenueChart from "@/components/dashboard/RevenueChart";
import RecentActivity from "@/components/dashboard/RecentActivity";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useDashboardStats();

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t("nav.dashboard")}
        </Typography>
      </Box>

      {/* KPI cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            title={t("dashboard.openTasks")}
            value={data?.openTasks ?? 0}
            Icon={TaskIcon}
            color="primary.main"
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            title={t("dashboard.totalProducts")}
            value={data?.totalProducts ?? 0}
            Icon={ProductIcon}
            color="success.main"
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            title={t("dashboard.unpaidInvoices")}
            value={data?.unpaidInvoices ?? 0}
            Icon={InvoiceIcon}
            color="warning.main"
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <KpiCard
            title={t("dashboard.totalRevenue")}
            value={`${(data?.totalRevenue ?? 0).toFixed(3)} OMR`}
            Icon={QuotationIcon}
            color="secondary.main"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TaskStatusChart
            data={data?.tasks ?? { backlog: 0, in_progress: 0, review: 0, done: 0 }}
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <RevenueChart data={data?.monthlyRevenue ?? []} loading={isLoading} />
        </Grid>
      </Grid>

      {/* Recent activity */}
      <RecentActivity items={data?.recentActivity ?? []} loading={isLoading} />
    </Box>
  );
}

