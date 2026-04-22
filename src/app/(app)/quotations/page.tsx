"use client";

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import { useTranslation } from "react-i18next";
import { useQuotations } from "@/hooks/useQuotations";
import StatusChip from "@/components/documents/StatusChip";
import QuotationDrawer from "@/components/documents/QuotationDrawer";
import OmrSign from "@/components/OmrSign";
import EmptyState from "@/components/shared/EmptyState";
import type { Quotation, QuotationStatus } from "@/types";

const STATUS_OPTIONS: (QuotationStatus | "all")[] = ["all", "draft", "sent", "accepted", "rejected", "expired"];

function calcTotal(q: Quotation): number {
  if (!q.quotation_items?.length) return 0;
  const sub = q.quotation_items.reduce((s, it) => s + it.qty * it.unit_price, 0);
  return sub - q.discount + sub * (q.tax_pct / 100);
}

export default function QuotationsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [activeStatus, setActiveStatus] = useState<QuotationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("desc");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerQuotationId, setDrawerQuotationId] = useState<string | null>(null);

  const openDrawer = (id: string | null) => {
    setDrawerQuotationId(id);
    setDrawerOpen(true);
  };

  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      openDrawer(null);
      router.replace("/quotations");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.classList.add("quotation-drawer-open");
    } else {
      document.body.classList.remove("quotation-drawer-open");
    }
    return () => document.body.classList.remove("quotation-drawer-open");
  }, [drawerOpen]);

  const { data: quotations = [], isLoading } = useQuotations(
    activeStatus !== "all" ? { status: activeStatus } : {}
  );

  const filtered = useMemo(() => {
    let list = [...quotations];
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (qt) =>
          qt.quotation_number?.toLowerCase().includes(q) ||
          qt.client?.name_en.toLowerCase().includes(q) ||
          (qt.client?.name_ar && qt.client.name_ar.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      const da = new Date(a.issue_date).getTime();
      const db = new Date(b.issue_date).getTime();
      return sort === "desc" ? db - da : da - db;
    });
    return list;
  }, [quotations, search, sort]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t("nav.quotations")}
          {filtered.length > 0 && (
            <Typography component="span" variant="body2" sx={{ ml: 1, color: "text.secondary", fontWeight: 400 }}>
              {filtered.length}
            </Typography>
          )}
        </Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openDrawer(null)}>
          {t("quotations.newQuotation")}
        </Button>
      </Box>

      {/* Filters row */}
      <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 160 }}
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

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>{t("common.status")}</InputLabel>
          <Select
            value={activeStatus}
            label={t("common.status")}
            onChange={(e) => setActiveStatus(e.target.value as typeof activeStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s === "all" ? t("common.all") : t(`quotations.${s}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={sort}
          onChange={(_, v) => v && setSort(v)}
        >
          <ToggleButton value="desc" sx={{ px: 1.25 }}>
            <ArrowDownwardIcon sx={{ fontSize: 15, mr: 0.5 }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, fontSize: 12 }}>
              {t("tasks.newest", { defaultValue: "Newest" })}
            </Box>
          </ToggleButton>
          <ToggleButton value="asc" sx={{ px: 1.25 }}>
            <ArrowUpwardIcon sx={{ fontSize: 15, mr: 0.5 }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, fontSize: 12 }}>
              {t("tasks.oldest", { defaultValue: "Oldest" })}
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* List */}
      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={44} variant="rectangular" sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={RequestQuoteOutlinedIcon}
          title={t("common.noData")}
          actionLabel={t("quotations.newQuotation")}
          onAction={() => openDrawer(null)}
        />
      ) : isMobile ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {filtered.map((qt) => (
            <Box
              key={qt.id}
              onClick={() => openDrawer(qt.id)}
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
                  {qt.quotation_number}
                </Typography>
                <StatusChip status={qt.status} />
              </Box>
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
                {(isAr && qt.client?.name_ar) ? qt.client.name_ar : qt.client?.name_en ?? "—"}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75 }}>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>{qt.expiry_date}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                  <OmrSign size="0.8em" />{calcTotal(qt).toFixed(3)}
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
                <TableCell>{t("quotations.quotationNumber")}</TableCell>
                <TableCell>{t("invoices.client")}</TableCell>
                <TableCell>{t("invoices.issueDate")}</TableCell>
                <TableCell>{t("quotations.expiryDate")}</TableCell>
                <TableCell align="right">{t("invoices.total")}</TableCell>
                <TableCell>{t("common.status")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((qt) => (
                <TableRow
                  key={qt.id}
                  onClick={() => openDrawer(qt.id)}
                  sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" }, "& td": { fontSize: 13 } }}
                >
                  <TableCell sx={{ fontFamily: "monospace", fontWeight: 500 }}>{qt.quotation_number}</TableCell>
                  <TableCell>{(isAr && qt.client?.name_ar) ? qt.client.name_ar : qt.client?.name_en ?? "—"}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{qt.issue_date}</TableCell>
                  <TableCell sx={{ color: "text.secondary" }}>{qt.expiry_date}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    <OmrSign size="0.8em" />{calcTotal(qt).toFixed(3)}
                  </TableCell>
                  <TableCell><StatusChip status={qt.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Quotation drawer */}
      <QuotationDrawer open={drawerOpen} quotationId={drawerQuotationId} onClose={() => setDrawerOpen(false)} />
    </Box>
  );
}
