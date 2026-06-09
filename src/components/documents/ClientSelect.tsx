"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlined";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useTranslation } from "react-i18next";
import type { Client } from "@/types";

const ADD_NEW_ID = "__add_new__";

interface Props {
  value: string | null;
  onChange: (clientId: string | null) => void;
  onCustomName?: (name: string) => void;
  error?: boolean;
  helperText?: string;
}

export default function ClientSelect({ value, onChange, onCustomName, error, helperText }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const getLabel = useCallback(
    (c: Client) => (isAr && c.name_ar ? c.name_ar : c.name_en),
    [isAr]
  );

  const selected = clients.find((c) => c.id === value) ?? null;

  // Explicitly manage inputValue so it updates when clients load asynchronously
  const [inputValue, setInputValue] = useState(() =>
    selected ? getLabel(selected) : ""
  );

  useEffect(() => {
    if (selected) {
      setInputValue(getLabel(selected));
    } else if (!value) {
      setInputValue("");
    }
    // If value is set but clients haven't loaded yet, keep existing inputValue
  }, [selected, value, getLabel]);

  type AddNewOption = { id: typeof ADD_NEW_ID; name_en: string; name_ar: null; email: string; phone: string; address: string; customer_type: null; notes: null; lat: null; lng: null; created_at: string; updated_at: string };
  const options: (Client | AddNewOption)[] = [
    ...clients,
    { id: ADD_NEW_ID, name_en: t("invoices.addNewClient"), name_ar: null, email: "", phone: "", address: "", customer_type: null, notes: null, lat: null, lng: null, created_at: "", updated_at: "" },
  ];

  const handleChange = (_: unknown, val: (typeof options)[number] | null) => {
    if (!val) { onChange(null); return; }
    if (val.id === ADD_NEW_ID) { setDialogOpen(true); return; }
    onCustomName?.(""); // clear custom name when existing client selected
    onChange(val.id);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const client = await createClient.mutateAsync({ name_en: newName.trim(), email: newEmail.trim(), phone: newPhone.trim() });
    onChange(client.id);
    setDialogOpen(false);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
  };

  return (
    <>
      <Autocomplete
        options={options}
        value={selected}
        onChange={handleChange}
        loading={isLoading}
        inputValue={inputValue}
        onInputChange={(_, newVal, reason) => {
          // Let the user type freely; on "reset" (value change), our useEffect handles it
          if (reason !== "reset") {
            setInputValue(newVal);
            // Notify parent of free-text name when no client is selected
            if (!value) onCustomName?.(newVal);
          }
        }}
        getOptionLabel={(o) => {
          if (o.id === ADD_NEW_ID) return t("invoices.addNewClient");
          return (isAr && o.name_ar) ? o.name_ar : o.name_en;
        }}
        isOptionEqualToValue={(o, v) => o.id === v.id}
        renderOption={(props, option) => {
          const { key, ...rest } = props as { key: React.Key } & React.HTMLAttributes<HTMLLIElement>;
          if (option.id === ADD_NEW_ID) {
            return (
              <li key={key} {...rest}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "primary.main", py: 0.25 }}>
                  <AddIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2" sx={{ fontSize: 13 }}>{t("invoices.addNewClient")}</Typography>
                </Box>
              </li>
            );
          }
          return (
            <li key={key} {...rest}>
              <Box>
                <Typography variant="body2" sx={{ fontSize: 13 }}>
                  {(isAr && option.name_ar) ? option.name_ar : option.name_en}
                </Typography>
                {option.email && (
                  <Typography variant="caption" sx={{ color: "text.disabled", fontSize: 11 }}>
                    {option.email}
                  </Typography>
                )}
              </Box>
            </li>
          );
        }}
        renderInput={({ slotProps: acSlotProps, ...rest }) => (
          <TextField
            {...rest}
            label={t("invoices.client")}
            size="small"
            error={error}
            helperText={helperText}
            slotProps={{
              input: {
                ...acSlotProps.input,
                startAdornment: (
                  <>
                    <PersonOutlineIcon sx={{ fontSize: 16, color: "text.disabled", mr: 0.5, flexShrink: 0 }} />
                    {acSlotProps.input.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {isLoading ? <CircularProgress size={14} /> : null}
                    {acSlotProps.input.endAdornment}
                  </>
                ),
              },
              htmlInput: acSlotProps.htmlInput,
              inputLabel: acSlotProps.inputLabel,
            }}
          />
        )}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 15, fontWeight: 600, pb: 1 }}>
          {t("invoices.addNewClient")}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          <TextField
            label={t("invoices.clientName")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            size="small"
            autoFocus
            fullWidth
          />
          <TextField
            label={t("auth.email")}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            size="small"
            fullWidth
            type="email"
          />
          <TextField
            label={t("invoices.phone")}
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            size="small"
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button size="small" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleCreate}
            disabled={!newName.trim() || createClient.isPending}
          >
            {t("common.create")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
