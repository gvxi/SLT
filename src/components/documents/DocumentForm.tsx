"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Grid,
  Divider,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import ClientSelect from "./ClientSelect";
import LineItemsTable from "./LineItemsTable";
import type { Invoice, Quotation, InvoiceStatus, QuotationStatus, LineItemDraft, InvoiceItem, QuotationItem } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────

export type DocType = "invoice" | "quotation";

const INVOICE_STATUSES: InvoiceStatus[] = ["draft", "sent", "paid", "overdue", "cancelled"];
const QUOTATION_STATUSES: QuotationStatus[] = ["draft", "sent", "accepted", "rejected", "expired"];

const formSchema = z.object({
  client_id: z.string().nullable().optional(),
  issue_date: z.string().min(1, "Required"),
  end_date: z.string().min(1, "Required"),
  tax_pct: z.number().min(0).max(100),
  discount: z.number().min(0),
  upfront_payment: z.number().min(0),
  location: z.string().optional(),
  phone_number: z.string().optional(),
  notes_en: z.string().optional(),
  notes_ar: z.string().optional(),
  status: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

export interface TotalsSnapshot {
  subtotal: number;
  taxAmount: number;
  discount: number;
  upfrontPayment: number;
  total: number;
  balance: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function itemsFromInvoice(items?: InvoiceItem[]): LineItemDraft[] {
  if (!items?.length) return [{ product_id: null, description: "", qty: 1, unit_price: 0 }];
  return items.map((it) => ({ product_id: it.product_id ?? null, description: it.description, qty: it.qty, unit_price: it.unit_price }));
}

function itemsFromQuotation(items?: QuotationItem[]): LineItemDraft[] {
  if (!items?.length) return [{ product_id: null, description: "", qty: 1, unit_price: 0 }];
  return items.map((it) => ({ product_id: it.product_id ?? null, description: it.description, qty: it.qty, unit_price: it.unit_price }));
}

// ── Component ──────────────────────────────────────────────────────────────

export interface DocumentFormSubmitData {
  client_id: string | null;
  issue_date: string;
  due_date?: string;
  expiry_date?: string;
  tax_pct: number;
  discount: number;
  upfront_payment: number;
  location?: string;
  phone_number?: string;
  notes_en?: string;
  notes_ar?: string;
  status: string;
  items: LineItemDraft[];
}

interface Props {
  type: DocType;
  mode: "create" | "edit";
  initialData?: Invoice | Quotation;
  onSubmit: (data: DocumentFormSubmitData) => Promise<void>;
  onCancel?: () => void;
  /** HTML form id — lets an external submit button use form="formId" */
  formId?: string;
  /** When true, hides the built-in Save/Cancel buttons */
  hideActions?: boolean;
  /** Called whenever totals change so parent can display them externally */
  onTotalsChange?: (totals: TotalsSnapshot) => void;
}

export default function DocumentForm({ type, mode, initialData, onSubmit, onCancel, formId, hideActions, onTotalsChange }: Props) {
  const { t } = useTranslation();

  const inv = type === "invoice" ? (initialData as Invoice | undefined) : undefined;
  const quo = type === "quotation" ? (initialData as Quotation | undefined) : undefined;

  const today = new Date().toISOString().split("T")[0];
  const defaultEndDate = type === "invoice"
    ? (inv?.due_date ?? today)
    : (quo?.expiry_date ?? today);

  const [lineItems, setLineItems] = useState<LineItemDraft[]>(() =>
    type === "invoice"
      ? itemsFromInvoice(inv?.invoice_items)
      : itemsFromQuotation(quo?.quotation_items)
  );

  const statuses = type === "invoice" ? INVOICE_STATUSES : QUOTATION_STATUSES;

  const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: initialData?.client_id ?? null,
      issue_date: initialData?.issue_date ?? today,
      end_date: defaultEndDate,
      tax_pct: initialData?.tax_pct ?? 0,
      discount: initialData?.discount ?? 0,
      upfront_payment: (initialData as Invoice | undefined)?.upfront_payment ?? 0,
      location: (initialData as Invoice | undefined)?.location ?? "",
      phone_number: (initialData as Invoice | undefined)?.phone_number ?? "",
      notes_en: initialData?.notes_en ?? "",
      notes_ar: initialData?.notes_ar ?? "",
      status: initialData?.status ?? "draft",
    },
  });

  const watchedTaxPct = watch("tax_pct") ?? 0;
  const watchedDiscount = watch("discount") ?? 0;
  const watchedUpfront = watch("upfront_payment") ?? 0;

  // Notify parent of totals changes
  useEffect(() => {
    const sub = lineItems.reduce((s, it) => s + it.qty * it.unit_price, 0);
    const taxAmt = sub * ((Number(watchedTaxPct) || 0) / 100);
    const disc = Number(watchedDiscount) || 0;
    const upfront = Number(watchedUpfront) || 0;
    const total = sub - disc + taxAmt;
    onTotalsChange?.({ subtotal: sub, taxAmount: taxAmt, discount: disc, upfrontPayment: upfront, total, balance: total - upfront });
  }, [lineItems, watchedTaxPct, watchedDiscount, watchedUpfront, onTotalsChange]);

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit({
      client_id: values.client_id ?? null,
      issue_date: values.issue_date,
      ...(type === "invoice" ? { due_date: values.end_date } : { expiry_date: values.end_date }),
      tax_pct: values.tax_pct,
      discount: values.discount,
      upfront_payment: values.upfront_payment,
      location: values.location,
      phone_number: values.phone_number,
      notes_en: values.notes_en,
      notes_ar: values.notes_ar,
      status: values.status,
      items: lineItems,
    });
  };

  const endDateLabel = type === "invoice" ? t("invoices.dueDate") : t("quotations.expiryDate");

  return (
    <Box component="form" id={formId} onSubmit={handleSubmit(handleFormSubmit)} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Details */}
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12, color: "text.secondary", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("invoices.details")}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="client_id"
              control={control}
              render={({ field }) => (
                <ClientSelect
                  value={field.value ?? null}
                  onChange={field.onChange}
                  error={!!errors.client_id}
                  helperText={errors.client_id?.message}
                />
              )}
            />
          </Grid>
          {mode === "edit" && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl size="small" fullWidth>
                    <InputLabel sx={{ fontSize: 13 }}>{t("common.status")}</InputLabel>
                    <Select {...field} label={t("common.status")} sx={{ fontSize: 13 }}>
                      {statuses.map((s) => (
                        <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>
                          {t(`invoices.${s}`, { defaultValue: t(`quotations.${s}`, { defaultValue: s }) })}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="issue_date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("invoices.issueDate")}
                  type="date"
                  size="small"
                  fullWidth
                  error={!!errors.issue_date}
                  helperText={errors.issue_date?.message}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="end_date"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={endDateLabel}
                  type="date"
                  size="small"
                  fullWidth
                  error={!!errors.end_date}
                  helperText={errors.end_date?.message}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name="phone_number"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("invoices.phoneNumber")}
                  size="small"
                  fullWidth
                  slotProps={{
                    input: {
                      dir: "ltr",
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("invoices.location")}
                  size="small"
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Box>

      <Divider />

      {/* Line items */}
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12, color: "text.secondary", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("invoices.lineItems")}
        </Typography>
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
          <LineItemsTable
            items={lineItems}
            onChange={setLineItems}
          />
        </Box>
        {lineItems.length === 0 && (
          <FormHelperText error sx={{ mt: 0.5 }}>{t("invoices.itemsRequired")}</FormHelperText>
        )}
      </Box>

      <Divider />

      {/* Adjustments */}
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12, color: "text.secondary", mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("invoices.adjustments")}
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Controller
              name="tax_pct"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  label={t("invoices.taxPct")}
                  type="number"
                  size="small"
                  fullWidth
                  error={!!errors.tax_pct}
                  helperText={errors.tax_pct?.message}
                  slotProps={{ input: { inputProps: { min: 0, max: 100, step: 0.5 } } }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Controller
              name="discount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  label={t("invoices.discount")}
                  type="number"
                  size="small"
                  fullWidth
                  error={!!errors.discount}
                  helperText={errors.discount?.message}
                  slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Controller
              name="upfront_payment"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  label={t("invoices.upfrontPayment")}
                  type="number"
                  size="small"
                  fullWidth
                  error={!!errors.upfront_payment}
                  helperText={errors.upfront_payment?.message}
                  slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="notes_en"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("invoices.notesEn")}
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="notes_ar"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t("invoices.notesAr")}
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  slotProps={{ input: { dir: "rtl" } }}
                />
              )}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Built-in actions (shown when not in drawer mode) */}
      {!hideActions && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, pt: 1 }}>
          {onCancel && (
            <Button size="small" variant="outlined" onClick={onCancel} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
          )}
          <Button
            type="submit"
            size="small"
            variant="contained"
            disabled={isSubmitting || lineItems.length === 0}
            startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {mode === "create" ? t("common.create") : t("common.save")}
          </Button>
        </Box>
      )}
    </Box>
  );
}
