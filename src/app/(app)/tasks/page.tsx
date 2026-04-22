"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Pagination,
  Skeleton,
  Chip,
  Grid,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useProfiles } from "@/hooks/useProfiles";
import { useTasks, useTaskMonthCounts, useTaskStats } from "@/hooks/useTasks";
import TaskListItem from "@/components/tasks/TaskListItem";
import TaskDrawer from "@/components/tasks/TaskDrawer";
import CollapsibleFilters from "@/components/shared/CollapsibleFilters";
import type { TaskStatus } from "@/types";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_NAMES_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function TasksPageInner() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read from URL
  const page       = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const search     = searchParams.get("search") ?? "";
  const status     = searchParams.get("status") ?? "";
  const priority   = searchParams.get("priority") ?? "";
  const assigneeId = searchParams.get("assignee_id") ?? "";
  const sort       = (searchParams.get("sort") ?? "desc") as "asc" | "desc";
  const month      = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;
  const year       = searchParams.get("year")  ? Number(searchParams.get("year"))  : undefined;

  // Drawer state
  const [drawerTaskId, setDrawerTaskId]   = useState<string | null>(null);
  const [createStatus, setCreateStatus]   = useState<TaskStatus | null>(null);
  const isDrawerOpen = drawerTaskId !== null || createStatus !== null;

  // Auto-open on ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateStatus("backlog");
      const p = new URLSearchParams(searchParams.toString());
      p.delete("new");
      router.replace(`${pathname}?${p.toString()}`);
    }
  }, [searchParams, router, pathname]);

  const setParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "") {
          p.delete(k);
        } else {
          p.set(k, v);
        }
      }
      // Reset page on filter changes (not on page change itself)
      if (!("page" in updates)) p.set("page", "1");
      router.replace(`${pathname}?${p.toString()}`);
    },
    [searchParams, router, pathname]
  );

  // Data
  const { data: profilesData = [] } = useProfiles();
  const { data: monthCounts = [] } = useTaskMonthCounts();
  const { data: statsData } = useTaskStats();
  const { data: tasksPage, isLoading } = useTasks({
    search: search || undefined,
    status: status || undefined,
    priority: priority || undefined,
    assignee_id: assigneeId || undefined,
    sort,
    month,
    year,
    page,
  });

  const tasks      = tasksPage?.data ?? [];
  const total      = tasksPage?.total ?? 0;
  const pageSize   = tasksPage?.page_size ?? 20;
  const pageCount  = Math.max(1, Math.ceil(total / pageSize));

  // Unique years from month counts
  const years = Array.from(new Set(monthCounts.map((m) => m.year))).sort((a, b) => b - a);

  const handleCloseDrawer = () => {
    setDrawerTaskId(null);
    setCreateStatus(null);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t("nav.tasks")}
          {total > 0 && (
            <Typography component="span" variant="body2" sx={{ ml: 1, color: "text.secondary", fontWeight: 400 }}>
              {total}
            </Typography>
          )}
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setCreateStatus("backlog")}
        >
          {t("tasks.newTask")}
        </Button>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {([
          { key: "backlog",     label: t("tasks.backlog"),     icon: <HourglassEmptyOutlinedIcon sx={{ fontSize: 18 }} />, color: "text.secondary" },
          { key: "in_progress", label: t("tasks.in_progress"), icon: <PlayCircleOutlineIcon     sx={{ fontSize: 18 }} />, color: "primary.main" },
          { key: "review",      label: t("tasks.review"),      icon: <RateReviewOutlinedIcon    sx={{ fontSize: 18 }} />, color: "warning.main" },
          { key: "done",        label: t("tasks.done"),        icon: <CheckCircleOutlineIcon    sx={{ fontSize: 18 }} />, color: "success.main" },
        ] as const).map(({ key, label, icon, color }) => (
          <Grid key={key} size={{ xs: 6, sm: 3 }}>
            <Box
              onClick={() => setParam({ status: status === key ? undefined : key })}
              sx={{
                border: "1px solid",
                borderColor: status === key ? "primary.main" : "divider",
                borderRadius: 1.5,
                px: 1.75,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                bgcolor: status === key ? "primary.main" : "background.paper",
                cursor: "pointer",
                transition: "border-color 0.15s",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <Box sx={{ color: status === key ? "primary.contrastText" : color, lineHeight: 0, flexShrink: 0 }}>{icon}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {statsData ? (
                  <Typography sx={{ fontWeight: 700, fontSize: 17, lineHeight: 1.2, color: status === key ? "primary.contrastText" : "text.primary" }}>
                    {statsData[key]}
                  </Typography>
                ) : (
                  <Skeleton variant="text" width={28} height={24} />
                )}
                <Typography variant="caption" sx={{ fontSize: 11, color: status === key ? "rgba(255,255,255,0.8)" : "text.secondary", display: "block" }}>
                  {label}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Search + Sort */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
        <TextField
          size="small"
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setParam({ search: e.target.value })}
          sx={{ flex: 1, minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <ToggleButtonGroup
          size="small"
          exclusive
          value={sort}
          onChange={(_, v) => v && setParam({ sort: v })}
        >
          <ToggleButton value="desc" sx={{ px: { xs: 1, sm: 1.5 } }}>
            <ArrowDownwardIcon sx={{ fontSize: 16, mr: { xs: 0, sm: 0.5 } }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {t("tasks.newest", { defaultValue: "Newest" })}
            </Box>
          </ToggleButton>
          <ToggleButton value="asc" sx={{ px: { xs: 1, sm: 1.5 } }}>
            <ArrowUpwardIcon sx={{ fontSize: 16, mr: { xs: 0, sm: 0.5 } }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {t("tasks.oldest", { defaultValue: "Oldest" })}
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Filters */}
      <CollapsibleFilters activeCount={[status, priority, assigneeId, year ? String(year) : "", month ? String(month) : ""].filter(Boolean).length}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 1.5 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>{t("common.status")}</InputLabel>
            <Select
              value={status}
              label={t("common.status")}
              onChange={(e) => setParam({ status: e.target.value })}
            >
              <MenuItem value="">{t("tasks.allStatuses", { defaultValue: "All statuses" })}</MenuItem>
              {(["backlog", "in_progress", "review", "done"] as const).map((s) => (
                <MenuItem key={s} value={s}>{t(`tasks.${s}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>{t("tasks.priority")}</InputLabel>
            <Select
              value={priority}
              label={t("tasks.priority")}
              onChange={(e) => setParam({ priority: e.target.value })}
            >
              <MenuItem value="">{t("tasks.allPriorities")}</MenuItem>
              {(["low", "medium", "high", "urgent"] as const).map((p) => (
                <MenuItem key={p} value={p}>{t(`tasks.${p}`)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>{t("tasks.assignee")}</InputLabel>
            <Select
              value={assigneeId}
              label={t("tasks.assignee")}
              onChange={(e) => setParam({ assignee_id: e.target.value })}
            >
              <MenuItem value="">{t("tasks.allAssignees")}</MenuItem>
              {profilesData.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.full_name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Year filter */}
          {years.length > 0 && (
            <FormControl size="small" fullWidth>
              <InputLabel>{t("tasks.year", { defaultValue: "Year" })}</InputLabel>
              <Select
                value={year ?? ""}
                label={t("tasks.year", { defaultValue: "Year" })}
                onChange={(e) => setParam({ year: e.target.value ? String(e.target.value) : undefined, month: undefined })}
              >
                <MenuItem value="">{t("tasks.allYears", { defaultValue: "All years" })}</MenuItem>
                {years.map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* Month chips (only when year is selected) */}
        {year && (
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {monthCounts
              .filter((m) => m.year === year)
              .sort((a, b) => a.month - b.month)
              .map((m) => {
                const label = isAr ? MONTH_NAMES_AR[m.month - 1] : MONTH_NAMES[m.month - 1];
                const active = month === m.month;
                return (
                  <Chip
                    key={m.month}
                    label={`${label} (${m.count})`}
                    size="small"
                    variant={active ? "filled" : "outlined"}
                    color={active ? "primary" : "default"}
                    onClick={() =>
                      setParam({ month: active ? undefined : String(m.month) })
                    }
                    sx={{ fontSize: 12 }}
                  />
                );
              })}
          </Box>
        )}
      </CollapsibleFilters>

      {/* List */}
      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={66} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      ) : tasks.length === 0 ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {t("tasks.noTasks")}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              onClick={setDrawerTaskId}
            />
          ))}
        </Box>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, v) => setParam({ page: String(v) })}
            size="small"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      <TaskDrawer
        open={isDrawerOpen}
        taskId={drawerTaskId}
        initialStatus={createStatus ?? "backlog"}
        onClose={handleCloseDrawer}
      />
    </Box>
  );
}

export default function TasksPage() {
  return (
    <Suspense>
      <TasksPageInner />
    </Suspense>
  );
}


