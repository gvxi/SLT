"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  CircularProgress,
  Divider,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { useTranslation } from "react-i18next";
import { useUIStore } from "@/store/uiStore";
import { useProfile, useUpdateProfile } from "@/hooks/useProfiles";

const NAV_OPTIONS = [
  { key: "dashboard", icon: <DashboardOutlinedIcon sx={{ fontSize: 18 }} /> },
  { key: "tasks", icon: <TaskAltOutlinedIcon sx={{ fontSize: 18 }} /> },
  { key: "products", icon: <Inventory2OutlinedIcon sx={{ fontSize: 18 }} /> },
  { key: "invoices", icon: <ReceiptOutlinedIcon sx={{ fontSize: 18 }} /> },
  { key: "quotations", icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 18 }} /> },
  { key: "settings", icon: <SettingsOutlinedIcon sx={{ fontSize: 18 }} /> },
] as const;

const DEFAULT_NAV = ["dashboard", "tasks", "products", "invoices"];

function SectionLabel({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      sx={{ fontSize: 11, fontWeight: 600, color: "text.disabled", letterSpacing: 0.5, textTransform: "uppercase", display: "block", mb: 1.5 }}
    >
      {label}
    </Typography>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { themeMode, toggleTheme, language, setLanguage } = useUIStore();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [navConfig, setNavConfig] = useState<string[]>(DEFAULT_NAV);
  const [navSaveStatus, setNavSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    if (profile?.bottom_nav_config?.length) setNavConfig(profile.bottom_nav_config);
  }, [profile?.full_name, profile?.bottom_nav_config]);

  const handleSaveProfile = async () => {
    setSaveStatus("saving");
    try {
      await updateProfile.mutateAsync({ full_name: fullName });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleSaveNav = async () => {
    setNavSaveStatus("saving");
    try {
      await updateProfile.mutateAsync({ bottom_nav_config: navConfig });
      setNavSaveStatus("saved");
      setTimeout(() => setNavSaveStatus("idle"), 2000);
    } catch {
      setNavSaveStatus("error");
      setTimeout(() => setNavSaveStatus("idle"), 3000);
    }
  };

  const toggleNavItem = (key: string) => {
    setNavConfig((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 2) return prev;
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= 4) return prev;
      return [...prev, key];
    });
  };

  return (
    <Box sx={{ maxWidth: 520 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        {t("settings.title")}
      </Typography>

      {/* Profile */}
      <Box sx={{ mb: 3 }}>
        <SectionLabel label={t("settings.profile")} />
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
            p: 2.5,
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            label={t("settings.fullName")}
            size="small"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={profileLoading}
            fullWidth
            slotProps={{ inputLabel: { sx: { fontSize: 13 } }, input: { sx: { fontSize: 13 } } }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Button
              size="small"
              variant="contained"
              onClick={handleSaveProfile}
              disabled={saveStatus === "saving" || profileLoading || !fullName.trim()}
              startIcon={saveStatus === "saving" ? <CircularProgress size={13} color="inherit" /> : undefined}
            >
              {t("settings.saveProfile")}
            </Button>
            {saveStatus === "saved" && (
              <Typography variant="caption" sx={{ color: "success.main", fontSize: 12 }}>
                {t("settings.profileSaved")}
              </Typography>
            )}
            {saveStatus === "error" && (
              <Typography variant="caption" sx={{ color: "error.main", fontSize: 12 }}>
                {t("settings.profileSaveError")}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Appearance */}
      <Box sx={{ mb: 3 }}>
        <SectionLabel label={t("settings.appearance")} />
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 1.75,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              {themeMode === "dark" ? (
                <DarkModeOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              ) : (
                <LightModeOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              )}
              <Typography variant="body2" sx={{ fontSize: 13 }}>
                {themeMode === "dark" ? t("settings.darkMode") : t("settings.lightMode")}
              </Typography>
            </Box>
            <Switch
              size="small"
              checked={themeMode === "dark"}
              onChange={toggleTheme}
            />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Language */}
      <Box>
        <SectionLabel label={t("settings.language")} />
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 1.75,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {(["en", "ar"] as const).map((lang) => (
              <Button
                key={lang}
                size="small"
                variant={language === lang ? "contained" : "outlined"}
                onClick={() => setLanguage(lang)}
                sx={{
                  minWidth: 60,
                  fontSize: 12,
                  py: 0.5,
                  borderColor: "divider",
                  ...(language !== lang && { color: "text.secondary" }),
                }}
              >
                {lang === "en" ? "English" : "العربية"}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Bottom Navigation */}
      <Box>
        <SectionLabel label={t("settings.bottomNav")} />
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
            bgcolor: "background.paper",
            p: 2.5,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="caption" sx={{ fontSize: 12, color: "text.secondary" }}>
            {t("settings.bottomNavDesc")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {NAV_OPTIONS.map((opt) => (
              <FormControlLabel
                key={opt.key}
                control={
                  <Checkbox
                    size="small"
                    checked={navConfig.includes(opt.key)}
                    onChange={() => toggleNavItem(opt.key)}
                    disabled={
                      (navConfig.includes(opt.key) && navConfig.length <= 2) ||
                      (!navConfig.includes(opt.key) && navConfig.length >= 4)
                    }
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {opt.icon}
                    <Typography variant="body2" sx={{ fontSize: 13 }}>
                      {t(`nav.${opt.key}`)}
                    </Typography>
                  </Box>
                }
                sx={{ ml: 0, py: 0.25 }}
              />
            ))}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Button
              size="small"
              variant="contained"
              onClick={handleSaveNav}
              disabled={navSaveStatus === "saving"}
              startIcon={navSaveStatus === "saving" ? <CircularProgress size={13} color="inherit" /> : undefined}
            >
              {t("settings.saveProfile")}
            </Button>
            {navSaveStatus === "saved" && (
              <Typography variant="caption" sx={{ color: "success.main", fontSize: 12 }}>
                {t("settings.bottomNavSaved")}
              </Typography>
            )}
            {navSaveStatus === "error" && (
              <Typography variant="caption" sx={{ color: "error.main", fontSize: 12 }}>
                {t("settings.bottomNavSaveError")}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

