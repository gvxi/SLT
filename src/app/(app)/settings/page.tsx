"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
} from "@mui/material";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import LanguageOutlinedIcon from "@mui/icons-material/LanguageOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import { useTranslation } from "react-i18next";
import { useUIStore } from "@/store/uiStore";
import { useProfile, useUpdateProfile } from "@/hooks/useProfiles";
import { toast } from "@/store/toastStore";

const NAV_OPTIONS = [
  { key: "dashboard", icon: <DashboardOutlinedIcon sx={{ fontSize: 16 }} /> },
  { key: "tasks", icon: <TaskAltOutlinedIcon sx={{ fontSize: 16 }} /> },
  { key: "products", icon: <Inventory2OutlinedIcon sx={{ fontSize: 16 }} /> },
  { key: "invoices", icon: <ReceiptOutlinedIcon sx={{ fontSize: 16 }} /> },
  { key: "quotations", icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 16 }} /> },
  { key: "customers", icon: <PeopleAltOutlinedIcon sx={{ fontSize: 16 }} /> },
  { key: "settings", icon: <SettingsOutlinedIcon sx={{ fontSize: 16 }} /> },
] as const;

const START_PAGE_OPTIONS = [
  { key: "dashboard", icon: <DashboardOutlinedIcon sx={{ fontSize: 15 }} /> },
  { key: "tasks", icon: <TaskAltOutlinedIcon sx={{ fontSize: 15 }} /> },
  { key: "products", icon: <Inventory2OutlinedIcon sx={{ fontSize: 15 }} /> },
  { key: "invoices", icon: <ReceiptOutlinedIcon sx={{ fontSize: 15 }} /> },
  { key: "quotations", icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 15 }} /> },
  { key: "customers", icon: <PeopleAltOutlinedIcon sx={{ fontSize: 15 }} /> },
] as const;

const DEFAULT_NAV = ["dashboard", "tasks", "products", "invoices"];

/** Thin section header label */
function SectionTitle({ label }: { label: string }) {
  return (
    <Typography
      variant="caption"
      sx={{
        fontSize: 11,
        fontWeight: 600,
        color: "text.disabled",
        letterSpacing: 0.6,
        textTransform: "uppercase",
        display: "block",
        mb: 0.75,
        px: 0.25,
      }}
    >
      {label}
    </Typography>
  );
}

/** Grouped card container */
function SettingGroup({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
        overflow: "hidden",
        mb: 3,
      }}
    >
      {children}
    </Box>
  );
}

