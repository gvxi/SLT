"use client";

import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LangToggle from "@/components/shared/LangToggle";

const routeTitles: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/tasks": "nav.tasks",
  "/products": "nav.products",
  "/invoices": "nav.invoices",
  "/quotations": "nav.quotations",
  "/settings": "settings.title",
};

interface TopAppBarProps {
  onMenuClick: () => void;
}

export default function TopAppBar({ onMenuClick }: TopAppBarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const titleKey =
    Object.entries(routeTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "nav.dashboard";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: "background.paper",
        color: "text.primary",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ minHeight: 56 }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flex: 1, fontSize: 18, fontWeight: 600 }}>
          {t(titleKey)}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <LangToggle />
          <IconButton size="small">
            <AccountCircleIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
