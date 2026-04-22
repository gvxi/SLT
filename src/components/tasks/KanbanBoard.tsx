"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Box } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";
import type { Task, TaskStatus } from "@/types";

const COLUMNS: { id: TaskStatus; labelKey: string }[] = [
  { id: "backlog", labelKey: "tasks.backlog" },
  { id: "in_progress", labelKey: "tasks.in_progress" },
  { id: "review", labelKey: "tasks.review" },
  { id: "done", labelKey: "tasks.done" },
];

interface KanbanBoardProps {
  onTaskClick: (taskId: string) => void;
  onAddTask: (status: TaskStatus) => void;
}

export default function KanbanBoard({ onTaskClick, onAddTask }: KanbanBoardProps) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const priority = searchParams.get("priority") ?? undefined;
  const assignee_id = searchParams.get("assignee_id") ?? undefined;

  const { data: tasksPage, isLoading } = useTasks({ priority, assignee_id });
  const tasks: Task[] = Array.isArray(tasksPage) ? tasksPage : (tasksPage?.data ?? []);
  const updateTask = useUpdateTask();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) ?? null : null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const draggedTask = tasks.find((t) => t.id === (active.id as string));
    if (!draggedTask) return;

    const overId = over.id as string;

    // Dropped over a column
    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (overColumn && draggedTask.status !== overColumn.id) {
      updateTask.mutate({ id: draggedTask.id, status: overColumn.id });
      return;
    }

    // Dropped over a card — move to that card's column
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && overTask.status !== draggedTask.status) {
      updateTask.mutate({ id: draggedTask.id, status: overTask.status });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 1,
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            label={t(col.labelKey)}
            tasks={tasks.filter((t) => t.status === col.id)}
            isLoading={isLoading}
            onTaskClick={onTaskClick}
            onAddTask={() => onAddTask(col.id)}
          />
        ))}
      </Box>

      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeTask ? <TaskCard task={activeTask} onClick={() => {}} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