/** Single setting row inside a SettingGroup */
function SettingRow({
  icon,
  label,
  description,
  control,
  noDivider,
}: {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  control: React.ReactNode;
  noDivider?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.25,
        borderBottom: noDivider ? "none" : "1px solid",
        borderColor: "divider",
        minHeight: 48,
      }}
    >
      {icon && (
        <Box sx={{ color: "text.secondary", display: "flex", flexShrink: 0 }}>
          {icon}
        </Box>
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
          {label}
        </Typography>
        {description && (
          <Typography variant="caption" sx={{ fontSize: 11, color: "text.disabled" }}>
            {description}
          </Typography>
        )}
      </Box>
      <Box sx={{ flexShrink: 0 }}>{control}</Box>
    </Box>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { themeMode, toggleTheme, language, setLanguage, startPage, setStartPage } = useUIStore();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [navConfig, setNavConfig] = useState<string[]>(DEFAULT_NAV);
  const [navSaving, setNavSaving] = useState(false);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    if (profile?.bottom_nav_config?.length) setNavConfig(profile.bottom_nav_config);
    if (profile?.start_page) {
      setStartPage(profile.start_page);
    }
  }, [profile?.full_name, profile?.bottom_nav_config, profile?.start_page, setStartPage]);

  const handleSaveName = async () => {
    setNameSaving(true);
    try {
      await updateProfile.mutateAsync({ full_name: fullName });
      toast(t("settings.profileSaved"), "success");
    } catch {
      toast(t("settings.profileSaveError"), "error");
    } finally {
      setNameSaving(false);
    }
  };

  const handleStartPageChange = async (page: string) => {
    setStartPage(page);
    try {
      await updateProfile.mutateAsync({ start_page: page });
      toast(t("settings.saved"), "success");
    } catch {
      toast(t("toast.error"), "error");
    }
  };

  const toggleNavItem = (key: string) => {
    setNavConfig((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 2) return prev;
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= 5) return prev;
      return [...prev, key];
    });
  };

  const handleSaveNav = async () => {
    setNavSaving(true);
    try {
      await updateProfile.mutateAsync({ bottom_nav_config: navConfig });
      toast(t("settings.bottomNavSaved"), "success");
    } catch {
      toast(t("settings.bottomNavSaveError"), "error");
    } finally {
      setNavSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        {t("settings.title")}
      </Typography>

      {/* Profile */}
      <SectionTitle label={t("settings.profile")} />
      <SettingGroup>
        <SettingRow
          icon={<PersonOutlinedIcon sx={{ fontSize: 18 }} />}
          label={t("settings.fullName")}
          noDivider
          control={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                size="small"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={profileLoading}
                sx={{ width: 180 }}
                slotProps={{ input: { sx: { fontSize: 13 } } }}
              />
              <Button
                size="small"
                variant="contained"
                onClick={handleSaveName}
                disabled={nameSaving || profileLoading || !fullName.trim()}
                startIcon={nameSaving ? <CircularProgress size={12} color="inherit" /> : undefined}
                sx={{ whiteSpace: "nowrap" }}
              >
                {t("common.save")}
              </Button>
            </Box>
          }
        />
      </SettingGroup>

      {/* Appearance */}
      <SectionTitle label={t("settings.appearance")} />
      <SettingGroup>
        <SettingRow
          icon={themeMode === "dark"
            ? <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />
            : <LightModeOutlinedIcon sx={{ fontSize: 18 }} />}
          label={themeMode === "dark" ? t("settings.darkMode") : t("settings.lightMode")}
          control={
            <Switch size="small" checked={themeMode === "dark"} onChange={toggleTheme} />
          }
        />
        <SettingRow
          icon={<LanguageOutlinedIcon sx={{ fontSize: 18 }} />}
          label={t("settings.language")}
          noDivider
          control={
            <Box sx={{ display: "flex", gap: 0.75 }}>
              {(["en", "ar"] as const).map((lang) => (
                <Button
                  key={lang}
                  size="small"
                  variant={language === lang ? "contained" : "outlined"}
                  onClick={() => setLanguage(lang)}
                  sx={{
                    minWidth: 56,
                    fontSize: 12,
                    py: 0.4,
                    borderColor: "divider",
                    ...(language !== lang && { color: "text.secondary" }),
                  }}
                >
                  {lang === "en" ? "EN" : "AR"}
                </Button>
              ))}
            </Box>
          }
        />
      </SettingGroup>

      {/* App Start Page */}
      <SectionTitle label={t("settings.startPage")} />
      <SettingGroup>
        <SettingRow
          icon={<HomeOutlinedIcon sx={{ fontSize: 18 }} />}
          label={t("settings.startPageLabel")}
          description={t("settings.startPageDesc")}
          noDivider
          control={
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={startPage || "dashboard"}
                onChange={(e) => handleStartPageChange(e.target.value)}
                sx={{ fontSize: 13 }}
              >
                {START_PAGE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.key} value={opt.key} sx={{ fontSize: 13, gap: 1 }}>
                    {t(`nav.${opt.key}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          }
        />
      </SettingGroup>

      {/* Bottom Nav */}
      <SectionTitle label={t("settings.bottomNav")} />
      <SettingGroup>
        {NAV_OPTIONS.map((opt, i) => (
          <SettingRow
            key={opt.key}
            icon={opt.icon}
            label={t(`nav.${opt.key}`)}
            noDivider={i === NAV_OPTIONS.length - 1}
            control={
              <Checkbox
                size="small"
                checked={navConfig.includes(opt.key)}
                onChange={() => toggleNavItem(opt.key)}
                disabled={
                  (navConfig.includes(opt.key) && navConfig.length <= 2) ||
                  (!navConfig.includes(opt.key) && navConfig.length >= 5)
                }
                sx={{ p: 0.5 }}
              />
            }
          />
        ))}
      </SettingGroup>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: -2, mb: 3 }}>
        <Button
          size="small"
          variant="contained"
          onClick={handleSaveNav}
          disabled={navSaving}
          startIcon={navSaving ? <CircularProgress size={12} color="inherit" /> : undefined}
        >
          {t("common.save")}
        </Button>
      </Box>
    </Box>
  );
}
