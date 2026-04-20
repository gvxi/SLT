"use client";

import { Paper, Typography, Chip, Avatar, Box, Tooltip } from "@mui/material";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";
import type { Task } from "@/types";

const PRIORITY_COLOR: Record<string, "default" | "warning" | "error" | "primary"> = {
  low: "default",
  medium: "primary",
  high: "warning",
  urgent: "error",
};

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragOverlay?: boolean;
}

export default function TaskCard({ task, onClick, isDragOverlay = false }: TaskCardProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <Paper
      ref={isDragOverlay ? undefined : setNodeRef}
      style={
        isDragOverlay
          ? undefined
          : { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
      }
      {...(isDragOverlay ? {} : { ...attributes, ...listeners })}
      onClick={(e) => {
        if (!isDragOverlay) {
          e.stopPropagation();
          onClick();
        }
      }}
      elevation={isDragOverlay ? 6 : 0}
      sx={{
        p: 1.5,
        mb: 1,
        borderRadius: 1,
        border: "1px solid",
        borderColor: isDragOverlay ? "primary.main" : "divider",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        "&:hover": { borderColor: "primary.light" },
        boxShadow: isDragOverlay ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
      }}
    >
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, lineHeight: 1.4 }}>
        {task.title}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
        <Chip
          label={t(`tasks.${task.priority}`)}
          size="small"
          color={PRIORITY_COLOR[task.priority] ?? "default"}
          variant="outlined"
          sx={{ borderRadius: 1, height: 20, fontSize: 11, "& .MuiChip-label": { px: 0.75 } }}
        />
        {task.due_date && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
            {new Date(task.due_date).toLocaleDateString()}
          </Typography>
        )}
        {task.assignee && (
          <Tooltip title={task.assignee.full_name}>
            <Avatar
              src={task.assignee.avatar_url ?? undefined}
              sx={{ width: 20, height: 20, fontSize: 10, ml: task.due_date ? 0.5 : "auto" }}
            >
              {task.assignee.full_name.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
        )}
      </Box>
    </Paper>
  );
}
