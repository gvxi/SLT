"use client";

import { Box, Paper, Typography, Chip, Button, Divider, Skeleton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTranslation } from "react-i18next";
import TaskCard from "./TaskCard";
import type { Task, TaskStatus } from "@/types";

interface KanbanColumnProps {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  isLoading: boolean;
  onTaskClick: (taskId: string) => void;
  onAddTask: () => void;
}

export default function KanbanColumn({
  id,
  label,
  tasks,
  isLoading,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const { t } = useTranslation();
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Paper
      elevation={0}
      sx={{
        minWidth: 272,
        width: 272,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: isOver ? "action.hover" : "grey.50",
        border: "1px solid",
        borderColor: isOver ? "primary.main" : "divider",
        borderRadius: 1,
        transition: "border-color 120ms, background-color 120ms",
        maxHeight: "calc(100vh - 220px)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{ px: 1.5, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Chip
          label={isLoading ? "—" : tasks.length}
          size="small"
          variant="outlined"
          sx={{ borderRadius: 1, height: 20, fontSize: 11, minWidth: 28, "& .MuiChip-label": { px: 0.75 } }}
        />
      </Box>

      <Divider />

      <Box ref={setNodeRef} sx={{ flex: 1, overflowY: "auto", p: 1 }}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={72} sx={{ mb: 1, borderRadius: 1 }} />
              ))
            : tasks.length === 0
            ? (
                <Box sx={{ py: 3, textAlign: "center" }}>
                  <Typography variant="caption" color="text.disabled">
                    {t("tasks.noTasks")}
                  </Typography>
                </Box>
              )
            : tasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
              ))}
        </SortableContext>
      </Box>

      <Divider />
      <Box sx={{ p: 0.75 }}>
        <Button
          fullWidth
          size="small"
          startIcon={<AddIcon sx={{ fontSize: "16px !important" }} />}
          onClick={onAddTask}
          sx={{
            justifyContent: "flex-start",
            color: "text.secondary",
            fontWeight: 400,
            fontSize: 13,
            py: 0.5,
            "&:hover": { color: "text.primary", bgcolor: "action.hover" },
          }}
        >
          {t("tasks.newTask")}
        </Button>
      </Box>
    </Paper>
  );
}
