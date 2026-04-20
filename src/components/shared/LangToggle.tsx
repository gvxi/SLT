"use client";

import { IconButton, Typography, Box } from "@mui/material";
import { useUIStore } from "@/store/uiStore";

export default function LangToggle() {
  const { language, setLanguage } = useUIStore();

  const toggle = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

  return (
    <IconButton onClick={toggle} size="small" sx={{ borderRadius: 1, px: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: language === "en" ? 700 : 400,
            fontSize: 12,
            color: language === "en" ? "primary.main" : "text.secondary",
          }}
        >
          EN
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 12, color: "text.disabled" }}>
          |
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: language === "ar" ? 700 : 400,
            fontSize: 12,
            color: language === "ar" ? "primary.main" : "text.secondary",
          }}
        >
          AR
        </Typography>
      </Box>
    </IconButton>
  );
}
