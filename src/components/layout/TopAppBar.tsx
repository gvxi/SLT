"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { useLogout } from "@/hooks/useAuth";

interface TopAppBarProps {
  onMenuClick: () => void;
}

export default function TopAppBar({ onMenuClick }: TopAppBarProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const logout = useLogout();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleCloseMenu();
    await logout.mutateAsync();
    router.push("/login");
  };

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
          sx={{ mr: 1.5 }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
          <Image
            src="/images/logo.png"
            alt="SLT"
            width={32}
            height={32}
            style={{ objectFit: "contain" }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton size="small">
            <NotificationsOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton size="small">
            <HistoryOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton size="small" onClick={handleOpenMenu}>
            <AccountCircleIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Toolbar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        slotProps={{
          paper: { sx: { minWidth: 160, mt: 0.5 } },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuItem
          onClick={() => { handleCloseMenu(); router.push("/settings"); }}
          sx={{ fontSize: 14 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <SettingsOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {t("settings.title")}
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={handleLogout}
          disabled={logout.isPending}
          sx={{ fontSize: 14, color: "error.main" }}
        >
          <ListItemIcon sx={{ minWidth: 32, color: "error.main" }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          {t("auth.logout")}
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
}
