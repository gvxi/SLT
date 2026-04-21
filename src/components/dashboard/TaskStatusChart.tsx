"use client";

import { Card, CardContent, Typography, Box, Skeleton, useTheme } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTranslation } from "react-i18next";

interface Props {
  data: { backlog: number; in_progress: number; review: number; done: number };
  loading?: boolean;
}

export default function TaskStatusChart({ data, loading }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  const chartData = [
    { status: "backlog", label: t("tasks.backlog"), count: data.backlog, color: theme.palette.text.disabled },
    { status: "in_progress", label: t("tasks.in_progress"), count: data.in_progress, color: theme.palette.primary.main },
    { status: "review", label: t("tasks.review"), count: data.review, color: theme.palette.warning.main },
    { status: "done", label: t("tasks.done"), count: data.done, color: theme.palette.success.main },
  ];

  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, fontSize: 13 }}>
          {t("dashboard.tasksByStatus")}
        </Typography>
        {loading ? (
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
        ) : (
          <Box sx={{ width: "100%", height: 200, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: theme.palette.action.hover }}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: `1px solid ${theme.palette.divider}`,
                    background: theme.palette.background.paper,
                  }}
                  formatter={(val: number) => [val, t("tasks.tasks")]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
