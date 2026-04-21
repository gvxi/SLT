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
} from "@mui/material";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { useTranslation } from "react-i18next";
import { useUIStore } from "@/store/uiStore";
import { useProfile, useUpdateProfile } from "@/hooks/useProfiles";

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

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

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
    </Box>
  );
}

