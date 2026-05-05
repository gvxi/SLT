"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  CircularProgress,
  Badge,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AddCircleOutlinedIcon from "@mui/icons-material/AddCircleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { useLogout } from "@/hooks/useAuth";
import { useLogs } from "@/hooks/useLogs";
import { useUnreadCount } from "@/hooks/useAlerts";
import AlertsPopover from "@/components/layout/AlertsPopover";
import { useUIStore } from "@/store/uiStore";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ACTION_ICON: Record<string, React.ReactNode> = {
  created: <AddCircleOutlinedIcon sx={{ fontSize: 16, color: "success.main" }} />,
  updated: <EditOutlinedIcon sx={{ fontSize: 16, color: "info.main" }} />,
  deleted: <DeleteOutlinedIcon sx={{ fontSize: 16, color: "error.main" }} />,
};

interface TopAppBarProps {
  onMenuClick: () => void;
}

export default function TopAppBar({ onMenuClick }: TopAppBarProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const logout = useLogout();
  const { themeMode, toggleTheme, language, setLanguage } = useUIStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logsAnchor, setLogsAnchor] = useState<null | HTMLElement>(null);
  const [alertsAnchor, setAlertsAnchor] = useState<null | HTMLElement>(null);
  const { data: logsData, isLoading: logsLoading, isError: logsError } = useLogs({ limit: 10 });
  const unreadCount = useUnreadCount();

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="SLT" style={{ height: 32, width: "auto", objectFit: "contain" }} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton size="small" onClick={(e) => setAlertsAnchor(e.currentTarget)}>
            <Badge badgeContent={unreadCount || undefined} color="error" max={99}>
              <NotificationsOutlinedIcon sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>
          <IconButton size="small" onClick={(e) => setLogsAnchor(e.currentTarget)}>
            <HistoryOutlinedIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton size="small" onClick={handleOpenMenu}>
            <AccountCircleIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      </Toolbar>

      {/* Alerts Popover */}
      <AlertsPopover anchor={alertsAnchor} onClose={() => setAlertsAnchor(null)} />

      {/* Logs Popover */}
      <Popover
        open={Boolean(logsAnchor)}
        anchorEl={logsAnchor}
        onClose={() => setLogsAnchor(null)}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        slotProps={{ paper: { sx: { width: 360, mt: 0.5 } } }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Recent Activity</Typography>
          <Button size="small" onClick={() => { setLogsAnchor(null); router.push("/logs"); }}>
            View all
          </Button>
        </Box>
        <Divider />
        {logsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={20} />
          </Box>
        ) : logsError ? (
          <Typography variant="body2" color="error" sx={{ px: 2, py: 2 }}>
            Failed to load activity logs
          </Typography>
        ) : !logsData?.data?.length ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 2 }}>No activity yet</Typography>
        ) : (
          <List disablePadding dense>
            {logsData.data.map((log) => (
              <ListItem key={log.id} alignItems="flex-start" sx={{ px: 2, py: 0.75, gap: 1 }}>
                <Box sx={{ mt: 0.25, flexShrink: 0 }}>{ACTION_ICON[log.action]}</Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                      <Typography variant="body2" sx={{ fontSize: 13 }}>{log.summary}</Typography>
                      <Chip label={log.entity_type} size="small" sx={{ fontSize: 10, height: 18 }} />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {log.profile?.full_name ? `${log.profile.full_name} · ` : ""}{timeAgo(log.created_at)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Popover>

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
        {/* Language + theme quick toggles */}
        <Box sx={{ px: 2, py: 0.75, display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            size="small"
            variant={language === "en" ? "contained" : "outlined"}
            onClick={() => { setLanguage("en"); i18n.changeLanguage("en"); }}
            sx={{ minWidth: 36, px: 1, py: 0.25, fontSize: 12 }}
          >
            EN
          </Button>
          <Button
            size="small"
            variant={language === "ar" ? "contained" : "outlined"}
            onClick={() => { setLanguage("ar"); i18n.changeLanguage("ar"); }}
            sx={{ minWidth: 36, px: 1, py: 0.25, fontSize: 12 }}
          >
            AR
          </Button>
          <Box sx={{ flex: 1 }} />
          <IconButton size="small" onClick={toggleTheme} sx={{ color: "text.primary" }}>
            {themeMode === "dark" ? (
              <LightModeOutlinedIcon sx={{ fontSize: 18 }} />
            ) : (
              <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Box>
        <Divider sx={{ my: 0.5 }} />
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
