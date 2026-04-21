"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import { useTranslation } from "react-i18next";
import { useInvoices, useDeleteInvoice } from "@/hooks/useInvoices";
import StatusChip from "@/components/documents/StatusChip";
import InvoiceDrawer from "@/components/documents/InvoiceDrawer";
import OmrSign from "@/components/OmrSign";
import EmptyState from "@/components/shared/EmptyState";
import type { Invoice, InvoiceStatus } from "@/types";

const STATUS_TABS: (InvoiceStatus | "all")[] = ["all", "draft", "sent", "paid", "overdue", "cancelled"];

function calcTotal(inv: Invoice): number {
  if (!inv.invoice_items?.length) return 0;
  const sub = inv.invoice_items.reduce((s, it) => s + it.qty * it.unit_price, 0);
  return sub - inv.discount + sub * (inv.tax_pct / 100);
}

export default function InvoicesPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [tabIndex, setTabIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInvoiceId, setDrawerInvoiceId] = useState<string | null>(null);

  const openDrawer = (id: string | null) => {
    setDrawerInvoiceId(id);
    setDrawerOpen(true);
  };

  // Slide bottom nav out when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.classList.add("invoice-drawer-open");
    } else {
      document.body.classList.remove("invoice-drawer-open");
    }
    return () => document.body.classList.remove("invoice-drawer-open");
  }, [drawerOpen]);

  const activeStatus = STATUS_TABS[tabIndex];
  const { data: invoices = [], isLoading } = useInvoices(activeStatus !== "all" ? { status: activeStatus } : {});
  const deleteInvoice = useDeleteInvoice();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.client?.name_en.toLowerCase().includes(q) ||
        (inv.client?.name_ar && inv.client.name_ar.toLowerCase().includes(q))
    );
  }, [invoices, search]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteInvoice.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t("nav.invoices")}
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => openDrawer(null)}
        >
          {t("invoices.newInvoice")}
        </Button>
      </Box>

      {/* Status tabs */}
      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider", minHeight: 36, "& .MuiTab-root": { minHeight: 36 } }}
      >
        {STATUS_TABS.map((s) => (
          <Tab
            key={s}
            label={s === "all" ? t("common.all") : t(`invoices.${s}`)}
            sx={{ textTransform: "none", fontSize: 13 }}
          />
        ))}
      </Tabs>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 260 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {/* List */}
      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={44} variant="rectangular" sx={{ borderRadius: 1 }} />)}
        </Box>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ReceiptLongOutlinedIcon}
          title={t("common.noData")}
          actionLabel={t("invoices.newInvoice")}
          onAction={() => openDrawer(null)}
        />
      ) : isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {filtered.map((inv) => (
            <Box
              key={inv.id}
              onClick={() => openDrawer(inv.id)}
              sx={{
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
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                  {inv.invoice_number}
                </Typography>
                <StatusChip status={inv.status} />
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
                {(isAr && inv.client?.name_ar) ? inv.client.name_ar : inv.client?.name_en ?? "—"}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75 }}>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>{inv.due_date}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                  <OmrSign size="0.8em" />{calcTotal(inv).toFixed(3)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 600, color: "text.secondary", fontSize: 12, bgcolor: "action.hover", borderBottom: "1px solid", borderColor: "divider" } }}>
                <TableCell>{t("invoices.invoiceNumber")}</TableCell>
                <TableCell>{t("invoices.client")}</TableCell>
                <TableCell>{t("invoices.issueDate")}</TableCell>
                <TableCell>{t("invoices.dueDate")}</TableCell>
                <TableCell align="right">{t("invoices.total")}</TableCell>
                <TableCell>{t("common.status")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow
                  key={inv.id}
                  onClick={() => openDrawer(inv.id)}
                  sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" }, "& td": { fontSize: 13 } }}
                >
                  <TableCell sx={{ fontFamily: "monospace", fontWeight: 500 }}>
                    {inv.invoice_number}
                  </TableCell>
                  <TableCell>
                    {(isAr && inv.client?.name_ar) ? inv.client.name_ar : inv.client?.name_en ?? "—"}
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{inv.issue_date}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{inv.due_date}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    <OmrSign size="0.8em" />{calcTotal(inv).toFixed(3)}
                  </TableCell>
                  <TableCell><StatusChip status={inv.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Invoice drawer */}
      <InvoiceDrawer
        open={drawerOpen}
        invoiceId={drawerInvoiceId}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Delete confirm (list-level, separate from drawer's own delete) */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600 }}>{t("common.confirmDelete")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ fontSize: 13, color: "text.secondary" }}>
            {t("invoices.deleteConfirm", { number: deleteTarget?.invoice_number })}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setDeleteTarget(null)}>{t("common.cancel")}</Button>
          <Button size="small" variant="contained" color="error" onClick={handleConfirmDelete} disabled={deleteInvoice.isPending}>
            {t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
