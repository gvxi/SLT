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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import { useRouter } from "next/navigation";
import { useTask, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useProfiles } from "@/hooks/useProfiles";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useCreateQuotation } from "@/hooks/useQuotations";
import ClientSelect from "@/components/documents/ClientSelect";
import LineItemsTable from "@/components/documents/LineItemsTable";
import { useTranslation } from "react-i18next";
import type { TaskStatus, TaskPriority, LineItemDraft } from "@/types";

const formSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  status: z.enum(["backlog", "in_progress", "review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  client_id: z.string().uuid().nullable().optional(),
  location: z.string().nullable().optional(),
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
  const router = useRouter();
  const isEditing = !!taskId;

  const { data: task, isLoading } = useTask(taskId ?? "");
  const { data: profiles = [] } = useProfiles();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createInvoice = useCreateInvoice();
  const createQuotation = useCreateQuotation();

  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    { product_id: null, description: "", qty: 1, unit_price: 0 },
  ]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [convertMenuAnchor, setConvertMenuAnchor] = useState<HTMLElement | null>(null);
  const [convertTarget, setConvertTarget] = useState<"invoice" | "quotation" | null>(null);
  const [converting, setConverting] = useState(false);

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
      client_id: null,
      location: null,
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
        client_id: task.client_id,
        location: task.location,
      });
      const items = task.task_items ?? [];
      setLineItems(
        items.length > 0
          ? [...items]
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((i) => ({
                product_id: i.product_id,
                description: i.description,
                qty: i.qty,
                unit_price: i.unit_price,
              }))
          : [{ product_id: null, description: "", qty: 1, unit_price: 0 }]
      );
    } else if (!isEditing) {
      reset({
        title: "",
        description: "",
        status: initialStatus,
        priority: "medium",
        assignee_id: null,
        due_date: null,
        client_id: null,
        location: null,
      });
      setLineItems([{ product_id: null, description: "", qty: 1, unit_price: 0 }]);
    }
  }, [task, isEditing, initialStatus, reset]);

  const onSubmit = async (values: FormValues) => {
    const items = lineItems.filter((i) => i.description.trim() || i.product_id);
    if (isEditing && taskId) {
      await updateTask.mutateAsync({ id: taskId, ...values, items });
    } else {
      await createTask.mutateAsync({ ...values, items });
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

  const handleConvert = async (type: "invoice" | "quotation") => {
    if (!taskId || !task) return;
    setConverting(true);
    setConvertTarget(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const items = lineItems
        .filter((i) => i.description.trim() || i.product_id)
        .map((i, idx) => ({ ...i, sort_order: idx }));

      if (type === "invoice") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createInvoice.mutateAsync({
          client_id: task.client_id,
          location: task.location ?? undefined,
          issue_date: today,
          due_date: dueDate,
          tax_pct: 0,
          discount: 0,
          upfront_payment: 0,
          items,
        } as any);
        onClose();
        router.push("/invoices");
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createQuotation.mutateAsync({
          client_id: task.client_id,
          issue_date: today,
          expiry_date: dueDate,
          tax_pct: 0,
          discount: 0,
          items,
        } as any);
        onClose();
        router.push("/quotations");
      }
    } finally {
      setConverting(false);
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
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            {isEditing && (
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => setConvertMenuAnchor(e.currentTarget)}
                disabled={converting}
                sx={{ fontSize: 12, textTransform: "none", px: 1.25 }}
              >
                {t("tasks.convertTo", { defaultValue: "Convert to…" })}
              </Button>
            )}
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
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
            {/* Location */}
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  label={t("invoices.location")}
                  size="small"
                  fullWidth
                />
              )}
            />

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

            {/* Client (autocomplete with create) */}
            <Controller
              name="client_id"
              control={control}
              render={({ field }) => (
                <ClientSelect
                  value={field.value ?? null}
                  onChange={field.onChange}
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
                  rows={2}
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
                        <MenuItem key={s} value={s}>{t(`tasks.${s}`)}</MenuItem>
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
                        <MenuItem key={p} value={p}>{t(`tasks.${p}`)}</MenuItem>
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

            {/* Products / Line Items */}
            <Divider />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t("invoices.lineItems")}
            </Typography>
            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
              <LineItemsTable items={lineItems} onChange={setLineItems} />
            </Box>

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

      {/* Convert to… menu */}
      <Menu
        anchorEl={convertMenuAnchor}
        open={!!convertMenuAnchor}
        onClose={() => setConvertMenuAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 180 } } }}
      >
        <MenuItem
          dense
          onClick={() => { setConvertTarget("invoice"); setConvertMenuAnchor(null); }}
        >
          <ListItemIcon><ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} /></ListItemIcon>
          <ListItemText>{t("nav.invoices")}</ListItemText>
        </MenuItem>
        <MenuItem
          dense
          onClick={() => { setConvertTarget("quotation"); setConvertMenuAnchor(null); }}
        >
          <ListItemIcon><RequestQuoteOutlinedIcon sx={{ fontSize: 18 }} /></ListItemIcon>
          <ListItemText>{t("nav.quotations")}</ListItemText>
        </MenuItem>
      </Menu>

      {/* Convert confirm */}
      <Dialog open={!!convertTarget} onClose={() => setConvertTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600, pb: 1 }}>
          {t("tasks.convertTo", { defaultValue: "Convert to…" })}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: 13 }}>
            {convertTarget === "invoice"
              ? t("tasks.convertToInvoiceConfirm", { defaultValue: "Create a new invoice from this task? The task will remain unchanged." })
              : t("tasks.convertToQuotationConfirm", { defaultValue: "Create a new quotation from this task? The task will remain unchanged." })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button size="small" onClick={() => setConvertTarget(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => convertTarget && handleConvert(convertTarget)}
            disabled={converting}
          >
            {t("common.confirm", { defaultValue: "Confirm" })}
          </Button>
        </DialogActions>
      </Dialog>

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
