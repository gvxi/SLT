"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogActions,
  Avatar,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useProfiles } from "@/hooks/useProfiles";
import { apiFetch } from "@/lib/api";
import type { TaskStatus, TaskPriority, TaskChecklist } from "@/types";

const formSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  status: z.enum(["backlog", "in_progress", "review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useTranslation();
  const router = useRouter();

  const { data: task, isLoading } = useTask(id);
  const { data: profiles = [] } = useProfiles();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [checklists, setChecklists] = useState<TaskChecklist[]>([]);
  const [newChecklistLabel, setNewChecklistLabel] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", description: "", status: "backlog", priority: "medium" },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        assignee_id: task.assignee_id,
        due_date: task.due_date,
      });
      setChecklists(task.task_checklists ?? []);
    }
  }, [task, reset]);

  const onSubmit = async (values: FormValues) => {
    await updateTask.mutateAsync({ id, ...values });
    router.push("/tasks");
  };

  const handleDelete = async () => {
    await deleteTask.mutateAsync(id);
    router.push("/tasks");
  };

  const handleToggleChecklist = async (item: TaskChecklist) => {
    const next = { ...item, is_done: !item.is_done };
    setChecklists((prev) => prev.map((c) => (c.id === item.id ? next : c)));
    try {
      await apiFetch(`tasks/${id}/checklists/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_done: next.is_done }),
      });
    } catch {
      setChecklists((prev) => prev.map((c) => (c.id === item.id ? item : c)));
    }
  };

  const handleAddChecklist = async () => {
    if (!newChecklistLabel.trim()) return;
    try {
      const res = await apiFetch(`tasks/${id}/checklists`, {
        method: "POST",
        body: JSON.stringify({ label: newChecklistLabel.trim(), sort_order: checklists.length }),
      });
      const newItem: TaskChecklist = await res.json();
      setChecklists((prev) => [...prev, newItem]);
      setNewChecklistLabel("");
    } catch {
      // handled silently
    }
  };

  const handleDeleteChecklist = async (item: TaskChecklist) => {
    setChecklists((prev) => prev.filter((c) => c.id !== item.id));
    try {
      await apiFetch(`tasks/${id}/checklists/${item.id}`, { method: "DELETE" });
    } catch {
      setChecklists((prev) => [...prev, item]);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ pt: 4 }}>
        <Typography color="text.secondary">{t("common.noData")}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 640 }}>
      {/* Back nav */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton size="small" onClick={() => router.push("/tasks")}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          {t("nav.tasks")}
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Controller
          name="title"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t("tasks.title")}
              size="small"
              fullWidth
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("tasks.description")}
              size="small"
              fullWidth
              multiline
              rows={3}
            />
          )}
        />

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormControl size="small" fullWidth>
                <InputLabel>{t("common.status")}</InputLabel>
                <Select {...field} label={t("common.status")}>
                  {(["backlog", "in_progress", "review", "done"] as TaskStatus[]).map((s) => (
                    <MenuItem key={s} value={s}>
                      {t(`tasks.${s}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <FormControl size="small" fullWidth>
                <InputLabel>{t("tasks.priority")}</InputLabel>
                <Select {...field} label={t("tasks.priority")}>
                  {(["low", "medium", "high", "urgent"] as TaskPriority[]).map((p) => (
                    <MenuItem key={p} value={p}>
                      {t(`tasks.${p}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Box>

        <Controller
          name="assignee_id"
          control={control}
          render={({ field }) => (
            <FormControl size="small" fullWidth>
              <InputLabel>{t("tasks.assignee")}</InputLabel>
              <Select
                {...field}
                value={field.value ?? ""}
                label={t("tasks.assignee")}
                onChange={(e) => field.onChange(e.target.value || null)}
              >
                <MenuItem value="">
                  <em>{t("tasks.unassigned")}</em>
                </MenuItem>
                {profiles.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Avatar src={p.avatar_url ?? undefined} sx={{ width: 20, height: 20, fontSize: 10 }}>
                        {p.full_name.charAt(0).toUpperCase()}
                      </Avatar>
                      {p.full_name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />

        <Controller
          name="due_date"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value || null)}
              label={t("tasks.dueDate")}
              type="date"
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
        />

        <Divider />

        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t("tasks.checklist")}
        </Typography>

        {checklists.length > 0 && (
          <List dense disablePadding>
            {[...checklists]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((item) => (
                <ListItem key={item.id} disablePadding sx={{ py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Checkbox
                      size="small"
                      checked={item.is_done}
                      onChange={() => handleToggleChecklist(item)}
                      sx={{ p: 0 }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        variant: "body2",
                        sx: {
                          textDecoration: item.is_done ? "line-through" : "none",
                          color: item.is_done ? "text.disabled" : "text.primary",
                        },
                      },
                    }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteChecklist(item)}
                      sx={{ opacity: 0.5, "&:hover": { opacity: 1 } }}
                    >
                      <DeleteIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
        )}

        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder={t("tasks.addChecklist")}
            value={newChecklistLabel}
            onChange={(e) => setNewChecklistLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddChecklist();
              }
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={handleAddChecklist}
            disabled={!newChecklistLabel.trim()}
            sx={{ flexShrink: 0, minWidth: 40, px: 1 }}
          >
            <AddIcon fontSize="small" />
          </Button>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, pt: 1 }}>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => setConfirmDelete(true)}
          >
            {t("common.delete")}
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="outlined" size="small" onClick={() => router.push("/tasks")}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="contained" size="small" disabled={isSubmitting || !isDirty}>
              {t("common.save")}
            </Button>
          </Box>
        </Box>
      </Box>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600, pb: 1 }}>
          {t("tasks.confirmDelete")}
        </DialogTitle>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button size="small" onClick={() => setConfirmDelete(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteTask.isPending}
          >
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
