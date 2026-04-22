"use client";

import { Box, Typography, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Task } from "@/types";

const STATUS_COLOR: Record<string, "default" | "warning" | "info" | "success"> = {
  backlog: "default",
  in_progress: "warning",
  review: "info",
  done: "success",
};

const PRIORITY_COLOR: Record<string, string> = {
  low: "#4caf50",
  medium: "#ff9800",
  high: "#f44336",
  urgent: "#9c27b0",
};

interface Props {
  task: Task;
  onClick: (id: string) => void;
}

export default function TaskListItem({ task, onClick }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const clientName = task.client
    ? (isAr && task.client.name_ar ? task.client.name_ar : task.client.name_en)
    : null;
  const clientPhone = task.client?.phone ?? null;

  const dueDateLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString(isAr ? "ar-SA" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const isOverdue =
    task.due_date &&
    task.status !== "done" &&
    new Date(task.due_date) < new Date();

  return (
    <Box
      onClick={() => onClick(task.id)}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        px: 2,
        py: 1.5,
        cursor: "pointer",
        bgcolor: "background.paper",
        "&:hover": { borderColor: "primary.light" },
      }}
    >
      {/* Priority bar */}
      <Box
        sx={{
          width: 3,
          alignSelf: "stretch",
          borderRadius: 4,
          flexShrink: 0,
          backgroundColor: PRIORITY_COLOR[task.priority] ?? "grey.400",
          minHeight: 36,
        }}
      />

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: Title + Status */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: 13,
              lineHeight: 1.4,
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {task.title}
          </Typography>
          <Chip
            label={t(`tasks.${task.status}`)}
            size="small"
            color={STATUS_COLOR[task.status]}
            variant="outlined"
            sx={{ fontSize: 11, height: 20, flexShrink: 0 }}
          />
        </Box>

        {/* Row 2: Client – phone */}
        {clientName && (
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
            {clientPhone ? `${clientName} – ${clientPhone}` : clientName}
          </Typography>
        )}

        {/* Row 3: Location + Due date */}
        {(task.location || dueDateLabel) && (
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              {task.location ?? ""}
            </Typography>
            {dueDateLabel && (
              <Typography variant="caption" sx={{ color: isOverdue ? "error.main" : "text.disabled" }}>
                {dueDateLabel}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
