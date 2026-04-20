"use client";

import { Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { InvoiceStatus, QuotationStatus } from "@/types";

type AnyStatus = InvoiceStatus | QuotationStatus;

const STATUS_COLORS: Record<AnyStatus, { bg: string; color: string }> = {
  draft:     { bg: "#f5f5f5",  color: "#616161" },
  sent:      { bg: "#e3f2fd",  color: "#1565c0" },
  paid:      { bg: "#e8f5e9",  color: "#2e7d32" },
  overdue:   { bg: "#fce4ec",  color: "#c62828" },
  cancelled: { bg: "#f5f5f5",  color: "#9e9e9e" },
  accepted:  { bg: "#e8f5e9",  color: "#2e7d32" },
  rejected:  { bg: "#fce4ec",  color: "#c62828" },
  expired:   { bg: "#fff3e0",  color: "#e65100" },
};

interface Props {
  status: AnyStatus;
  size?: "small" | "medium";
}

export default function StatusChip({ status, size = "small" }: Props) {
  const { t } = useTranslation();
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.draft;

  const labelKey = `invoices.${status}` as const;
  const label = t(labelKey, { defaultValue: status });

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        height: size === "small" ? 20 : 28,
        fontSize: size === "small" ? 11 : 13,
        fontWeight: 500,
        borderRadius: 1,
        bgcolor: colors.bg,
        color: colors.color,
        border: "none",
      }}
    />
  );
}
