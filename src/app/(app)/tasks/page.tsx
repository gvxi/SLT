"use client";

import { Suspense, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import TaskFilters from "@/components/tasks/TaskFilters";
import TaskDrawer from "@/components/tasks/TaskDrawer";
import type { TaskStatus } from "@/types";

export default function TasksPage() {
  const { t } = useTranslation();
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [createStatus, setCreateStatus] = useState<TaskStatus | null>(null);

  const isDrawerOpen = drawerTaskId !== null || createStatus !== null;

  const handleClose = () => {
    setDrawerTaskId(null);
    setCreateStatus(null);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t("nav.tasks")}
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

      <Suspense>
        <TaskFilters />
        <KanbanBoard onTaskClick={setDrawerTaskId} onAddTask={setCreateStatus} />
      </Suspense>

      <TaskDrawer
        open={isDrawerOpen}
        taskId={drawerTaskId}
        initialStatus={createStatus ?? "backlog"}
        onClose={handleClose}
      />
    </Box>
  );
}

