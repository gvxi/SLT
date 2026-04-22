"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  Typography,
  Skeleton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useClients } from "@/hooks/useClients";
import ClientDrawer from "@/components/clients/ClientDrawer";
import CollapsibleFilters from "@/components/shared/CollapsibleFilters";
import type { Client, CustomerType } from "@/types";

const TYPE_ICONS: Record<CustomerType, React.ReactNode> = {
  customer: <PersonOutlineIcon sx={{ fontSize: 16 }} />,
  company: <BusinessOutlinedIcon sx={{ fontSize: 16 }} />,
  government: <AccountBalanceOutlinedIcon sx={{ fontSize: 16 }} />,
};

const TYPE_COLOR: Record<CustomerType, "default" | "primary" | "secondary"> = {
  customer: "default",
  company: "primary",
  government: "secondary",
};

function CustomerCard({
  client,
  isAr,
  onClick,
}: {
  client: Client;
  isAr: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const name = isAr && client.name_ar ? client.name_ar : client.name_en;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
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
      {/* Type indicator */}
      <Box
        sx={{
          mt: 0.25,
          width: 28,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 1,
          bgcolor: "action.selected",
          color: "text.secondary",
          flexShrink: 0,
        }}
      >
        {client.customer_type
          ? TYPE_ICONS[client.customer_type]
          : <PersonOutlineIcon sx={{ fontSize: 16 }} />}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: Name + type chip */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "space-between" }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {name}
          </Typography>
          {client.customer_type && (
            <Chip
              label={t(`customers.type_${client.customer_type}`)}
              size="small"
              color={TYPE_COLOR[client.customer_type]}
              variant="outlined"
              sx={{ height: 20, fontSize: 11, "& .MuiChip-label": { px: 0.75 }, flexShrink: 0 }}
            />
          )}
        </Box>

        {/* Row 2: Phone + email + location */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.4, flexWrap: "wrap" }}>
          {client.phone && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
              <PhoneIcon sx={{ fontSize: 12, color: "text.disabled" }} />
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 12 }}>
                {client.phone}
              </Typography>
            </Box>
          )}
          {client.email && (
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 12 }} noWrap>
              {client.email}
            </Typography>
          )}
          {client.lat != null && client.lng != null && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
              <LocationOnOutlinedIcon sx={{ fontSize: 12, color: "text.disabled" }} />
              <Typography variant="caption" sx={{ color: "text.secondary", fontSize: 12 }}>
                {client.lat.toFixed(4)}, {client.lng.toFixed(4)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Row 3: Notes */}
        {client.notes && (
          <Typography
            variant="caption"
            sx={{ color: "text.disabled", fontSize: 11, display: "block", mt: 0.25 }}
            noWrap
          >
            {client.notes}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function CustomersPageInner() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";
  const typeFilter = searchParams.get("type") ?? "";
  const openId = searchParams.get("id");

  const [drawerClientId, setDrawerClientId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: clients = [], isLoading } = useClients();

  const setParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      const p = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === "") p.delete(k);
        else p.set(k, v);
      }
      router.replace(`${pathname}?${p.toString()}`);
    },
    [searchParams, router, pathname]
  );

  // Handle ?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setIsCreating(true);
      setDrawerClientId(null);
      setDrawerOpen(true);
      const p = new URLSearchParams(searchParams.toString());
      p.delete("new");
      router.replace(`${pathname}?${p.toString()}`);
    }
  }, [searchParams, router, pathname]);

  // Handle ?id=xxx
  useEffect(() => {
    if (openId) {
      setIsCreating(false);
      setDrawerClientId(openId);
      setDrawerOpen(true);
    }
  }, [openId]);

  const openCreate = () => {
    setIsCreating(true);
    setDrawerClientId(null);
    setDrawerOpen(true);
  };

  const openEdit = (client: Client) => {
    setIsCreating(false);
    setDrawerClientId(client.id);
    setDrawerOpen(true);
    setParam({ id: client.id });
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerClientId(null);
    setIsCreating(false);
    if (openId) {
      const p = new URLSearchParams(searchParams.toString());
      p.delete("id");
      router.replace(`${pathname}?${p.toString()}`);
    }
  };

  // Filter
  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name_en.toLowerCase().includes(q) ||
      (c.name_ar ?? "").toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q);
    const matchType = !typeFilter || c.customer_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t("nav.customers")}
          {clients.length > 0 && (
            <Typography component="span" variant="body2" sx={{ ml: 1, color: "text.secondary", fontWeight: 400 }}>
              {filtered.length}
            </Typography>
          )}
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={openCreate}
        >
          {t("customers.newCustomer")}
        </Button>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 1.5 }}>
        <TextField
          size="small"
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => setParam({ search: e.target.value || undefined })}
          fullWidth
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

      {/* Collapsible filters */}
      <CollapsibleFilters activeCount={typeFilter ? 1 : 0}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t("customers.type")}</InputLabel>
          <Select
            value={typeFilter}
            label={t("customers.type")}
            onChange={(e) => setParam({ type: e.target.value || undefined })}
          >
            <MenuItem value="">{t("common.all")}</MenuItem>
            <MenuItem value="customer">{t("customers.type_customer")}</MenuItem>
            <MenuItem value="company">{t("customers.type_company")}</MenuItem>
            <MenuItem value="government">{t("customers.type_government")}</MenuItem>
          </Select>
        </FormControl>
      </CollapsibleFilters>

      {/* List */}
      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={66} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {clients.length === 0 ? t("customers.empty") : t("common.noData")}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {filtered.map((client) => (
            <CustomerCard
              key={client.id}
              client={client}
              isAr={isAr}
              onClick={() => openEdit(client)}
            />
          ))}
        </Box>
      )}

      <ClientDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        clientId={isCreating ? null : drawerClientId}
      />
    </Box>
  );
}

export default function CustomersPage() {
  return (
    <Suspense>
      <CustomersPageInner />
    </Suspense>
  );
}
