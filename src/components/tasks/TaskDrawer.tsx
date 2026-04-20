"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogActions,
  Avatar,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useTask, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useProfiles } from "@/hooks/useProfiles";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";
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

interface TaskDrawerProps {
  open: boolean;
  onClose: () => void;
  taskId: string | null;
  initialStatus?: TaskStatus;
}

export default function TaskDrawer({
  open,
  onClose,
  taskId,
  initialStatus = "backlog",
}: TaskDrawerProps) {
  const { t } = useTranslation();
  const isEditing = !!taskId;

  const { data: task, isLoading } = useTask(taskId ?? "");
  const { data: profiles = [] } = useProfiles();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [checklists, setChecklists] = useState<TaskChecklist[]>([]);
  const [newChecklistLabel, setNewChecklistLabel] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: initialStatus,
      priority: "medium",
      assignee_id: null,
      due_date: null,
    },
  });

  useEffect(() => {
    if (task && isEditing) {
      reset({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        assignee_id: task.assignee_id,
        due_date: task.due_date,
      });
      setChecklists(task.task_checklists ?? []);
    } else if (!isEditing) {
      reset({
        title: "",
        description: "",
        status: initialStatus,
        priority: "medium",
        assignee_id: null,
        due_date: null,
      });
      setChecklists([]);
    }
  }, [task, isEditing, initialStatus, reset]);

  const onSubmit = async (values: FormValues) => {
    if (isEditing && taskId) {
      await updateTask.mutateAsync({ id: taskId, ...values });
    } else {
      await createTask.mutateAsync(values);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (taskId) {
      await deleteTask.mutateAsync(taskId);
      setConfirmDelete(false);
      onClose();
    }
  };

  const handleToggleChecklist = async (item: TaskChecklist) => {
    const next = { ...item, is_done: !item.is_done };
    setChecklists((prev) => prev.map((c) => (c.id === item.id ? next : c)));
    try {
      await apiFetch(`tasks/${taskId}/checklists/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_done: next.is_done }),
      });
    } catch {
      setChecklists((prev) => prev.map((c) => (c.id === item.id ? item : c)));
    }
  };

  const handleAddChecklist = async () => {
    if (!newChecklistLabel.trim() || !taskId) return;
    try {
      const res = await apiFetch(`tasks/${taskId}/checklists`, {
        method: "POST",
        body: JSON.stringify({ label: newChecklistLabel.trim(), sort_order: checklists.length }),
      });
      const newItem: TaskChecklist = await res.json();
      setChecklists((prev) => [...prev, newItem]);
      setNewChecklistLabel("");
    } catch {
      // handled silently — item stays in input
    }
  };

  const handleDeleteChecklist = async (item: TaskChecklist) => {
    setChecklists((prev) => prev.filter((c) => c.id !== item.id));
    try {
      await apiFetch(`tasks/${taskId}/checklists/${item.id}`, { method: "DELETE" });
    } catch {
      setChecklists((prev) => [...prev, item]);
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        slotProps={{
          paper: { sx: { width: { xs: "100%", sm: 480 }, display: "flex", flexDirection: "column" } },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2.5,
            py: 1.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {isEditing ? t("common.edit") : t("tasks.newTask")}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider />

        {isLoading && isEditing ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2.5,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Title */}
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
                  autoFocus={!isEditing}
                />
              )}
            />

            {/* Description */}
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

            {/* Status + Priority */}
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

            {/* Assignee */}
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
                          <Avatar
                            src={p.avatar_url ?? undefined}
                            sx={{ width: 20, height: 20, fontSize: 10 }}
                          >
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

            {/* Due Date */}
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

            {/* Checklist (edit mode only) */}
            {isEditing && (
              <>
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
              </>
            )}

            {/* Actions */}
            <Box sx={{ mt: "auto", pt: 1.5, display: "flex", justifyContent: "space-between", gap: 1 }}>
              {isEditing && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={() => setConfirmDelete(true)}
                >
                  {t("common.delete")}
                </Button>
              )}
              <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
                <Button variant="outlined" size="small" onClick={onClose}>
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  disabled={isSubmitting}
                >
                  {t("common.save")}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Delete confirmation */}
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
    </>
  );
}
